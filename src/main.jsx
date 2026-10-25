import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./App.jsx"
import { Audiencia } from "./Audiencia.jsx"
import "./styles.css"

const Pagina = window.location.pathname.startsWith("/audiencia") ? Audiencia : App

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Pagina />
  </StrictMode>,
)

if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {})
  })
}
