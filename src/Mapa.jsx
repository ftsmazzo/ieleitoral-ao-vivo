import { useEffect, useMemo, useRef, useState } from "react"
import { votos } from "./format.js"
import { MAPA } from "./mapa-ufs.js"

function parte(valor, fino = false) {
  if (valor == null || Number.isNaN(valor)) return "—"
  const casas = fino && Math.abs(valor) < 10 ? 2 : 1
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`
}

function classeDe(linha) {
  const total = (linha?.lula2 || 0) + (linha?.flavio2 || 0)
  if (!total) return "vazio"
  if (linha.lula2 === linha.flavio2) return "empate"
  return linha.lula2 > linha.flavio2 ? "lula" : "flavio"
}

function Ficha({ linha }) {
  const total = (linha?.lula2 || 0) + (linha?.flavio2 || 0)
  const esquerda = total ? (linha.lula2 / total) * 100 : null
  const direita = esquerda == null ? null : 100 - esquerda
  return (
    <div className="ficha" role="status">
      <strong>{linha?.nome || "Estado"}</strong>
      <span>{linha?.pct == null ? "Sem leitura de seções" : `${parte(linha.pct, true)} das seções`}</span>
      {total ? (
        <span className="placar">
          <span className="voto lula"><b>{parte(esquerda)}</b><span>Lula · {votos(linha.lula2)}</span></span>
          <span className="voto flavio"><b>{parte(direita)}</b><span>Flávio · {votos(linha.flavio2)}</span></span>
        </span>
      ) : <p className="anterior">Sem voto nominal</p>}
    </div>
  )
}

export function Mapa({ ufs, regiao, busca }) {
  const porUf = useMemo(() => new Map(ufs.map((linha) => [linha.uf, linha])), [ufs])
  const caixa = useRef(null)
  const [flutua, setFlutua] = useState(false)
  const [ativa, setAtiva] = useState(null)
  const [posicao, setPosicao] = useState({ x: 12, y: 12 })

  useEffect(() => {
    const ponteiro = window.matchMedia("(pointer: fine)")
    const larga = window.matchMedia("(min-width: 861px)")
    const aoMudar = () => setFlutua(ponteiro.matches && larga.matches)
    aoMudar()
    ponteiro.addEventListener("change", aoMudar)
    larga.addEventListener("change", aoMudar)
    return () => {
      ponteiro.removeEventListener("change", aoMudar)
      larga.removeEventListener("change", aoMudar)
    }
  }, [])

  function posicionar(evento) {
    const box = caixa.current?.getBoundingClientRect()
    if (!box) return
    const x = Math.min(Math.max(evento.clientX - box.left + 14, 8), Math.max(8, box.width - 228))
    const y = Math.min(Math.max(evento.clientY - box.top + 14, 8), Math.max(8, box.height - 148))
    setPosicao({ x, y })
  }

  const linha = ativa ? porUf.get(ativa) : null
  const texto = busca.trim().toLowerCase()

  return (
    <section className="pista mapa" aria-labelledby="mapa-titulo">
      <h2 id="mapa-titulo">Por estado</h2>
      <div className="mapa-caixa" ref={caixa}>
        <svg viewBox={`0 0 ${MAPA.largura} ${MAPA.altura}`} role="group" aria-label="Mapa do segundo turno. Passe o mouse ou toque no estado.">
          {MAPA.ufs.map((forma) => {
            const dado = porUf.get(forma.uf)
            const fora = (regiao !== "todas" && regiao !== "Estrangeiro" && dado?.regiao !== regiao)
              || (texto && !(forma.uf.toLowerCase().includes(texto) || (dado?.nome || "").toLowerCase().includes(texto)))
            return (
              <path
                key={forma.uf}
                d={forma.d}
                fillRule="evenodd"
                className={`uf-mapa ${classeDe(dado)}${ativa === forma.uf ? " ativo" : ""}${fora ? " apagado" : ""}`}
                tabIndex={0}
                role="button"
                aria-pressed={ativa === forma.uf}
                aria-label={`${dado?.nome || forma.uf}, ${dado ? parte(dado.pct, true) : "sem leitura"}`}
                onPointerEnter={(evento) => {
                  if (evento.pointerType !== "mouse") return
                  setAtiva(forma.uf)
                  posicionar(evento)
                }}
                onPointerMove={(evento) => {
                  if (evento.pointerType !== "mouse" || ativa !== forma.uf) return
                  posicionar(evento)
                }}
                onPointerLeave={(evento) => {
                  if (evento.pointerType !== "mouse") return
                  setAtiva((atual) => (atual === forma.uf ? null : atual))
                }}
                onPointerUp={(evento) => {
                  if (evento.pointerType === "mouse") return
                  setAtiva((atual) => (atual === forma.uf ? null : forma.uf))
                }}
                onFocus={() => setAtiva(forma.uf)}
                onBlur={(evento) => {
                  if (caixa.current?.contains(evento.relatedTarget)) return
                  setAtiva(null)
                }}
              />
            )
          })}
        </svg>
        {linha && flutua ? (
          <div className="ficha-flutuante" style={{ left: posicao.x, top: posicao.y }}>
            <Ficha linha={linha} />
          </div>
        ) : null}
      </div>
      {linha && !flutua ? <Ficha linha={linha} /> : null}
      <p className="legenda mapa-legenda">
        <span><i className="lula" /> Lula</span>
        <span><i className="flavio" /> Flávio</span>
        <span><i className="vazio" /> Sem voto nominal</span>
      </p>
    </section>
  )
}
