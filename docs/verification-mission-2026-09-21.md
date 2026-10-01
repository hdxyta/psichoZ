# Verificação da fase Woodstock — 21/09/2026

Escopo: objetivo jogável da fase 1, direção visual industrial e controles existentes para mouse, teclado e toque.

- `npm run typecheck`: passou.
- `npx vite build --configLoader native`: passou; o bundle Three.js emite o aviso esperado de chunk acima de 500 kB.
- `npx vitest run --configLoader native --pool=threads --maxWorkers=1`: passou, 110 testes.
- `npm run check:build`: passou; sem masters, fontes originais, skills, ZIPs ou sourcemaps no build.
- `npx playwright test tests/e2e/mission.spec.ts --workers=1`: bloqueado pelo ambiente antes de iniciar o worker (`spawn EPERM`).
- `npm run test:performance`: bloqueado ao iniciar o Chrome (`spawn EPERM`).

A inspeção visual automatizada pelo navegador também ficou indisponível pelo mesmo bloqueio temporário de subprocessos. A fase mantém a limitação honesta de usar arte procedural e som demonstrativo; o MP3 de Woodstock continua pendente.
