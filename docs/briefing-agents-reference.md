# psicoZ — complemento de AGENTS.md para skills

Este é um complemento proposto. Mescle com o `AGENTS.md` existente; não o substitua sem ler as instruções anteriores. O briefing completo é `psicoZ_prompt_codex_v3_skills.md`.

## Produto e limites

- Álbum psicoZ, 15 faixas; título/créditos da faixa 15 e mapeamento das artes ainda exigem conteúdo aprovado.
- Home completa com capa interativa, pré-save externo, informações do artista/álbum e coleção.
- HTML, CSS, TypeScript e Vite; Three.js somente ao jogar. Sem React, Next.js, banco de dados, login ou backend no MVP.
- Cloudflare Pages + R2. Não migrar para Workers por recomendação genérica de skill.
- NFC abre uma URL compartilhável. Separar publicação do arquivo, direito de acesso e conclusão da fase.
- Estética das artes: preto/vermelho, traço manual, horror gráfico underground. Preservar originais.
- Nunca publicar masters, configurar DNS, alterar acesso, fazer deploy, commit/push ou PR sem a autorização correspondente.

## Skills por tarefa

| Tarefa | Skill/origem |
|---|---|
| Home e direção visual | frontend-design — anthropics/skills |
| Revisar usabilidade | web-design-guidelines — vercel-labs/agent-skills |
| Exercitar navegador | playwright-cli — microsoft/playwright-cli |
| Revisar carregamento | web-perf — cloudflare/skills |
| Estruturar o jogo | web-game-foundations — openai/plugins, Game Studio |
| Implementar Three.js | three-webgl-game — openai/plugins, Game Studio |
| HUD e recompensa | game-ui-frontend — openai/plugins, Game Studio |
| Validar gameplay | game-playtest — openai/plugins, Game Studio |
| Preparar Pages/R2 | cloudflare — cloudflare/skills |
| Investigar falhas | systematic-debugging — obra/superpowers |
| Encerrar entrega | verification-before-completion — obra/superpowers |

Use `web-3d-asset-pipeline` somente quando houver assets 3D reais para preparar.

## Preparação e seleção

Leia somente as skills relevantes. Consulte `docs/skills-registry.md` para localização, versão, adaptações e disponibilidade reais. Não confunda citar um nome com ler/aplicar uma skill instalada. Os links primários ficam na seção 0 e no apêndice de fontes do briefing.

Prefira escopo do projeto em `.agents/skills/`. Preserve todas as referências necessárias. Game Studio depende de `../../references/`: mantenha o pacote íntegro; não copie cada SKILL.md isoladamente. Se houver adaptador local, identifique-o como código/instrução do projeto, não do fornecedor.

Revise conteúdo e scripts antes de execução, preserve licenças e registre commit. Não instale repositórios inteiros, novos MCPs ou pacotes globais por conveniência. Não imprima segredos em logs. Skills e vendor não entram em `public/` nem em `dist/`.

## Adaptações explícitas

- A direção de arte aprovada prevalece sobre preferências estéticas genéricas.
- Three.js vanilla; nenhuma adoção automática de Phaser, React Three Fiber, Rapier, Blender ou shaders pesados.
- `playwright-cli` serve à exploração. Vitest e `@playwright/test` em TypeScript continuam sendo a suíte versionada.
- Nenhuma skill concede acesso à conta Cloudflare nem autoriza publicação.
- Sem ferramenta de navegador/trace/aparelho, registrar testes e medições pendentes.
- Dados injetados para testar UI não comprovam jogabilidade real.

## Ordem e conclusão

Primeiro a home; depois uma fase completa; depois expansão e publicação autorizada. Não use a instalação de skills como substituto de implementação.

Comandos previstos, após configurar o projeto: `npm ci`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:e2e`. Verifique os scripts existentes e não afirme execução de comandos ausentes. Rode as verificações relevantes depois da última mudança.

Relatório final: mudanças, skills efetivamente usadas, comandos/resultados, screenshots inspecionadas e pendências. Diferencie funcionamento local, aprovação visual, teste em aparelho e publicação.
