# Preparação estática, sem publicação

`npm run build` gera `dist/`. Destino previsto pelo briefing: Cloudflare Pages para site estático e R2 para arquivos maiores, sem Worker ou Pages Functions. Não foram criados recursos ou configurações remotas nesta entrega. A skill cloudflare não foi instalada/aplicada: ela pertence à preparação futura de hospedagem.

Antes de publicar, revalidar a [documentação de limites do Pages](https://developers.cloudflare.com/pages/platform/limits/) e [CORS do R2](https://developers.cloudflare.com/r2/buckets/cors/). Nenhum original ou master pertence ao build desta etapa. ZIPs devem ser preparados previamente, nunca montados em Blob no celular.

O parâmetro público `VITE_ASSET_BASE_URL` troca o prefixo dos arquivos de arte e recompensas locais. Exemplo de teste, não domínio real: `https://assets.example.test/psicoz-v1`. Esse prefixo não muda o endereço dos bundles JS/CSS ou da fonte local. A configuração foi verificada por build temporário; conectividade com R2 continua pendente.

Na etapa de publicação, conferir Content-Type de WebP (`image/webp`), PNG (`image/png`), MP3 (`audio/mpeg`), ZIP (`application/zip`) e WOFF2 (`font/woff2`). Arquivos destinados a download entre domínios precisam de `Content-Disposition: attachment` com nome adequado; o atributo HTML `download` sozinho não basta. Reprodução e download podem exigir objetos/URLs distintos. Validar arquivo ausente, interrupção e nova tentativa com os URLs definitivos.

Permitir CORS apenas para as origens públicas de produção/preview necessárias e métodos realmente usados. Usar nomes versionados antes de cache longo, revalidar HTML e conferir headers reais do domínio final. Domínio público no R2 não garante, por si só, cache em toda requisição. Nenhum Cache-Control remoto foi aplicado aqui.

O `og:image` atual aponta para uma capa local real; após definição do domínio de assets/site, converter para URL absoluta e testar os previews sociais. Revisar metadata/data/status editorial, licença/créditos e autorização dos materiais. O endereço definitivo da tag também depende desse domínio.

Estado atual: pronto para testar localmente; **não aprovado para lançamento público**. Não há links finais, masters, arquivo de download publicado ou conta conectada.
