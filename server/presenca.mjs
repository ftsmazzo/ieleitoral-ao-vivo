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
  const ip = ipDe(req)
  const chave = chaveDe(ip || "sem")
  const agora = Date.now()
  const ultimo = vistos.get(chave) || 0
  if (agora - ultimo < 20_000 && sessoes.has(sessao)) {
    sessoes.get(sessao).visto = agora
    return true
  }
  vistos.set(chave, agora)
  let lugar = lugares.get(chave)
  if (!lugar || agora - lugar.quando > GEO_TTL) lugar = localizar(ip)
  sessoes.set(sessao, { visto: agora, chave, cidade: lugar.cidade, uf: lugar.uf })
  return true
}

export function audiencia() {
  const agora = Date.now()
  limpar(agora)
  const porUf = new Map()
  const porCidade = new Map()
  const chaves = new Set()
  for (const sessao of sessoes.values()) {
    chaves.add(sessao.chave)
    const uf = porUf.get(sessao.uf) || { uf: sessao.uf, agora: 0 }
    uf.agora += 1
    porUf.set(sessao.uf, uf)
    const cidadeChave = `${sessao.cidade}|${sessao.uf}`
    const cidade = porCidade.get(cidadeChave) || { cidade: sessao.cidade, uf: sessao.uf, agora: 0 }
    cidade.agora += 1
    porCidade.set(cidadeChave, cidade)
  }
  return {
    agora: sessoes.size,
    aparelhos: chaves.size,
    porUf: [...porUf.values()].sort((a, b) => b.agora - a.agora),
    porCidade: [...porCidade.values()].filter((linha) => linha.agora >= 3).sort((a, b) => b.agora - a.agora).slice(0, 30),
    nota: "Contagem de aparelhos com a página aberta nos últimos 90 segundos. O IP só resolve a cidade e não fica guardado. Não há nome de pessoa.",
  }
}
