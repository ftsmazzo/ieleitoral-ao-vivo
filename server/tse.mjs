import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { UFS, classificar, margem, somar } from "../shared/apuracao.mjs"

const raiz = dirname(fileURLToPath(import.meta.url))
const primeiro = JSON.parse(readFileSync(join(raiz, "..", "data", "primeiro-turno.json"), "utf8"))
const exteriorFixo = JSON.parse(readFileSync(join(raiz, "..", "data", "exterior-primeiro.json"), "utf8"))
const censoPrimeiro = JSON.parse(readFileSync(join(raiz, "..", "data", "censo-primeiro.json"), "utf8"))
const base = new Map(primeiro.ufs.map((linha) => [linha.uf, linha]))
const JAPAO = new Set(["29742", "30198", "30627"])

const ELEICAO = "6258"
const HOST = "https://resultados.tse.jus.br/oficial/ele2026"

const cache = new Map()

function urlDe(uf) {
  const codigo = uf.toLowerCase()
  return `${HOST}/${ELEICAO}/dados/${codigo}/${codigo}-c0001-e00${ELEICAO}-u.json`
}

function urlCidade(cd) {
  return `${HOST}/${ELEICAO}/dados/zz/zz${cd}-c0001-e00${ELEICAO}-u.json`
}

function nomeProprio(nome) {
  return String(nome || "")
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|[\s'-])(\p{L})/gu, (_, separador, letra) => separador + letra.toLocaleUpperCase("pt-BR"))
}

function numero(valor) {
  if (valor == null || valor === "") return 0
  if (typeof valor === "number") return valor
  const limpo = String(valor).replace(/\./g, "").replace(",", ".")
  const n = Number(limpo)
  return Number.isFinite(n) ? n : 0
}

function censoDe(arquivo) {
  if (!arquivo?.v || !arquivo?.e) return null
  const brancos = numero(arquivo.v.vb)
  const nulos = numero(arquivo.v.tvn)
  const abstencao = numero(arquivo.e.a)
  const votosTotais = numero(arquivo.v.tv)
  const aptos = numero(arquivo.e.est)
  if (brancos + nulos + abstencao + votosTotais === 0) return null
  return {
    brancos,
    nulos,
    abstencao,
    votos: votosTotais,
    aptos,
    pBrancos: numero(arquivo.v.pvbn),
    pNulos: numero(arquivo.v.ptvnn),
    pAbstencao: numero(arquivo.e.pan),
  }
}

function candidato(arquivo, numeroCandidato) {
  const grupos = arquivo?.carg?.[0]?.agr || []
  for (const grupo of grupos) {
    for (const partido of grupo.par || []) {
      for (const cand of partido.cand || []) {
        if (String(cand.n) === String(numeroCandidato)) return numero(cand.vap)
      }
    }
  }
  return 0
}

async function baixar(url) {
  const anterior = cache.get(url)
  const headers = {
    Accept: "application/json",
    "User-Agent": "IEleitoralAoVivo/1.0",
  }
  if (anterior?.etag) headers["If-None-Match"] = anterior.etag
  if (anterior?.modificado) headers["If-Modified-Since"] = anterior.modificado
  try {
    const resposta = await fetch(url, { headers, signal: AbortSignal.timeout(8000) })
    if (resposta.status === 304 && anterior) return anterior.dados
    if (resposta.status === 404 || resposta.status === 429) {
      const erro = new Error(`TSE ${resposta.status}`)
      erro.status = resposta.status
      throw erro
    }
    if (!resposta.ok) throw new Error(`TSE ${resposta.status}`)
    const dados = await resposta.json()
    cache.set(url, {
      dados,
      etag: resposta.headers.get("etag"),
      modificado: resposta.headers.get("last-modified"),
    })
    return dados
  } catch (erro) {
    if (erro.status === 429 || erro.status === 404 || !anterior?.dados) throw erro
    return anterior.dados
  }
}

async function emFila(itens, limite, tarefa) {
  const saida = new Array(itens.length)
  let cursor = 0
  async function worker() {
    while (cursor < itens.length) {
      const indice = cursor
      cursor += 1
      saida[indice] = await tarefa(itens[indice])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limite, itens.length) }, () => worker()))
  return saida
}

function linhaDe(meta, arquivo) {
  const fixo = base.get(meta.uf)
  return fecharLinha({
    uf: meta.uf,
    nome: meta.nome,
    regiao: meta.regiao,
    lula1: fixo?.lula || 0,
    flavio1: fixo?.flavio || 0,
  }, arquivo)
}

function linhaLocal(fixo, arquivo) {
  return fecharLinha({
    cd: fixo.cd,
    nome: nomeProprio(fixo.nome),
    japao: JAPAO.has(fixo.cd),
    lula1: fixo.lula || 0,
    flavio1: fixo.flavio || 0,
  }, arquivo)
}

function fecharLinha(baseLinha, arquivo) {
  const lula2 = arquivo ? candidato(arquivo, "13") : 0
  const flavio2 = arquivo ? candidato(arquivo, "22") : 0
  const pct = arquivo ? numero(arquivo.s?.pstn ?? arquivo.s?.pst) : null
  const m1 = margem(baseLinha.lula1, baseLinha.flavio1)
  const m2 = lula2 + flavio2 > 0 ? margem(lula2, flavio2) : null
  return {
    ...baseLinha,
    lula2,
    flavio2,
    pct: arquivo ? pct : null,
    secoes: arquivo ? numero(arquivo.s?.ts) : 0,
    apuradas: arquivo ? numero(arquivo.s?.st) : 0,
    atualizado: arquivo ? `${arquivo.dg || ""} ${arquivo.hg || ""}`.trim() : null,
    margem1: m1,
    margem2: m2,
    movimento: classificar(m1, m2, arquivo ? pct : null),
  }
}

function agregar(linhas) {
  const lula1 = linhas.reduce((soma, linha) => soma + linha.lula1, 0)
  const flavio1 = linhas.reduce((soma, linha) => soma + linha.flavio1, 0)
  const lula2 = linhas.reduce((soma, linha) => soma + linha.lula2, 0)
  const flavio2 = linhas.reduce((soma, linha) => soma + linha.flavio2, 0)
  const secoes = linhas.reduce((soma, linha) => soma + (linha.secoes || 0), 0)
  const apuradas = linhas.reduce((soma, linha) => soma + (linha.apuradas || 0), 0)
  const pct = secoes ? (apuradas / secoes) * 100 : null
  const m1 = margem(lula1, flavio1)
  const m2 = lula2 + flavio2 > 0 ? margem(lula2, flavio2) : null
  return {
    nome: "Japão",
    lula1,
    flavio1,
    lula2,
    flavio2,
    pct,
    margem1: m1,
    margem2: m2,
    movimento: classificar(m1, m2, pct),
  }
}

function exteriorDe(arquivo, locais) {
  const bloco = fecharLinha({
    uf: "ZZ",
    nome: "Estrangeiro",
    lula1: exteriorFixo.lula || 0,
    flavio1: exteriorFixo.flavio || 0,
  }, arquivo)
  return { ...bloco, japao: agregar(locais.filter((linha) => linha.japao)), locais }
}

export function painelVazio() {
  const ufs = UFS.map((meta) => linhaDe(meta, null))
  const exterior = exteriorDe(null, exteriorFixo.locais.map((fixo) => linhaLocal(fixo, null)))
  return montar(ufs, exterior, null, "O primeiro turno está na mesa. O TSE ainda não respondeu.")
}

function montar(ufs, exterior, relogio, aviso, nacional = null) {
  const t1 = somar(ufs, "lula1", "flavio1")
  const comVoto = ufs.filter((linha) => linha.lula2 + linha.flavio2 > 0)
  const t2 = somar(comVoto, "lula2", "flavio2")
  const lula1 = t1.lula + (exterior?.lula1 || 0)
  const flavio1 = t1.flavio + (exterior?.flavio1 || 0)
  const oficial = nacional && nacional.lula + nacional.flavio > 0
  const lula2 = oficial ? nacional.lula : t2.lula + (exterior?.lula2 || 0)
  const flavio2 = oficial ? nacional.flavio : t2.flavio + (exterior?.flavio2 || 0)
  return {
    gerado: new Date().toISOString(),
    aviso,
    relogio,
    brasil: {
      lula1,
      flavio1,
      lula2,
      flavio2,
      pct: nacional?.pct ?? null,
      margem1: margem(lula1, flavio1),
      margem2: lula2 + flavio2 > 0 ? margem(lula2, flavio2) : null,
      censo: nacional?.censo || null,
      censo1: censoPrimeiro,
    },
    exterior,
    ufs,
  }
}

export async function lerPainel() {
  const leituraUfs = Promise.all(
    UFS.map(async (meta) => {
      try {
        return [meta, await baixar(urlDe(meta.uf))]
      } catch (erro) {
        return [meta, null, erro]
      }
    }),
  )
  const leituraBr = baixar(urlDe("br")).then((arquivo) => [arquivo, null]).catch((erro) => [null, erro])
  const leituraZz = baixar(urlDe("zz")).then((arquivo) => [arquivo, null]).catch((erro) => [null, erro])
  const [arquivos, brPar, zzPar] = await Promise.all([leituraUfs, leituraBr, leituraZz])
  const [brArquivo, brErro] = brPar
  const [zzArquivo, zzErro] = zzPar
  const zzTemVoto = zzArquivo && candidato(zzArquivo, "13") + candidato(zzArquivo, "22") > 0
  const cidades = zzTemVoto
    ? await emFila(exteriorFixo.locais, 12, async (fixo) => {
      try {
        return [fixo, await baixar(urlCidade(fixo.cd))]
      } catch (erro) {
        return [fixo, null, erro]
      }
    })
    : exteriorFixo.locais.map((fixo) => [fixo, null])
  const falhas = arquivos.filter((item) => item[2]).length
  const ufs = arquivos.map(([meta, arquivo]) => linhaDe(meta, arquivo))
  const exterior = exteriorDe(zzArquivo, cidades.map(([fixo, arquivo]) => linhaLocal(fixo, arquivo)))
  const nacional = brArquivo
    ? {
      lula: candidato(brArquivo, "13"),
      flavio: candidato(brArquivo, "22"),
      pct: numero(brArquivo.s?.pstn ?? brArquivo.s?.pst),
      censo: censoDe(brArquivo),
    }
    : null
  const relogio = brArquivo?.dg
    ? { data: brArquivo.dg, hora: brArquivo.hg || "" }
    : null
  const bloqueio = arquivos.some((item) => item[2]?.status === 429) || brErro?.status === 429 || zzErro?.status === 429 || cidades.some((item) => item[2]?.status === 429)
  const aviso = bloqueio
    ? "O TSE pediu uma pausa. A mesa segura a última leitura por um minuto."
    : !brArquivo && falhas === UFS.length
      ? "O TSE não devolveu a leitura. O primeiro turno continua na mesa."
      : null
  const painel = montar(ufs, exterior, relogio, aviso, nacional)
  painel.bloqueio = bloqueio
  return painel
}
