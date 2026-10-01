# Ensaios dos protótipos anteriores

Preservados após a mudança solicitada em 30/09/2026 para 15 jogos distintos
copiados de bases autorizadas do GitHub. As implementações antigas continuam
em src/game e src/game/arcade, mas não são mais as rotas públicas do álbum.
Estes testes descrevem controles, mapas, HUD e objetivos daqueles protótipos;
não são regressões das novas implementações e não compõem a suíte E2E ativa.

A suíte atual em tests/e2e/vendor-games.spec.ts verifica as 15 fontes reais,
carregamento, pausa, reinício, descarte, input, conquista, NFC e persistência.
Scripts de playtest específicos verificam adicionalmente partidas dos jogos
copiados sem injetar vitórias. Evidências antigas não aprovam versões novas.
