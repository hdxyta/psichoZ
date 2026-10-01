# psicoZ — instruções do projeto

- Escopo atual: Entrega 1 (home/base funcional). Jogo e publicação exigem solicitação posterior.
- HTML, CSS, TypeScript e Vite. Sem React, Next.js, backend, login, Workers ou Pages Functions. Three.js somente na futura entrega do jogo e por importação dinâmica.
- Preserve originais em source-art/, fora do build. Não inclua masters, ZIPs inéditos, segredos ou scripts de skills em public/ ou dist/.
- Conteúdo não aprovado é null e pendência explícita. Manter 15 IDs track-01…track-15; lançamento planejado 2026-10-31 centralizado em src/config/site.ts.
- NFC é URL compartilhável. Separar publicação, acesso e conquista; nunca simular vitórias.
- Estado local versionado em psicoz:progress. Reset apenas do projeto, com confirmação; não usar localStorage.clear().
- Comandos: npm ci --ignore-scripts; npm run dev; npm run typecheck; npm test; npm run build; npm run preview; npm run test:e2e; npm run assets.
- Consultar docs/skills-registry.md antes de preparar skills. Fontes locais revisadas em docs/vendor-skills; não afirmar instalação global ou descoberta automática.
- Testar teclado, toque emulado, capa/painel, coleção/NFC/reload, storage inválido e imagens ausentes. Inspecionar screenshots; testes não comprovam aparelho físico.
- Não alterar configurações globais, conectar MCPs, executar deploy, upload, commit, push ou PR sem autorização correspondente.
