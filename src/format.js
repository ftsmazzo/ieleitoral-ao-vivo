import { familia, lider, pontos, rotuloMovimento } from "../shared/apuracao.mjs"

export { familia, lider, pontos, rotuloMovimento }

export function votos(valor) {
  return Number(valor || 0).toLocaleString("pt-BR")
}

export function pp(valor) {
  if (valor == null || Number.isNaN(valor)) return "—"
  const n = pontos(valor)
  const texto = Math.abs(n).toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })
  if (Math.abs(n) < 0.05) return "0,0"
  return `${n > 0 ? "+" : "−"}${texto}`
}

export function fatia(lula, flavio) {
  const total = lula + flavio
  if (!total) return 50
  return (lula / total) * 100
}

export function quem(lula, flavio) {
  if (!lula && !flavio) return "Sem voto nominal"
  if (lula === flavio) return "Empate"
  const nome = lula > flavio ? "Lula" : "Flávio"
  const total = lula + flavio
  const vantagem = (Math.abs(lula - flavio) / total) * 100
  return `${nome} ${vantagem.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} pts`
}
