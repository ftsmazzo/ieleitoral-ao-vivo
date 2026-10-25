import { Fragment, useEffect, useMemo, useState } from "react"
import { restante } from "../shared/abertura.mjs"
import { REGIOES, fraseBrasil } from "../shared/apuracao.mjs"
import { familia, fatia, pp, quem, rotuloMovimento, votos } from "./format.js"
import { pulso } from "./presenca.js"

function useAgora() {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setAgora(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return agora
}

function Portada({ agora, onEntrar }) {
  const falta = restante(agora)
  return (
    <section className="portada" aria-labelledby="portada-titulo">
      <p className="portada-olho">Horário de Brasília</p>
      <h1 id="portada-titulo" className={falta.aberto ? undefined : "uma-linha"}>
        {falta.aberto ? "Já são 17h. O arquivo ainda não trouxe voto nominal." : "O segundo turno abre às 17h."}
      </h1>
      {falta.aberto ? (
        <p className="portada-nota">A mesa entra sozinha no instante em que o TSE gravar o primeiro voto.</p>
      ) : (
        <div className="digitos" role="timer" aria-label={`${falta.horas} horas, ${falta.minutos} minutos e ${falta.segundos} segundos`}>
          <p><b>{falta.horas}</b><span>horas</span></p>
          <p><b>{falta.minutos}</b><span>minutos</span></p>
          <p><b>{falta.segundos}</b><span>segundos</span></p>
        </div>
      )}
      <button type="button" className="entrar" onClick={onEntrar}>Ver o primeiro turno</button>
    </section>
  )
}

function useEstreito() {
  const consulta = "(max-width: 860px)"
  const [estreito, setEstreito] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const midia = window.matchMedia(consulta)
    const aoMudar = () => setEstreito(midia.matches)
    midia.addEventListener("change", aoMudar)
    return () => midia.removeEventListener("change", aoMudar)
  }, [])
  return estreito
}

const MOVIMENTOS = [
  ["todas", "Todas"],
  ["virou", "Virou"],
  ["aumentou", "Aumentou"],
  ["diminuiu", "Diminuiu"],
  ["aguardando", "Aguardando"],
]

function parte(valor, fino = false) {
  if (valor == null || Number.isNaN(valor)) return "—"
  const casas = fino && Math.abs(valor) < 10 ? 2 : 1
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`
}

function Leitura({ rotulo, lula = 0, flavio = 0, urnas = null }) {
  const total = lula + flavio
  const esquerda = total ? (lula / total) * 100 : null
  const direita = esquerda == null ? null : 100 - esquerda
  return (
    <div className="leitura">
      <div className="leitura-topo">
        <strong>{rotulo}</strong>
        <span>
          {total ? `${votos(total)} votos` : "Sem voto nominal"}
          {urnas == null ? "" : ` · ${parte(urnas, true)} das seções`}
        </span>
      </div>
      <div className="leitura-faixa">
        <p className="lado lula">
          <b>{parte(esquerda)}</b>
          <span>Lula · {votos(lula)}</span>
        </p>
        <Trilho largo lula={lula} flavio={flavio} />
        <p className="lado flavio">
          <b>{parte(direita)}</b>
          <span>Flávio · {votos(flavio)}</span>
        </p>
      </div>
    </div>
  )
}

function Trilho({ lula, flavio, largo = false }) {
  const total = (lula || 0) + (flavio || 0)
  const texto = quem(lula, flavio)
  const esquerda = fatia(lula, flavio)
  return (
    <div
      className={largo ? "trilho largo" : "trilho mini"}
      role="img"
      aria-label={texto}
    >
      {total > 0 ? <b className="lula" style={{ width: `${esquerda}%` }} /> : null}
      {total > 0 ? <b className="flavio" style={{ width: `${100 - esquerda}%` }} /> : null}
      <i />
    </div>
  )
}

function ordenar(lista, ordem) {
  const delta = (linha) => (linha.margem2 == null ? null : Math.abs(linha.margem2 - linha.margem1))
  lista.sort((a, b) => {
    if (ordem === "uf") return a.nome.localeCompare(b.nome, "pt-BR")
    if (ordem === "apurado") return (b.pct || 0) - (a.pct || 0)
    if (ordem === "margem") return Math.abs(b.margem2 || 0) - Math.abs(a.margem2 || 0)
    const da = delta(a)
    const db = delta(b)
    if (da == null && db == null) return Math.abs(a.margem1 || 0) - Math.abs(b.margem1 || 0)
    if (da == null) return 1
    if (db == null) return -1
    return db - da
  })
  return lista
}

function Tabela({ titulo, rotulo, linhas, aberta, onAbrir, vazio }) {
  return (
    <section className="ledger" aria-labelledby={titulo}>
      <h2 id={titulo}>{rotulo}</h2>
      {linhas.length === 0 ? (
        <p className="vazio">{vazio}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Lugar</th>
              <th scope="col">1º turno</th>
              <th scope="col">2º turno</th>
              <th scope="col">Movimento</th>
              <th scope="col">Apurado</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => {
              const chave = linha.uf || linha.cd
              const abriu = aberta === chave
              const codigo = familia(linha.movimento)
              const carimbo = linha.movimento.endsWith("parcial") ? "parcial" : codigo
              return (
                <Fragment key={chave}>
                  <tr className="linha-uf" aria-expanded={abriu} onClick={() => onAbrir(abriu ? null : chave)}>
                    <th scope="row">
                      {linha.uf ? <span className="sigla">{linha.uf}</span> : null}
                      <span className={linha.uf ? "nome-uf" : "sigla cidade"}>{linha.nome}</span>
                      {linha.japao ? <span className="nome-uf">Japão</span> : null}
                    </th>
                    <td data-label="1º turno">
                      <Trilho lula={linha.lula1} flavio={linha.flavio1} />
                      <span className="numeros">{pp(linha.margem1)}</span>
                    </td>
                    <td data-label="2º turno">
                      <Trilho lula={linha.lula2} flavio={linha.flavio2} />
                      <span className="numeros">{pp(linha.margem2)}</span>
                    </td>
                    <td data-label="Movimento">
                      <span className={`carimbo ${carimbo}`}>{rotuloMovimento(linha.movimento)}</span>
                    </td>
                    <td className="numeros" data-label="Apurado">
                      {linha.pct == null ? "—" : `${linha.pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`}
                    </td>
                  </tr>
                  {abriu ? (
                    <tr className="detalhe">
                      <td colSpan="5">
                        1º turno: Lula {votos(linha.lula1)} · Flávio {votos(linha.flavio1)}. 2º turno: Lula {votos(linha.lula2)} · Flávio {votos(linha.flavio2)}.
                        {linha.movimento.endsWith("parcial") ? " Carimbo parcial: ainda não chegou a 95% das seções." : ""}
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}

function escala(valor) {
  const ppValor = (valor || 0) * 100
  const limitado = Math.max(-40, Math.min(40, ppValor))
  return 80 + ((40 - limitado) / 80) * 840
}

function Faixa({ ufs, ativa, onEscolher }) {
  const bandas = REGIOES.map((regiao) => ufs.filter((linha) => linha.regiao === regiao))
  const altura = 56 + bandas.reduce((soma, banda) => soma + 22 + banda.length * 18, 0)
  let y = 48
  const blocos = bandas.map((banda) => {
    const topo = y
    y += 22 + banda.length * 18
    return { topo, banda }
  })

  return (
    <section className="faixa" aria-labelledby="faixa-titulo">
      <h2 id="faixa-titulo">Onde a margem andou</h2>
      {ufs.every((linha) => linha.margem2 == null) ? (
        <p className="quem faixa-nota">Os pontos ainda coincidem. O segundo turno não moveu.</p>
      ) : null}
      <svg viewBox={`0 0 1000 ${altura}`} role="group" aria-label="Cada UF sai do primeiro turno e chega no segundo. À esquerda, Lula. À direita, Flávio.">
        <line className="zero" x1="500" y1="8" x2="500" y2={altura - 8} />
        <text className="escala" x="80" y="16">Lula +40</text>
        <text className="escala" x="470" y="16">0</text>
        <text className="escala" x="860" y="16">Flávio +40</text>
        {blocos.map(({ topo, banda }) => (
          <g key={banda[0]?.regiao || topo}>
            <text className="reg-label" x="16" y={topo}>
              {banda[0]?.regiao}
            </text>
            {banda.map((linha, indice) => {
              const cy = topo + 20 + indice * 18
              const x1 = escala(linha.margem1)
              const x2 = escala(linha.margem2 == null ? linha.margem1 : linha.margem2)
              const movimento = familia(linha.movimento)
              return (
                  <g
                  key={linha.uf}
                  className="uf-hit"
                  tabIndex={0}
                  role="button"
                  aria-pressed={ativa === linha.uf}
                  aria-label={`${linha.nome}, ${rotuloMovimento(linha.movimento)}`}
                  onClick={() => onEscolher(linha.uf)}
                  onKeyDown={(evento) => {
                    if (evento.key === "Enter" || evento.key === " ") {
                      evento.preventDefault()
                      onEscolher(linha.uf)
                    }
                  }}
                >
                  <line className={movimento === "virou" ? "elo virou" : "elo"} x1={x1} y1={cy} x2={x2} y2={cy} />
                  <circle className="tick-1" cx={x1} cy={cy} r="3.5" />
                  <circle className="tick-2" cx={x2} cy={cy} r={linha.margem2 == null ? 3.5 : 5} />
                  <text className="uf-label" x="928" y={cy + 4}>{linha.uf}</text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>
    </section>
  )
}

export function App() {
  const [painel, setPainel] = useState(null)
  const [falha, setFalha] = useState(false)
  const [movimento, setMovimento] = useState("todas")
  const [regiao, setRegiao] = useState("todas")
  const [busca, setBusca] = useState("")
  const [ordem, setOrdem] = useState("mexeu")
  const [soFirme, setSoFirme] = useState(false)
  const [aberta, setAberta] = useState(null)
  const [instalar, setInstalar] = useState(null)
  const [dicaIos, setDicaIos] = useState(false)
  const [entrou, setEntrou] = useState(() => sessionStorage.getItem("ie-entrada") === "1")
  const estreito = useEstreito()
  const agora = useAgora()

  useEffect(() => pulso(), [])

  useEffect(() => {
    const apple = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const instalado = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone
    setDicaIos(apple && !instalado)
  }, [])

  useEffect(() => {
    const aoOferecer = (evento) => {
      evento.preventDefault()
      setInstalar(evento)
    }
    window.addEventListener("beforeinstallprompt", aoOferecer)
    return () => window.removeEventListener("beforeinstallprompt", aoOferecer)
  }, [])

  useEffect(() => {
    let viva = true
    let marca = ""
    let timer = 0
    async function ler() {
      try {
        const resposta = await fetch("/api/painel", {
          headers: marca ? { "If-None-Match": marca } : {},
        })
        if (resposta.status === 304) {
          if (viva) setFalha(false)
          return
        }
        if (!resposta.ok) throw new Error("painel")
        marca = resposta.headers.get("etag") || ""
        const dados = await resposta.json()
        if (viva) {
          setPainel(dados)
          setFalha(false)
        }
      } catch {
        if (viva) setFalha(true)
      }
    }
    function agendar() {
      const espera = document.visibilityState === "hidden" ? 60000 : 20000
      timer = window.setTimeout(async () => {
        await ler()
        if (viva) agendar()
      }, espera)
    }
    ler().then(() => {
      if (viva) agendar()
    })
    const aoVoltar = () => {
      if (document.visibilityState !== "visible") return
      window.clearTimeout(timer)
      ler().then(() => {
        if (viva) agendar()
      })
    }
    document.addEventListener("visibilitychange", aoVoltar)
    return () => {
      viva = false
      window.clearTimeout(timer)
      document.removeEventListener("visibilitychange", aoVoltar)
    }
  }, [])

  const ufs = painel?.ufs || []
  const brasil = painel?.brasil

  const exterior = painel?.exterior
  const visiveis = useMemo(() => {
    const texto = busca.trim().toLowerCase()
    const lista = ufs.filter((linha) => {
      if (regiao === "Estrangeiro") return false
      if (regiao !== "todas" && linha.regiao !== regiao) return false
      if (movimento !== "todas" && familia(linha.movimento) !== movimento) return false
      if (soFirme && (linha.pct == null || linha.pct < 95)) return false
      if (!texto) return true
      return linha.uf.toLowerCase().includes(texto) || linha.nome.toLowerCase().includes(texto)
    })
    return ordenar(lista, ordem)
  }, [ufs, regiao, movimento, busca, soFirme, ordem])
  const cidades = useMemo(() => {
    const texto = busca.trim().toLowerCase()
    const lista = (exterior?.locais || []).filter((linha) => {
      if (movimento !== "todas" && familia(linha.movimento) !== movimento) return false
      if (soFirme && (linha.pct == null || linha.pct < 95)) return false
      if (!texto) return true
      return linha.nome.toLowerCase().includes(texto)
    })
    return ordenar(lista, ordem)
  }, [exterior, movimento, busca, soFirme, ordem])

  const frase = brasil ? fraseBrasil(brasil.margem1, brasil.margem2) : "Carregando a mesa."
  const urnasBrasil = useMemo(() => {
    let secoes = exterior?.secoes || 0
    let apuradas = exterior?.apuradas || 0
    for (const linha of ufs) {
      secoes += linha.secoes || 0
      apuradas += linha.apuradas || 0
    }
    if (!secoes) return null
    return (apuradas / secoes) * 100
  }, [ufs, exterior])
  const comVoto = (brasil?.lula2 || 0) + (brasil?.flavio2 || 0) > 0
  const falta = restante(agora)
  const relogio = comVoto && painel?.relogio?.hora
    ? `Arquivo TSE ${painel.relogio.data} ${painel.relogio.hora}`
    : falta.aberto
      ? "Aguardando voto no arquivo"
      : `Abre em ${falta.horas}:${falta.minutos}:${falta.segundos}`

  function entrar() {
    sessionStorage.setItem("ie-entrada", "1")
    setEntrou(true)
  }

  function escolherUf(uf) {
    setBusca((atual) => (atual.toUpperCase() === uf ? "" : uf))
    setAberta(uf)
  }

  return (
    <>
      <header className="topo">
        <a className="marca" href="#mesa">
          <img src="/logo-ie.png" alt="Inteligência Eleitoral" />
          <div>
            <strong>IEleitoral Ao Vivo</strong>
            <span>Presidente, margem por UF</span>
          </div>
        </a>
        <p className="relogio">
          {instalar ? (
            <button
              type="button"
              className="instalar"
              onClick={() => {
                instalar.prompt()
                setInstalar(null)
              }}
            >
              Instalar
            </button>
          ) : null}
          <span className="carimbo ao-vivo">Ao vivo</span>
          <span className="hora">{relogio}</span>
        </p>
      </header>
      {!comVoto && !entrou ? <Portada agora={agora} onEntrar={entrar} /> : null}
      <main className="miolo" id="mesa" hidden={!comVoto && !entrou}>
        {falha ? (
          <p className="aviso" role="alert">A sala perdeu a leitura desta vez. A página tenta de novo em alguns segundos.</p>
        ) : null}
        {painel?.aviso ? <p className="aviso">{painel.aviso}</p> : null}
        <h1 className="tese">{frase}</h1>
        <section className="pista" aria-labelledby="nacional">
          <header>
            <h2 id="nacional">Brasil, com o exterior</h2>
          </header>
          <Leitura rotulo="1º turno" lula={brasil?.lula1 || 0} flavio={brasil?.flavio1 || 0} />
          <Leitura rotulo="2º turno" lula={brasil?.lula2 || 0} flavio={brasil?.flavio2 || 0} urnas={urnasBrasil} />
          <p className="legenda">
            <span>A soma junta as 27 UFs e o estrangeiro.</span>
            <span>O risco coral é o empate entre os dois.</span>
          </p>
        </section>
        {exterior && (regiao === "todas" || regiao === "Estrangeiro") ? (
          <section className="pista" aria-labelledby="estrangeiro">
            <header>
              <h2 id="estrangeiro">Estrangeiro</h2>
            </header>
            <Leitura rotulo="1º turno" lula={exterior.lula1} flavio={exterior.flavio1} />
            <Leitura rotulo="2º turno" lula={exterior.lula2} flavio={exterior.flavio2} urnas={exterior.pct} />
            <Leitura rotulo="Japão · 1º turno" lula={exterior.japao.lula1} flavio={exterior.japao.flavio1} />
            <Leitura rotulo="Japão · 2º turno" lula={exterior.japao.lula2} flavio={exterior.japao.flavio2} urnas={exterior.japao.pct} />
            <p className="legenda">Esse recorte entra na soma de cima. Japão reúne Tóquio, Nagóia e Hamamatsu.</p>
          </section>
        ) : null}
        {estreito || regiao === "Estrangeiro" ? null : <Faixa ufs={ufs} ativa={aberta} onEscolher={escolherUf} />}
        <div className="filtros">
          <div className="movimentos" role="group" aria-label="Movimento da margem">
            {MOVIMENTOS.map(([id, nome]) => (
              <button key={id} type="button" aria-pressed={movimento === id} onClick={() => setMovimento(id)}>
                {nome}
              </button>
            ))}
          </div>
          <label className="campo">
            <span>Região</span>
            <select value={regiao} onChange={(evento) => setRegiao(evento.target.value)}>
              <option value="todas">Todas</option>
              {REGIOES.map((nome) => (
                <option key={nome} value={nome}>{nome}</option>
              ))}
              <option value="Estrangeiro">Estrangeiro</option>
            </select>
          </label>
          <label className="campo">
            <span>UF</span>
            <input
              value={busca}
              placeholder="Sigla ou nome"
              onChange={(evento) => setBusca(evento.target.value)}
            />
          </label>
          <label className="campo">
            <span>Ordem</span>
            <select value={ordem} onChange={(evento) => setOrdem(evento.target.value)}>
              <option value="mexeu">O que mais mexeu</option>
              <option value="margem">Maior margem agora</option>
              <option value="apurado">Mais apurado</option>
              <option value="uf">Nome</option>
            </select>
          </label>
          <label className="check">
            <input type="checkbox" checked={soFirme} onChange={(evento) => setSoFirme(evento.target.checked)} />
            <span>Só leitura firme</span>
          </label>
        </div>
        {regiao === "Estrangeiro" ? null : (
          <Tabela
            titulo="ledger-titulo"
            rotulo="Unidades"
            linhas={visiveis}
            aberta={aberta}
            onAbrir={setAberta}
            vazio="Nenhuma UF entrou nesse recorte. Troque o movimento ou limpe a busca."
          />
        )}
        {regiao === "todas" || regiao === "Estrangeiro" ? (
          <Tabela
            titulo="exterior-titulo"
            rotulo="Cidades no exterior"
            linhas={cidades}
            aberta={aberta}
            onAbrir={setAberta}
            vazio="Nenhuma cidade entrou nesse recorte. Troque o movimento ou limpe a busca."
          />
        ) : null}
        {dicaIos ? (
          <p className="legenda">Para deixar na tela de início: Compartilhar, depois Adicionar à Tela de Início.</p>
        ) : null}
      </main>
    </>
  )
}
