# Woodstock — mapa Inferno Cibernético

Adaptação solicitada em 01/10/2026. Arte original preservada em
`source-art/Mapa Neon de Inferno Cibernético.png`; derivado WebP de 569.228 bytes,
1536 × 1024, sem recorte ou recoloração. Regeneração documentada no README do jogo.

- Canvas 3:2, percurso traçado pelo centro da estrada e chegada no portal da arte.
- Oito sigilos reposicionados, botões acessíveis por teclado e toque, recursos fora da imagem.
- Layout em paisagem com controles laterais; mapa completo em retrato e desktop.
- Falha da imagem mantém a mesma geometria jogável com aviso e mapa simplificado.
- Regras de três ondas, conquista persistida e continuação existentes preservadas.

## Verificação

- `npm run build`: aprovado, incluindo TypeScript. Avisos preexistentes do Vite sobre futuros requisitos de imports da configuração.
- `npm test`: 192 testes aprovados.
- `npm run check:build`: aprovado; original fora do build.
- Playwright: 28 casos distintos aprovados, desktop e Pixel 7 emulado. Incluem construção por teclado/toque, vitória por inputs reais e reload, arte ausente, percurso sem torres até dano na base, pausa/reinício/saída, capa/painel, NFC e storage inválido/bloqueado.
- Após o último ajuste de CSS, os dois casos em paisagem foram repetidos e aprovados.
- Capturas de desktop, retrato, paisagem e fallback abertas e inspecionadas em `docs/screenshots/woodstock-inferno/`.

Nenhuma posição, vitória ou conquista foi injetada nos testes. Não houve teste em aparelho físico, publicação, commit ou push.
