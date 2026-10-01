# Referências de exemplos HTML5

Registro histórico da consulta conceitual em 22/09/2026. A incorporação efetiva de código e as revisões de licença de 30/09 estão em [game-sources.md](game-sources.md). As rotas atuais são descritas em [GAME_SYSTEM.md](GAME_SYSTEM.md).

Repositórios analisados em 22/09/2026:

- [spbooks/html5games1](https://github.com/spbooks/html5games1): arquivo didático organizado por capítulos. O README descreve exemplos independentes, servidor local e build de cada jogo. Usado como referência para manter cada microgame isolado e pequeno.
- [CoolDude2349/Offline-HTML-Games-Pack](https://github.com/CoolDude2349/Offline-HTML-Games-Pack/tree/master/offline): coleção de jogos em arquivos únicos. O README confirma a abordagem de arquivo autônomo, mas o repositório não apresentou uma licença de código clara durante a revisão; nenhum arquivo foi copiado.
- [makzan/HTML5-Games-Examples](https://github.com/makzan/HTML5-Games-Examples): coleção/tutorials de jogos HTML5, incluindo exemplos baseados em Canvas, CreateJS e Box2D. Usado como referência conceitual para separar loop, entrada e colisão; nenhuma dependência foi adicionada.

Aplicação no psicoZ:

- os microgames continuam como módulos TypeScript próprios carregados por rota;
- o loop de cada fase fica separado da UI e do save do álbum;
- entrada desktop e toque convergem para ações simples;
- colisão e recuperação são determinísticas e testáveis;
- a estética, os textos, o áudio e os assets permanecem autorais do projeto.

Não foram incorporados HTMLs, sprites, bibliotecas ou trechos de código dos repositórios sem licença verificável.

