import assert from "node:assert/strict"
import test from "node:test"
import { restante } from "./abertura.mjs"
import { classificar, fraseBrasil, margem } from "./apuracao.mjs"

test("margem positiva quando Lula tem mais votos", () => {
  assert.ok(margem(60, 40) > 0)
  assert.equal(margem(0, 0), null)
})

test("vira quando o sinal da margem troca", () => {
  assert.equal(classificar(0.1, -0.05, 98), "virou")
  assert.equal(classificar(0.1, -0.05, 40), "virou-parcial")
})

test("aumenta e diminui com o mesmo líder", () => {
  assert.equal(classificar(-0.04, -0.08, 99), "aumentou")
  assert.equal(classificar(-0.08, -0.03, 99), "diminuiu")
})

test("contador zera na abertura das 17h", () => {
  const abertura = Date.parse("2026-10-25T17:00:00-03:00")
  assert.deepEqual(restante(abertura - 3_661_000, abertura), {
    aberto: false,
    horas: "01",
    minutos: "01",
    segundos: "01",
  })
  assert.equal(restante(abertura, abertura).aberto, true)
  assert.equal(restante(abertura + 5_000, abertura).aberto, true)
})

test("sem voto no segundo turno fica aguardando", () => {
  assert.equal(classificar(-0.02, null, 0), "aguardando")
  assert.match(fraseBrasil(-0.02, null), /ainda não tem voto nominal/)
})
