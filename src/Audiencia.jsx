import { useEffect, useState } from "react"
import { pulso } from "./presenca.js"

export function Audiencia() {
  const chave = new URLSearchParams(window.location.search).get("chave") || ""
  const [dados, setDados] = useState(null)
  const [falha, setFalha] = useState(false)

  useEffect(() => pulso(), [])

  useEffect(() => {
    let viva = true
    async function ler() {
      try {
        const resposta = await fetch(`/api/audiencia?chave=${encodeURIComponent(chave)}`)
        if (!resposta.ok) throw new Error("audiencia")
        const corpo = await resposta.json()
        if (viva) {
          setDados(corpo)
          setFalha(false)
        }
      } catch {
        if (viva) setFalha(true)
      }
    }
    if (!chave) return undefined
    ler()
    const id = setInterval(ler, 15000)
    return () => {
      viva = false
      clearInterval(id)
    }
  }, [chave])

  return (
    <>
      <header className="topo">
        <a className="marca" href="/">
          <img src="/logo-ie.png" alt="Inteligência Eleitoral" />
          <div>
            <strong>IEleitoral Ao Vivo</strong>
            <span>Quem está com a página aberta</span>
          </div>
        </a>
      </header>
      <main className="miolo">
        <h1 className="tese">IPs na mesa</h1>
        {!chave ? <p className="aviso">Esta leitura fica com a equipe. Abra o endereço que vocês guardaram.</p> : null}
        {falha ? <p className="aviso" role="alert">A contagem não respondeu. A página tenta de novo.</p> : null}
        <section className="pista">
          <h2>Agora</h2>
          <p className="quem">{dados ? dados.agora.toLocaleString("pt-BR") : "…"} {dados?.agora === 1 ? "IP" : "IPs"}</p>
          <p className="legenda">{dados?.nota}</p>
        </section>
        <section className="ledger" aria-labelledby="ips-audiencia">
          <h2 id="ips-audiencia">Por IP</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">IP</th>
                <th scope="col">Cidade</th>
                <th scope="col">UF</th>
              </tr>
            </thead>
            <tbody>
              {(dados?.ips || []).map((linha) => (
                <tr key={linha.ip}>
                  <th className="numeros" scope="row">{linha.ip}</th>
                  <td>{linha.cidade}</td>
                  <td>{linha.uf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="ledger" aria-labelledby="ufs-audiencia">
          <h2 id="ufs-audiencia">Por UF</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">UF</th>
                <th scope="col">Abertas agora</th>
              </tr>
            </thead>
            <tbody>
              {(dados?.porUf || []).map((linha) => (
                <tr key={linha.uf}>
                  <th scope="row">{linha.uf}</th>
                  <td className="numeros">{linha.agora.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="ledger" aria-labelledby="cidades-audiencia">
          <h2 id="cidades-audiencia">Por cidade</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">Cidade</th>
                <th scope="col">UF</th>
                <th scope="col">Abertas agora</th>
              </tr>
            </thead>
            <tbody>
              {(dados?.porCidade || []).map((linha) => (
                <tr key={`${linha.cidade}-${linha.uf}`}>
                  <th scope="row">{linha.cidade}</th>
                  <td>{linha.uf}</td>
                  <td className="numeros">{linha.agora.toLocaleString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </>
  )
}
