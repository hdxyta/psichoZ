# Playtest real — Woodstock

- Resultado: **Concluído**.
- Início: 2026-09-21T19:50:54.997Z. Fim: 2026-09-21T19:51:42.587Z.
- Ambiente: Chrome 153.0.8010.52, contexto isolado, headless, viewport 1280 × 800, redução de movimento, áudio desativado.
- Comando: `node scripts/playtest-woodstock.mjs`. URL: http://127.0.0.1:4173/#/jogar/track-01.
- Duração real do script: 47.6 s; períodos entre retomar e pausar: 41.4 s; teclas mantidas: 39.2 s. Estas medições não são duração típica de exploração humana nem medição de FPS.
- Controles reais nesta execução: botão “Jogar só com teclado”, W/A/S/D, P e E. O mapa visível na pausa informa posição/direção para corrigir a navegação.
- Nenhuma posição, vitória ou conquista foi injetada. O armazenamento foi apenas lido ao final, após a vitória pela saída.
- Combate: Rota oeste para evitar a sentinela; nenhum disparo nesta execução.
- Coleção e persistência após reload: confirmadas, track-01/level-01; NFC falso.
- Erros JavaScript: nenhum capturado.

## Percurso observado

| Marco | X | Z | Integridade | Símbolos | Tempo real acumulado |
|---|---:|---:|---:|---|---:|
| Saída do corredor | 0.00 | 10.03 | 100 | 0 / 3 | 5.1 s |
| Entrada oeste | -3.96 | 10.03 | 100 | 0 / 3 | 6.4 s |
| Contorno da parede oeste | -3.96 | 5.53 | 100 | 0 / 3 | 7.9 s |
| Símbolo olho | -8.96 | 4.02 | 100 | 0 / 3 | 10.0 s |
| Retorno oeste | -4.03 | 5.49 | 100 | 1 / 3 | 12.2 s |
| Abertura sul | -4.03 | 9.96 | 100 | 1 / 3 | 13.7 s |
| Entrada leste | 3.92 | 9.96 | 100 | 1 / 3 | 16.2 s |
| Corredor leste | 3.92 | -2.97 | 100 | 1 / 3 | 20.3 s |
| Símbolo mão | 8.96 | -2.97 | 100 | 1 / 3 | 22.0 s |
| Retorno leste | 4.03 | -2.97 | 100 | 2 / 3 | 23.7 s |
| Retorno sul leste | 4.03 | 9.95 | 100 | 2 / 3 | 27.7 s |
| Retorno sul oeste | -3.96 | 9.95 | 100 | 2 / 3 | 30.1 s |
| Passagem oeste | -3.96 | 5.56 | 100 | 2 / 3 | 31.6 s |
| Rota afastada da sentinela | -12.99 | 5.56 | 100 | 2 / 3 | 34.4 s |
| Contorno da grade oeste | -12.99 | -6.93 | 100 | 2 / 3 | 38.3 s |
| Símbolo corrente | -8.03 | -14.92 | 100 | 2 / 3 | 42.2 s |
| Retorno da corrente | -4.03 | -14.92 | 100 | 3 / 3 | 43.9 s |
| Contorno da grade final | -4.03 | -20.97 | 100 | 3 / 3 | 45.8 s |
| Saída | 0.00 | -20.97 | 100 | 3 / 3 | 47.1 s |

## Capturas

- [start](screenshots/woodstock-playtest-2026-09-21/2026-09-21T19-50-54-997Z/start.png)
- [three-symbols](screenshots/woodstock-playtest-2026-09-21/2026-09-21T19-50-54-997Z/three-symbols.png)
- [victory](screenshots/woodstock-playtest-2026-09-21/2026-09-21T19-50-54-997Z/victory.png)
- [collection](screenshots/woodstock-playtest-2026-09-21/2026-09-21T19-50-54-997Z/collection.png)
- [collection-reload](screenshots/woodstock-playtest-2026-09-21/2026-09-21T19-50-54-997Z/collection-reload.png)

## Limites

Percurso automatizado com mapa e rota previamente conhecida. Não substitui avaliação de dificuldade por uma pessoa, pointer lock, áudio, toque em aparelho físico ou medição de 2–4 minutos para primeira exploração.

---

# Registro anterior, preservado

# Playtest real — Woodstock

- Resultado: **Falhou**.
- Início: 2026-09-21T19:48:38.388Z. Fim: 2026-09-21T19:49:09.643Z.
- Ambiente: Chrome 153.0.8010.52, contexto isolado, headless, viewport 1280 × 800, redução de movimento, áudio desativado.
- Comando: `node scripts/playtest-woodstock.mjs`. URL: http://127.0.0.1:4173/#/jogar/track-01.
- Duração real do script: 31.3 s; períodos entre retomar e pausar: 23.1 s; teclas mantidas: 25.7 s. Estas medições não são duração típica de exploração humana nem medição de FPS.
- Controles reais: botão “Jogar só com teclado”, W/A/S/D, P, E, Espaço e setas. O mapa visível na pausa informa posição/direção para corrigir a navegação.
- Nenhuma posição, vitória ou conquista foi injetada. O armazenamento foi apenas lido ao final, após a vitória pela saída.
- Combate: disparos reais por Espaço e varredura por setas, sem desativar a sentinela; derrota observada
- Coleção e persistência após reload: não confirmadas.
- Erros JavaScript: nenhum capturado.

## Falha observada

A partida deixou de estar jogável: lost. Sua integridade chegou a zero. Recomece, use as paredes como proteção ou evite a sentinela.

## Percurso observado

| Marco | X | Z | Integridade | Símbolos | Tempo real acumulado |
|---|---:|---:|---:|---|---:|
| Saída do corredor | 0.00 | 10.06 | 100 | 0 / 3 | 4.9 s |
| Entrada oeste | -3.92 | 10.06 | 100 | 0 / 3 | 6.2 s |
| Contorno da parede oeste | -3.92 | 5.56 | 100 | 0 / 3 | 7.7 s |
| Símbolo olho | -8.96 | 4.05 | 100 | 0 / 3 | 9.8 s |
| Retorno oeste | -4.03 | 5.49 | 100 | 1 / 3 | 12.1 s |
| Abertura sul | -4.03 | 9.96 | 100 | 1 / 3 | 13.7 s |
| Entrada leste | 3.96 | 9.96 | 100 | 1 / 3 | 16.2 s |
| Corredor leste | 3.96 | -2.95 | 100 | 1 / 3 | 20.1 s |
| Símbolo mão | 8.97 | -2.95 | 100 | 1 / 3 | 21.7 s |
| Retorno leste | 4.03 | -2.95 | 100 | 2 / 3 | 23.5 s |
| Passagem norte | 4.03 | -10.80 | 100 | 2 / 3 | 25.9 s |
| Área da sentinela | 7.92 | -10.80 | 82 | 2 / 3 | 27.1 s |

## Capturas

- [start](screenshots/woodstock-playtest-2026-09-21/start.png)
- [failure](screenshots/woodstock-playtest-2026-09-21/failure.png)

## Limites

Percurso automatizado com mapa e rota previamente conhecida. Não substitui avaliação de dificuldade por uma pessoa, pointer lock, áudio, toque em aparelho físico ou medição de 2–4 minutos para primeira exploração.
