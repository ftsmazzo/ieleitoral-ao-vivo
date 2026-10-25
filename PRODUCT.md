# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React no navegador e um servidor Node que consulta os arquivos oficiais do TSE. A escolha de Vite + React foi do usuário. Publicação na VPS do Inteligência Eleitoral, projeto inteligencia-eleitoral-brasil.

## Users

A equipe do Inteligência Eleitoral, reunida na sala de apuração do segundo turno de 2026. O trabalho é ler, enquanto a totalização corre, se a margem entre Lula e Flávio em cada UF aumentou, diminuiu ou virou em relação ao primeiro turno.

## Product Purpose

Comparar, por UF, a margem do segundo turno da eleição presidencial com a margem do primeiro turno, só entre os dois candidatos. Sucesso é a sala apontar, durante a apuração, onde a vantagem cresceu, encolheu ou trocou de lado, sem esperar o boletim final.

## Positioning

A leitura é a margem entre os dois, não o percentual sobre todos os votos válidos e não um mapa de escola ou bairro. O carimbo de cada UF só fica firme quando a apuração daquela UF passa de 95% das seções. O exterior (ZZ) fica de fora das 27 UFs.

## Operating Context

Segundo turno presidencial, 25 de outubro de 2026. A divulgação oficial começa às 17h, horário de Brasília. A tela fica aberta na sala, atualizando sozinha. O primeiro turno já está fechado. O segundo turno chega pelos arquivos JSON do TSE (eleição 6258, cargo 0001), Brasil e uma UF por vez.

## Capabilities and Constraints

Filtros por movimento (virou, aumentou, diminuiu), por região e por UF, com ordenação. Enquanto a UF está abaixo de 95% das seções, o carimbo aparece como parcial. Sem voto nominal no segundo turno, a tela mostra o primeiro turno e diz que a apuração ainda não entrou. Fora deste produto: outros cargos, município, bairro, local de votação e o exterior.

## Brand Commitments

O nome deste produto é IEleitoral Ao Vivo. A marca ao lado é Inteligência Eleitoral. A identidade visual é a do Mentirômetro, aplicativo do repositório checagem-debate: noite #0c0c0c, coral #f15d5a, verde #4ab848, papel #f6f3ee, Archivo Black e Literata, cantos retos, carimbo vazado, sombra nenhuma. O Mentirômetro não é este produto; é a referência visual.

## Evidence on Hand

Votação nominal do primeiro turno de 2026, presidente, turno 1, candidatos 13 e 22, somada por UF a partir de eleicao.votacao no banco iebrasil. Totais conferidos: Lula 53.722.151, Flávio 55.960.603, nas 27 UFs. O segundo turno é lido ao vivo de resultados.tse.jus.br. Não há depoimento nem audiência medida para citar.

## Product Principles

- A margem é entre os dois candidatos, na UF.
- Carimbo firme só depois de 95% das seções.
- O primeiro turno permanece visível quando o segundo ainda está em zero.
- A tela nomeia o movimento: virou, aumentou ou diminuiu.
- A marca é a da Inteligência Eleitoral, na mesa do Mentirômetro.
