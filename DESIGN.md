---
name: IEleitoral Ao Vivo
description: A margem presidencial por UF, na mesa da Inteligência Eleitoral.
colors:
  night: "#0c0c0c"
  paper: "#f6f3ee"
  coral: "#f15d5a"
  mark: "#4ab848"
  plate: "#161616"
  line: "#3a3532"
  field: "#121212"
  ink-soft: "#ddd6cc"
  muted: "#b7b0a6"
  lula: "#8ec4e8"
  flavio: "#f0a05a"
  aumentou: "#b7d36a"
  diminuiu: "#e2b34a"
  parcial: "#a9bdd4"
  danger: "#ff6b6b"
typography:
  display:
    fontFamily: '"Archivo Black", sans-serif'
    fontSize: "clamp(1.8rem, 3.2vw, 2.7rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  title:
    fontFamily: '"Archivo Black", sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.04em"
  body:
    fontFamily: "Literata, Georgia, serif"
    fontSize: "1.05rem"
    lineHeight: 1.55
  label:
    fontFamily: '"Archivo Black", sans-serif'
    fontSize: "0.72rem"
    fontWeight: 400
    letterSpacing: "0.04em"
rounded:
  ie-radius: "0px"
spacing:
  "16": "16px"
  "28": "28px"
components:
  button-current:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.night}"
    rounded: "{rounded.ie-radius}"
    padding: "0 12px"
  stamp:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
    rounded: "{rounded.ie-radius}"
    padding: "5px 10px"
  plate:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.paper}"
    rounded: "{rounded.ie-radius}"
    padding: "16px 18px"
---

# Design System: IEleitoral Ao Vivo

## Overview

A sala de apuração lê a margem entre Lula e Flávio. A mesa é a do Mentirômetro: noite, placa, papel, coral e verde, Archivo Black e Literata, cantos retos, sombra nenhuma. O verde fica no carimbo Ao vivo e no foco. O coral marca o empate no trilho, o filtro ativo e a faixa de 2px sob o cabeçalho.

## Colors

Lula é o azul `#8ec4e8`. Flávio é o âmbar `#f0a05a`. O risco do empate é o coral. Virou usa o coral, aumentou o verde-lima `#b7d36a`, diminuiu o âmbar `#e2b34a`, parcial e aguardando o azul-acinzentado `#a9bdd4`.

## Typography

Archivo Black leva o nome, a frase da margem, os títulos de seção, os filtros e o carimbo. Literata leva o texto, os números tabulares e o detalhe da UF.

## Layout

Cabeçalho noturno com a marca e o carimbo. A coluna central mede no máximo 1180px. A frase vem primeiro. A placa nacional traz os dois trilhos. A faixa das regiões vem em seguida. Os filtros ficam imediatamente acima da tabela.

## Shapes

Cantos retos. O carimbo é vazado, com borda de 3px, outline interno e inclinação de -2deg, zerada em prefers-reduced-motion.

## Components

O trilho é uma barra partida no meio pelo risco coral. Sem voto nominal, a barra fica vazia e o risco permanece. A faixa desenha cada UF do primeiro turno ao segundo, Lula à esquerda e Flávio à direita. A tabela é a leitura firme: UF, dois trilhos, carimbo e percentual apurado.
