import { createHash } from "node:crypto"
import { createReadStream, existsSync, statSync } from "node:fs"
import { createServer } from "node:http"
import { dirname, extname, join, normalize, sep } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"
import { audiencia, registrar } from "./presenca.mjs"
import { lerPainel, painelVazio } from "./tse.mjs"

const raiz = dirname(fileURLToPath(import.meta.url))
const dist = join(raiz, "..", "dist")
const porta = Number(process.env.PORT || 8787)

let painel = painelVazio()
let corpo = Buffer.alloc(0)
let corpoZip = Buffer.alloc(0)
let etag = '""'
let marcaAtual = ""
let lendo = null
let pausaAte = 0

function publicar(proximo) {
  const estavel = Buffer.from(JSON.stringify({ ...proximo, gerado: "" }))
  const marca = createHash("sha1").update(estavel).digest("hex").slice(0, 16)
  if (marca === marcaAtual) return
  marcaAtual = marca
  painel = proximo
  corpo = Buffer.from(JSON.stringify(painel))
  corpoZip = gzipSync(corpo)
  etag = `"${marca}"`
}

async function atualizar() {
  if (lendo) return lendo
  if (Date.now() < pausaAte) return null
  lendo = lerPainel()
    .then((proximo) => {
      if (proximo.bloqueio) pausaAte = Date.now() + 60_000
      delete proximo.bloqueio
      publicar(proximo)
    })
    .catch((erro) => {
      publicar({ ...painel, aviso: "A leitura do TSE falhou. A tela mantém a última mesa." })
      console.error(erro.message || erro)
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
  ".webmanifest": "application/manifest+json; charset=utf-8",
}

function cacheDe(caminho) {
  const nome = caminho.split(sep).pop()
  if (caminho.includes(`${sep}assets${sep}`)) return "public, max-age=31536000, immutable"
  if (nome === "sw.js" || nome === "index.html" || nome === "manifest.webmanifest") return "no-cache"
  return "public, max-age=86400"
}

function enviar(req, res, status, buffer, cabecalhos) {
  const aceita = String(req.headers["accept-encoding"] || "")
  const zipPronto = buffer === corpo ? corpoZip : null
  if (status !== 304 && aceita.includes("gzip") && (zipPronto || buffer.length > 800)) {
    const zip = zipPronto && zipPronto.length ? zipPronto : gzipSync(buffer)
    res.writeHead(status, { ...cabecalhos, "Content-Encoding": "gzip", Vary: "Accept-Encoding", "Content-Length": zip.length })
    res.end(zip)
    return
  }
  res.writeHead(status, { ...cabecalhos, "Content-Length": buffer.length })
  res.end(buffer)
}

function lerCorpo(req) {
  return new Promise((resolve, rejeita) => {
    const pedacos = []
    let tamanho = 0
    req.on("data", (pedaco) => {
      tamanho += pedaco.length
      if (tamanho > 2000) {
        rejeita(new Error("corpo"))
        req.destroy()
        return
      }
      pedacos.push(pedaco)
    })
    req.on("end", () => resolve(Buffer.concat(pedacos).toString("utf8")))
    req.on("error", rejeita)
  })
}

function servirArquivo(req, res, caminho) {
  if (!existsSync(caminho) || !statSync(caminho).isFile()) return false
  const cabecalhos = {
    "Content-Type": tipos[extname(caminho)] || "application/octet-stream",
    "Cache-Control": cacheDe(caminho),
  }
  res.writeHead(200, cabecalhos)
  createReadStream(caminho).pipe(res)
  return true
}

const servidor = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost")
  if (url.pathname === "/api/painel") {
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, { ETag: etag, "Cache-Control": "public, max-age=8" })
      res.end()
      return
    }
    enviar(req, res, 200, corpo, {
      "Content-Type": "application/json; charset=utf-8",
      ETag: etag,
      "Cache-Control": "public, max-age=8",
    })
    return
  }
  if (url.pathname === "/api/health") {
    enviar(req, res, 200, Buffer.from('{"ok":true}'), { "Content-Type": "application/json" })
    return
  }
  if (url.pathname === "/api/presenca" && req.method === "POST") {
    try {
      const json = JSON.parse(await lerCorpo(req))
      const ok = await registrar(req, json.id)
      enviar(req, res, ok ? 204 : 400, Buffer.alloc(0), { "Cache-Control": "no-store" })
    } catch {
      res.writeHead(400).end()
    }
    return
  }
  if (url.pathname === "/api/audiencia") {
    const chave = process.env.AUDIENCIA_CHAVE || ""
    if (!chave || url.searchParams.get("chave") !== chave) {
      res.writeHead(404).end()
      return
    }
    enviar(req, res, 200, Buffer.from(JSON.stringify(audiencia())), {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    })
    return
  }
  if (!existsSync(dist)) {
    enviar(req, res, 200, Buffer.from("API no ar. Rode o Vite na porta 5173."), { "Content-Type": "text/plain; charset=utf-8" })
    return
  }
  const pedido = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "")
  const arquivo = join(dist, pedido === "\\" || pedido === "/" ? "index.html" : pedido)
  if (servirArquivo(req, res, arquivo)) return
  if (!extname(pedido) && servirArquivo(req, res, join(dist, "index.html"))) return
  res.writeHead(404).end()
})

servidor.listen(porta, () => {
  console.log(`IEleitoral Ao Vivo em http://localhost:${porta}`)
})

publicar(painel)
await atualizar()
setInterval(() => {
  atualizar()
}, 20000)

publicar(painel)
