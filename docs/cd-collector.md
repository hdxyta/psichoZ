# Edição física / Collector Access

Implementação solicitada em 01/10/2026. Amplia o escopo anterior com autenticação server-side exclusivamente para a edição física. A home, o catálogo editorial e o progresso dos jogos continuam independentes.

## Uso local

`npm run dev` abre o site; acesse `/cd` (normalizado para `/cd/`). O mesmo funciona com `npm run build` e `npm run preview`. O plugin local usa o mesmo handler da API de produção, com um adaptador de arquivos em `private/cd/`. Aceita somente host localhost/127.0.0.1. Não é um servidor de produção nem uma emulação do runtime Cloudflare.

A configuração local fica em `.env.local`, ignorado pelo Git, com `CD_ACCESS_CODE` e `CD_SESSION_SECRET`. A senha inicial solicitada foi configurada nesse arquivo, junto de uma chave de sessão aleatória. Os valores nunca usam prefixo `VITE_`, não são enviados ao navegador e não pertencem ao build. `.env.example` contém apenas campos vazios.

Os testes de navegador usam credenciais próprias, descartáveis, em outro servidor/porta. Comandos:

```text
npm run typecheck
npm test
npm run build
npm run check:build
npm run test:cd
npm run test:e2e -- tests/e2e/home.spec.ts
```

## Cloudflare Pages + R2

Não há conta conectada, bucket criado, upload ou deploy executado. Para publicar esta funcionalidade, o projeto precisa incluir **Pages Functions**, além de `dist/`:

1. Usar a raiz deste repositório como diretório do projeto Pages, `npm run build` como comando e `dist` como saída. O diretório `functions/` precisa participar da publicação. Enviar apenas `dist/` pelo drag-and-drop não entrega a API.
2. Definir secrets de runtime em Pages → Settings → Variables and Secrets, tanto no ambiente pretendido de produção quanto no preview: `CD_ACCESS_CODE` com o código inicial solicitado e `CD_SESSION_SECRET` com pelo menos 32 caracteres aleatórios. Não usar variáveis públicas `VITE_`.
3. Criar/selecionar um bucket **privado** para os arquivos aprovados. Desativar acesso público via `r2.dev` e domínio público nesse bucket. Vinculá-lo ao Pages com o nome **`CD_BUCKET`**. O bucket de arte pública existente, caso haja um, é separado.
4. Configurar os objetos aprovados em `server/cd/catalog.ts`; publicar novamente a função quando esse manifesto mudar. O segredo pode ser alterado no painel, seguido de novo deployment para aplicá-lo.
5. Manter HTTPS. O cookie `__Host-psicoz_cd` usa `HttpOnly; Secure; SameSite=Lax; Path=/` e dura 30 dias. Não há cookie inseguro de produção.
6. Não criar regras de cache que ignorem `private, no-store` em `/api/cd-*`. O arquivo `public/_routes.json` limita as invocações de Functions à API do CD.
7. Há limite simples de 10 tentativas por IP/minuto **por isolate**, sem banco. Para enforcement distribuído, configurar uma regra de rate limiting na borda para `POST /api/cd-access`, de acordo com os recursos da conta. O limite em memória sozinho não é global.
8. Validar no domínio publicado: código incorreto/correto, cookie após reload, logout, Range/206, downloads sem sessão retornando 401 e arquivos ausentes. Os testes locais não comprovam a configuração remota.

Referências consultadas: [Pages Functions](https://developers.cloudflare.com/pages/functions/), [bindings e secrets do Pages](https://developers.cloudflare.com/pages/functions/bindings/), [roteamento](https://developers.cloudflare.com/pages/functions/routing/) e [API R2 / streams e ranges](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).

## Áudios fornecidos em `psichoZTracks`

**Downloads bloqueados até o lançamento:** a data central em `src/config/site.ts` é `2026-10-31T00:00:00-03:00` (31/10/2026, 00h de São Paulo). O servidor usa seu próprio relógio para bloquear GET e HEAD de todos os downloads, inclusive álbum completo, com status 403. O catálogo omite as URLs e os botões ficam desabilitados com a data de disponibilidade. Player e waveforms continuam disponíveis. Na data, os arquivos configurados passam a ser liberados automaticamente em uma nova consulta/recarregamento; o ZIP continua dependente de arquivo configurado. Alterar o relógio do celular não libera os downloads. Essa mudança substitui a disponibilidade imediata registrada nos testes históricos abaixo.

O usuário forneceu 14 WAVs e autorizou seu uso no player. Eles foram associados às posições 01–14, na ordem já existente no catálogo. `IN VERSO` corresponde a Inverso, `PSICHO Z` a PsicoZ e `PSICOSE ... ft . NOBRE` a Psicose feat Nobre. Não foram alterados títulos, créditos ou status de publicação da home. A posição 15 continua sem título/áudio aprovado; o ZIP do álbum também continua pendente.

Originais preservados em `psichoZTracks/`, fora do build e ignorados pelo Git. As versões MP3 VBR de streaming e 1.200 peaks reais por faixa ficam em `private/cd/stream/` e `private/cd/peaks/`. O adaptador local entrega os WAVs originais nos endpoints autenticados de download, sem duplicá-los. MP3s têm aproximadamente 3–5,6 MiB por faixa. `server/cd/audio-manifest.json` registra duração, hash SHA-256, nome de origem e chaves versionadas por conteúdo; apenas a API recebe esse manifesto.

Para regenerar após substituir os WAVs: `python scripts/prepare-cd-audio.py`. Requer FFmpeg já instalado ou `--ffmpeg CAMINHO`; nesta máquina foi usado o binário já disponível pelo `imageio_ffmpeg`, sem instalar dependências. O script não altera nem normaliza os originais, não publica nada e não inclui arquivos no build. Reiniciar `npm run dev`/`npm run preview` após regenerar o manifesto.

Para a publicação futura, enviar os MP3s/peaks ao bucket privado nas chaves do manifesto e os WAVs originais nas chaves `download.key` correspondentes. A pasta local de originais não existe no runtime do Cloudflare. Nenhum upload foi realizado.

A demo pública `woodstock-demo-v1.wav` permanece no local anterior, usada pela experiência existente; o player do CD usa o arquivo recém-fornecido.

Os títulos são reutilizados de `src/data/catalog.ts`. `server/cd/catalog.ts` lê o manifesto gerado. Para uma faixa adicional aprovada, o formato de configuração é:

```ts
cdFiles['track-01'] = {
  durationSeconds: 222, // substituir pela duração real
  stream: { key: 'stream/track-01-v1.mp3', filename: '01-Woodstock.mp3', contentType: 'audio/mpeg' },
  download: { key: 'download/track-01-v1.wav', filename: '01-Woodstock.wav', contentType: 'audio/wav' },
  peaks: null,
};
```

Usar MP3/AAC leve para streaming e MP3 320/WAV aprovado para download. No teste local, o objeto `stream/track-01-v1.mp3` corresponde a `private/cd/stream/track-01-v1.mp3`; na produção, à mesma chave dentro do bucket privado. Não colocar músicas exclusivas, masters ou ZIPs em `public/`, `dist/` ou no bucket público de imagens.

Para o álbum completo, substituir `cdAlbum = null` por um `CDFile` apontando para um ZIP previamente preparado. O servidor entrega um stream; não monta ZIP em runtime. O navegador faz download nativo, sem carregar um Blob gigante em memória. A interface verifica disponibilidade com HEAD e informa que o download foi solicitado; progresso e falhas posteriores à transferência ficam sob controle do gerenciador de downloads do navegador.

Waveform: implementação própria com Canvas + Web Audio, sem dependência adicional. Somente a faixa ativa é processada. Por padrão, busca e decodifica seu arquivo otimizado (limite de 24 MiB, cancelamento ao trocar de faixa, timeout de 30 s). Para reduzir transferência e memória em celulares, recomenda-se preencher `peaks` com um pequeno JSON gerado previamente **a partir do áudio real**: array simples com até 4.000 amplitudes entre 0 e 1, máximo 64 KB. O player passa então a carregar esse JSON protegido, sem decodificação extra. Se a waveform falhar, a barra de seek continua disponível e o erro fica explícito.

## API e separação de acesso

| Endpoint | Função |
| --- | --- |
| `POST /api/cd-access` | Recebe `{code}`, valida no servidor e emite cookie assinado |
| `GET /api/cd-session` | Confirma sessão; 401 se inválida/expirada |
| `POST /api/cd-logout` | Expira apenas o cookie do CD |
| `GET /api/cd-catalog` | Retorna títulos, metadados e URLs da API para sessão válida |
| `GET/HEAD /api/cd-stream/track-01` | Streaming privado com suporte a Range |
| `GET/HEAD /api/cd-peaks/track-01` | Peaks privados, quando configurados |
| `GET/HEAD /api/cd-download/track-01` | Download individual autorizado |
| `GET/HEAD /api/cd-download/album` | ZIP previamente preparado |

Não há listagem de bucket nem parâmetro de chave arbitrária. Downloads e streaming verificam a assinatura e validade da sessão em **cada** requisição. POSTs exigem Origin do próprio site. Não há senha em localStorage; `psicoz:progress` nunca é lido/escrito pelo CD. Abrir a URL ou autenticar não publica faixas nem simula vitórias.

Para mudar a senha: alterar `CD_ACCESS_CODE` no ambiente server-side. Sessões emitidas anteriormente continuam válidas até o vencimento. Para invalidar todas imediatamente, trocar também `CD_SESSION_SECRET`. Logout remove o cookie desse navegador; sessões assinadas sem banco não têm revogação individual de tokens copiados.

Para migrar a códigos individuais, substituir `validateAccessCode()` em `server/cd/auth.ts` por consulta a hashes dos códigos em KV/D1 e retornar `{subject, edition}` com o identificador do CD. O formulário e o contrato `{code}` continuam iguais. Para conteúdos por CD/revogação individual, usar a identidade de `readSession()` para filtrar catálogo e autorizar cada arquivo, com consulta de revogação quando necessário. Nenhum banco, numeração fictícia ou conteúdo extra foi implementado agora.

## NFC

URL prevista para gravar na tag, **após publicar e validar nesse domínio**: `https://psichoz.hdxprod.uk/cd`. A tag contém somente esse link. O caminho `/cd/` equivalente também funciona. Não depende de Web NFC nem concede acesso por si só.

## Arquivos desta implementação

- Criados: `cd/index.html`; `src/cd/{page,api,player,waveform}.ts`; `src/cd/styles.css`; `server/cd/{auth,api,catalog,local-plugin}.ts`; `functions/api/[[path]].ts`; `public/_routes.json`; `playwright.cd.config.ts`; `tests/unit/cd-api.test.ts`; `tests/cd-e2e/{collector.spec,vite.config}.ts`; este guia e evidências em `docs/screenshots/cd/`.
- Modificados: `vite.config.ts` (segunda entrada e API local), `tsconfig.json` (typecheck do servidor), `package.json` (comando `test:cd`), `.env.example`, `.gitignore`, `README.md`, `docs/publication-notes.md`.
- Configuração local não versionada: `.env.local`.
- Novas dependências: **nenhuma**. Sem alterações necessárias em `package-lock.json`.

Screenshots `player-*` usam áudio sintético da suíte. Screenshots `real-player-*` usam os áudios fornecidos nesta atualização. Mobile é emulado; teste com CD/NFC em Android e iPhone físicos continua pendente.

## Verificação executada em 01/10/2026

Atualização com músicas reais: **as 14 faixas passaram no teste de reprodução em Chrome**, com avanço de tempo, pausa, waveform, seek e resposta HTTP Range/206. Downloads individuais foram conferidos por HEAD, com tamanho correspondente ao WAV original; acesso sem sessão permaneceu bloqueado. `node scripts/check-cd-audio.mjs` reproduz essa verificação contra o preview local (precisa de `.env.local` e servidor em `127.0.0.1:4176`). Layout real inspecionado em desktop/mobile, sem overflow em 375/390/430 px. Todos os 14 hashes dos originais foram reconferidos: inalterados. Os 621,1 MiB de WAV originaram 58,4 MiB de MP3 para aproximadamente 40min49s de música. Build e seus 169 arquivos continuam sem os áudios privados; os 191 testes unitários e os 12 testes de regressão do CD passaram novamente.

Arquivos adicionais desta atualização: `scripts/prepare-cd-audio.py`, `scripts/check-cd-audio.mjs` e `server/cd/audio-manifest.json`. Derivados privados não versionados: `private/cd/stream/` e `private/cd/peaks/`. Não houve instalação, upload ou deploy.

- Typecheck e build passaram; nenhuma dependência adicionada.
- Suíte unitária: **191 testes passaram**, incluindo 18 novos casos de autenticação/API, ranges, cookies adulterados/expirados e acesso privado.
- Regressão da home: **30 testes passaram** em desktop e mobile emulado (capa/painel, coleção, NFC, reload, storage inválido/bloqueado, reset, teclado e imagem ausente).
- Área CD: **12 testes passaram** em desktop e mobile emulado. Login real no handler local, senha incorreta, persistência/logout, estados 401/429/503, waveform decodificada de WAV de teste, seek, pausa, anterior/próxima, avanço automático, parada final e mini player. Download nativo validado através do handler real com objeto descartável em memória, fora do catálogo de produção.
- Acesso e player verificados sem overflow horizontal em **375, 390, 430, 768 e 1440 px**. Screenshots de acesso, player, mini player e painel da home inspecionadas visualmente.
- `npm run check:build` passou: 169 arquivos, aproximadamente 2,5 MB totais. Varredura adicional de 110 arquivos textuais do build não encontrou a chave local de sessão nem a implementação de autenticação do servidor.
- A verificação inicial encontrou o fallback incorreto de `/cd` para a home no preview; corrigido com normalização para `/cd/`. O mock de áudio ganhou suporte a Range para testar seek corretamente. O download nativo foi validado no servidor de teste porque o download do Chromium não seguiu a interceptação de rede da página.
- O aviso do Vite sobre futuros imports com extensão permanece (o catálogo já existente usa imports sem extensão). Não impede build ou testes. `git diff --check` apontou somente linhas em branco em três arquivos de jogos previamente alterados, preservados fora deste escopo.
- Cloudflare/R2 reais, Safari/iOS e leitura de tag em aparelho físico não foram testados. Nenhum deploy, upload, commit ou push foi executado.
