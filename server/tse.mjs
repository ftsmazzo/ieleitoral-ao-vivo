import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { UFS, classificar, margem, somar } from "../shared/apuracao.mjs"

const raiz = dirname(fileURLToPath(import.meta.url))
const primeiro = JSON.parse(readFileSync(join(raiz, "..", "data", "primeiro-turno.json"), "utf8"))
const base = new Map(primeiro.ufs.map((linha) => [linha.uf, linha]))

const ELEICAO = "6258"
const HOST = "https://resultados.tse.jus.br/oficial/ele2026"

const cache = new Map()

function urlDe(uf) {
  const codigo = uf.toLowerCase()
  return `${HOST}/${ELEICAO}/dados/${codigo}/${codigo}-c0001-e00${ELEICAO}-u.json`
}

function numero(valor) {
  if (valor == null || valor === "") return 0
  if (typeof valor === "number") return valor
  const limpo = String(valor).replace(/\./g, "").replace(",", ".")
  const n = Number(limpo)
  return Number.isFinite(n) ? n : 0
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
  const resposta = await fetch(url, { headers })
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
}

function linhaDe(meta, arquivo) {
  const fixo = base.get(meta.uf)
  const lula1 = fixo?.lula || 0
  const flavio1 = fixo?.flavio || 0
  const lula2 = arquivo ? candidato(arquivo, "13") : 0
  const flavio2 = arquivo ? candidato(arquivo, "22") : 0
  const pct = arquivo ? numero(arquivo.s?.pstn ?? arquivo.s?.pst) : null
  const m1 = margem(lula1, flavio1)
  const m2 = lula2 + flavio2 > 0 ? margem(lula2, flavio2) : null
  return {
    uf: meta.uf,
    nome: meta.nome,
    regiao: meta.regiao,
    lula1,
    flavio1,
    lula2,
    flavio2,
    pct: arquivo ? pct : null,
    atualizado: arquivo ? `${arquivo.dg || ""} ${arquivo.hg || ""}`.trim() : null,
    margem1: m1,
    margem2: m2,
    movimento: classificar(m1, m2, arquivo ? pct : null),
  }
}

export function painelVazio() {
  const ufs = UFS.map((meta) => linhaDe(meta, null))
  return montar(ufs, null, "O primeiro turno está na mesa. O TSE ainda não respondeu.")
}

function montar(ufs, relogio, aviso) {
  const t1 = somar(ufs, "lula1", "flavio1")
  const comVoto = ufs.filter((linha) => linha.lula2 + linha.flavio2 > 0)
  const t2 = somar(comVoto, "lula2", "flavio2")
  return {
    gerado: new Date().toISOString(),
    aviso,
    relogio,
    brasil: {
      lula1: t1.lula,
      flavio1: t1.flavio,
      lula2: t2.lula,
      flavio2: t2.flavio,
      margem1: margem(t1.lula, t1.flavio),
      margem2: t2.lula + t2.flavio > 0 ? margem(t2.lula, t2.flavio) : null,
    },
    ufs,
  }
}

export async function lerPainel() {
  const arquivos = await Promise.all(
    UFS.map(async (meta) => {
      try {
        return [meta, await baixar(urlDe(meta.uf))]
      } catch (erro) {
        return [meta, null, erro]
      }
    }),
  )
  const falhas = arquivos.filter((item) => item[2]).length
  const ufs = arquivos.map(([meta, arquivo]) => linhaDe(meta, arquivo))
  const algum = arquivos.find((item) => item[1])
  const relogio = algum
    ? { data: algum[1].dg || "", hora: algum[1].hg || "" }
    : null
  const aviso =
    falhas === UFS.length
      ? "O TSE não devolveu as UFs nesta leitura. O primeiro turno continua na mesa."
      : falhas
        ? `${falhas} UFs não atualizaram nesta leitura.`
        : null
  return montar(ufs, relogio, aviso)
}
