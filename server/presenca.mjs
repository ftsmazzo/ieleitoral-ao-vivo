import { createHash, randomBytes } from "node:crypto"
import geoip from "geoip-lite"

const sal = randomBytes(16)
const sessoes = new Map()
const lugares = new Map()
const vistos = new Map()
const ONLINE = 90_000
const GEO_TTL = 6 * 60 * 60 * 1000

function ipDe(req) {
  const encaminhado = req.headers["x-forwarded-for"]
  if (typeof encaminhado === "string" && encaminhado.trim()) {
    const partes = encaminhado.split(",").map((parte) => parte.trim()).filter(Boolean)
    return partes[partes.length - 1].replace(/^::ffff:/, "")
  }
  return String(req.socket.remoteAddress || "").replace(/^::ffff:/, "")
}

function privado(ip) {
  return (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    ip.startsWith("127.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  )
}

function chaveDe(ip) {
  return createHash("sha256").update(sal).update(ip).digest("hex").slice(0, 20)
}

function limpar(agora) {
  for (const [id, sessao] of sessoes) {
    if (agora - sessao.visto > ONLINE) sessoes.delete(id)
  }
}

function localizar(ip) {
  if (privado(ip)) return { cidade: "Rede local", uf: "—", quando: Date.now() }
  const chave = chaveDe(ip)
  const guardado = lugares.get(chave)
  if (guardado && Date.now() - guardado.quando < GEO_TTL) return guardado
  const geo = geoip.lookup(ip)
  const lugar = !geo
    ? { cidade: "Não localizada", uf: "—", quando: Date.now() }
    : {
        cidade: geo.city || "Cidade não informada",
        uf: geo.country === "BR" ? geo.region || "—" : "Fora",
        quando: Date.now(),
      }
  lugares.set(chave, lugar)
  return lugar
}

export async function registrar(req, id) {
  const sessao = String(id || "").slice(0, 80)
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(sessao)) return false
  const ip = ipDe(req) || "sem"
  const chave = chaveDe(ip)
  const agora = Date.now()
  const existente = sessoes.get(chave)
  if (existente) {
    existente.visto = agora
    return true
  }
  const ultimo = vistos.get(chave) || 0
  vistos.set(chave, agora)
  let lugar = lugares.get(chave)
  if (!lugar || agora - ultimo > GEO_TTL) lugar = localizar(ip)
  sessoes.set(chave, { visto: agora, ip, cidade: lugar.cidade, uf: lugar.uf })
  return true
}

export function audiencia() {
  const agora = Date.now()
  limpar(agora)
  const porUf = new Map()
  const porCidade = new Map()
  const ips = []
  for (const sessao of sessoes.values()) {
    ips.push({ ip: sessao.ip, cidade: sessao.cidade, uf: sessao.uf })
    const uf = porUf.get(sessao.uf) || { uf: sessao.uf, agora: 0 }
    uf.agora += 1
    porUf.set(sessao.uf, uf)
    const cidadeChave = `${sessao.cidade}|${sessao.uf}`
    const cidade = porCidade.get(cidadeChave) || { cidade: sessao.cidade, uf: sessao.uf, agora: 0 }
    cidade.agora += 1
    porCidade.set(cidadeChave, cidade)
  }
  ips.sort((a, b) => a.uf.localeCompare(b.uf, "pt-BR") || a.cidade.localeCompare(b.cidade, "pt-BR") || a.ip.localeCompare(b.ip))
  return {
    agora: sessoes.size,
    ips,
    porUf: [...porUf.values()].sort((a, b) => b.agora - a.agora),
    porCidade: [...porCidade.values()].sort((a, b) => b.agora - a.agora).slice(0, 30),
    nota: "Cada IP entra uma vez, mesmo com várias abas. A lista cobre quem manteve a página aberta nos últimos 90 segundos e sai da memória depois disso.",
  }
}
