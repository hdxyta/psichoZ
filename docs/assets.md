# Artes e tipografia — Entrega 1

Os quatro PNGs fornecidos foram localizados em `C:/Users/Pedro/Documents/YTA/ALMBUM PSICOSE CAPA/REFS/1x/` e copiados sem alteração para `source-art/`. Todos têm 3000 × 3000 pixels. O SHA-256 de cada cópia foi comparado ao arquivo de origem: os quatro pares são idênticos. Os originais não pertencem ao diretório público.

## Mapa de origem

| Arquivo original em `source-art/` | Derivado em `public/assets/` | Dimensões | Bytes |
|---|---|---:|---:|
| `Teste Export fundo preto 4.png` | `cover-dark-640.webp` | 640 × 640 | 107.632 |
| `Teste Export fundo preto 4.png` | `cover-dark-1200.webp` | 1200 × 1200 | 293.980 |
| `Teste Export fundo branco 3.png` | `cover-light-900.webp` | 900 × 900 | 221.718 |
| `contra capa 1  fundo branco .png` | `back-light-900.webp` | 900 × 900 | 140.022 |
| `contra capa 1  fundo preto .png` | `back-dark-900.webp` | 900 × 900 | 110.284 |

Total dos cinco derivados: **873.636 bytes (0,833 MiB)**. Este é o tamanho dos arquivos em disco; a transferência efetiva depende da seleção responsiva e das imagens carregadas pela página. Não representa medição de rede. A versão 1200 px serve como opção de densidade maior da capa principal; a de 640 px permite economizar na abertura menor.

## Preparação reproduzível

Após `npm ci`, executar `npm run assets` (equivale a `node scripts/prepare-assets.mjs`). O script foi escrito para este projeto e revisado antes da execução: lê somente as quatro fontes locais e o pacote de fonte; redimensiona; grava os derivados; copia fonte/licença; registra hashes. Não acessa a rede, inicia subprocessos ou altera os originais.

Ferramentas efetivas: **sharp 0.35.4**, **libvips 8.18.6**. Transformação: redução de quadro inteiro com Lanczos3 e WebP qualidade 88, `smartSubsample: true`, esforço 6. Sem recorte, troca de cor, remoção de fundo ou redesenho. O manifesto completo, incluindo bytes e SHA-256 de fontes/derivados, está em `source-art/asset-manifest.json`, fora do build público.

O primeiro ensaio WebP lossless totalizou 1.608.824 bytes; o conjunto final tem 45,7% menos bytes. Esse comparativo é entre arquivos gerados, não entre visitas ao site. A redução usa compressão com perdas; os originais permanecem preservados.

## Revisão visual

Foram vistos o PNG original da capa escura e seus derivados finais de 1200 e 640 px, além da capa clara e das duas contracapas de 900 px. A composição quadrada, o lettering inteiro e os desenhos nas bordas permanecem presentes. Correntes, olhos e contornos vermelhos continuam reconhecíveis. Os traços mais tênues ficam naturalmente menos definidos na redução de 640 px; por isso ela não substitui um master ou arquivo para impressão. A referência original também contém áreas de baixo contraste e elas não foram recoloridas para a interface.

A contracapa é uma referência visual com 14 posições e **não define o catálogo final de 15 faixas**. Nenhum crédito ou nome artístico foi inferido das ilustrações.

## Fonte local e licença

UnifrakturCook, Latin, peso 700, normal, obtida do pacote instalado **`@fontsource/unifrakturcook@5.3.0`**. Origem do pacote: `https://github.com/fontsource/font-files`, diretório `fonts/google/unifrakturcook`; `publishHash` informado pelo pacote: `b9861068ccaf7870` (identificador do pacote, não declarado como commit Git).

O arquivo `files/unifrakturcook-latin-700-normal.woff2` foi copiado sem alteração para `public/fonts/unifrakturcook-latin-700.woff2`: **17.280 bytes**, SHA-256 `3304757748716ececd1b87999cb92d61ff5332aefbe8331d5155bbb68218e588`. A licença **SIL Open Font License 1.1** foi lida e copiada integralmente para `public/fonts/OFL.txt`, incluindo os avisos de copyright e o nome reservado. A fonte não foi modificada. Usa-se fonte de sistema para corpo e controles.

A licença da fonte não concede direitos sobre as artes do álbum. As artes foram usadas conforme o pedido do titular deste projeto; créditos editoriais finais continuam pendentes em `docs/content-checklist.md`. Nenhum áudio ou master foi copiado para `public/`.
