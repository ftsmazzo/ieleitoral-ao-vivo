export const FIRME = 95

export const UFS = [
  { uf: "AC", nome: "Acre", regiao: "Norte" },
  { uf: "AL", nome: "Alagoas", regiao: "Nordeste" },
  { uf: "AM", nome: "Amazonas", regiao: "Norte" },
  { uf: "AP", nome: "Amapá", regiao: "Norte" },
  { uf: "BA", nome: "Bahia", regiao: "Nordeste" },
  { uf: "CE", nome: "Ceará", regiao: "Nordeste" },
  { uf: "DF", nome: "Distrito Federal", regiao: "Centro-Oeste" },
  { uf: "ES", nome: "Espírito Santo", regiao: "Sudeste" },
  { uf: "GO", nome: "Goiás", regiao: "Centro-Oeste" },
  { uf: "MA", nome: "Maranhão", regiao: "Nordeste" },
  { uf: "MG", nome: "Minas Gerais", regiao: "Sudeste" },
  { uf: "MS", nome: "Mato Grosso do Sul", regiao: "Centro-Oeste" },
  { uf: "MT", nome: "Mato Grosso", regiao: "Centro-Oeste" },
  { uf: "PA", nome: "Pará", regiao: "Norte" },
  { uf: "PB", nome: "Paraíba", regiao: "Nordeste" },
  { uf: "PE", nome: "Pernambuco", regiao: "Nordeste" },
  { uf: "PI", nome: "Piauí", regiao: "Nordeste" },
  { uf: "PR", nome: "Paraná", regiao: "Sul" },
  { uf: "RJ", nome: "Rio de Janeiro", regiao: "Sudeste" },
  { uf: "RN", nome: "Rio Grande do Norte", regiao: "Nordeste" },
  { uf: "RO", nome: "Rondônia", regiao: "Norte" },
  { uf: "RR", nome: "Roraima", regiao: "Norte" },
  { uf: "RS", nome: "Rio Grande do Sul", regiao: "Sul" },
  { uf: "SC", nome: "Santa Catarina", regiao: "Sul" },
  { uf: "SE", nome: "Sergipe", regiao: "Nordeste" },
  { uf: "SP", nome: "São Paulo", regiao: "Sudeste" },
  { uf: "TO", nome: "Tocantins", regiao: "Norte" },
]

export const REGIOES = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"]

export function margem(lula, flavio) {
  const total = Number(lula) + Number(flavio)
  if (!total) return null
  return (Number(lula) - Number(flavio)) / total
}

export function lider(valor) {
  if (valor == null || valor === 0) return null
  return valor > 0 ? "Lula" : "Flávio"
}

export function classificar(m1, m2, pct) {
  if (m2 == null) return "aguardando"
  const parcial = pct == null || pct < FIRME
  const a = lider(m1)
  const b = lider(m2)
  let movimento = "empate"
  if (a && b && a !== b) movimento = "virou"
  else if (a && b && a === b) {
    movimento = Math.abs(m2) + 1e-12 < Math.abs(m1) ? "diminuiu" : "aumentou"
  } else if (!a && b) movimento = "virou"
  if (parcial && movimento !== "aguardando") return `${movimento}-parcial`
  return movimento
}

export function rotuloMovimento(codigo) {
  if (codigo.startsWith("virou")) return "Virou"
  if (codigo.startsWith("aumentou")) return "Aumentou"
  if (codigo.startsWith("diminuiu")) return "Diminuiu"
  if (codigo.startsWith("empate")) return "Empate"
  return "Aguardando"
}

export function familia(codigo) {
  if (codigo.startsWith("virou")) return "virou"
  if (codigo.startsWith("aumentou")) return "aumentou"
  if (codigo.startsWith("diminuiu")) return "diminuiu"
  if (codigo.startsWith("empate")) return "empate"
  return "aguardando"
}

export function pontos(valor) {
  if (valor == null || Number.isNaN(valor)) return null
  return valor * 100
}

export function fraseBrasil(m1, m2) {
  if (m2 == null) {
    return "O segundo turno ainda não tem voto nominal. O primeiro turno fica na mesa."
  }
  const agora = lider(m2)
  const antes = lider(m1)
  const pp = Math.abs(pontos(m2)).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })
  if (antes && agora && antes !== agora) {
    return `${agora} passou à frente nas 27 UFs, por ${pp} pontos.`
  }
  if (!agora) return "Empate na soma das 27 UFs."
  const delta = pontos(m2) - pontos(m1)
  const abs = Math.abs(delta).toLocaleString("pt-BR", { maximumFractionDigits: 1, minimumFractionDigits: 1 })
  if (Math.abs(delta) < 0.05) return `${agora} segue à frente, por ${pp} pontos.`
  const verbo = Math.abs(m2) > Math.abs(m1) ? "cresceu" : "encolheu"
  return `A vantagem de ${agora} ${verbo} ${abs} pontos.`
}

export function somar(linhas, chaveLula, chaveFlavio) {
  return linhas.reduce(
    (acc, linha) => {
      acc.lula += linha[chaveLula] || 0
      acc.flavio += linha[chaveFlavio] || 0
      return acc
    },
    { lula: 0, flavio: 0 },
  )
}
