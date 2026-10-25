export function aparelho() {
  const guardado = sessionStorage.getItem("ie-aparelho")
  if (guardado) return guardado
  const id = crypto.randomUUID()
  sessionStorage.setItem("ie-aparelho", id)
  return id
}

export function pulso() {
  const id = aparelho()
  const enviar = () => {
    if (document.visibilityState === "hidden") return
    fetch("/api/presenca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      keepalive: true,
    }).catch(() => {})
  }
  enviar()
  const idIntervalo = setInterval(enviar, 60_000)
  document.addEventListener("visibilitychange", enviar)
  return () => {
    clearInterval(idIntervalo)
    document.removeEventListener("visibilitychange", enviar)
  }
}
