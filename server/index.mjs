import { createReadStream, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, extname, join, normalize } from "node:path"
import { fileURLToPath } from "node:url"
import { lerPainel, painelVazio } from "./tse.mjs"

const raiz = dirname(fileURLToPath(import.meta.url))
const dist = join(raiz, "..", "dist")
const porta = Number(process.env.PORT || 8787)

let painel = painelVazio()
let lendo = null

async function atualizar() {
  if (lendo) return lendo
  lendo = lerPainel()
    .then((proximo) => {
      painel = proximo
    })
    .catch((erro) => {
      painel = { ...painel, aviso: "A leitura do TSE falhou. A tela mantém a última mesa." }
      console.error(erro)
    })
    .finally(() => {
      lendo = null
    })
  return lendo
}

const tipos = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
}

function servirArquivo(res, caminho) {
  if (!existsSync(caminho) || !statSync(caminho).isFile()) return false
  res.writeHead(200, { "Content-Type": tipos[extname(caminho)] || "application/octet-stream" })
  createReadStream(caminho).pipe(res)
  return true
}

const servidor = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://localhost")
  if (url.pathname === "/api/painel") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    })
    res.end(JSON.stringify(painel))
    return
  }
  if (url.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" })
    res.end(JSON.stringify({ ok: true }))
    return
  }
  if (!existsSync(dist)) {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" })
    res.end("API no ar. Rode o Vite na porta 5173.")
    return
  }
  const pedido = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "")
  const arquivo = join(dist, pedido === "\\" || pedido === "/" ? "index.html" : pedido)
  if (servirArquivo(res, arquivo)) return
  if (servirArquivo(res, join(dist, "index.html"))) return
  res.writeHead(404).end()
})

servidor.listen(porta, () => {
  console.log(`IEleitoral Ao Vivo em http://localhost:${porta}`)
})

await atualizar()
setInterval(() => {
  atualizar()
}, 20000)
