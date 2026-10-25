export const ABERTURA_MS = Date.parse("2026-10-25T17:00:00-03:00")

export function restante(agora, abertura = ABERTURA_MS) {
  const ms = abertura - agora
  if (ms <= 0) return { aberto: true, horas: "00", minutos: "00", segundos: "00" }
  const total = Math.floor(ms / 1000)
  return {
    aberto: false,
    horas: String(Math.floor(total / 3600)).padStart(2, "0"),
    minutos: String(Math.floor((total % 3600) / 60)).padStart(2, "0"),
    segundos: String(total % 60).padStart(2, "0"),
  }
}
