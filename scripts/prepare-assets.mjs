// Local, deterministic artwork preparation. No network access or subprocesses.
// Originals remain untouched and outside public/. Only full-frame resizes are made.
import { createHash } from 'node:crypto';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const sourceRoot = join(projectRoot, 'source-art');
const assetRoot = join(projectRoot, 'public', 'assets');
const fontRoot = join(projectRoot, 'public', 'fonts');
const fontPackageRoot = join(projectRoot, 'node_modules', '@fontsource', 'unifrakturcook');
const recipes = [
  ['Teste Export fundo preto 4.png', 'cover-dark-640.webp', 640],
  ['Teste Export fundo preto 4.png', 'cover-dark-1200.webp', 1200],
  ['Teste Export fundo branco 3.png', 'cover-light-900.webp', 900],
  ['contra capa 1  fundo branco .png', 'back-light-900.webp', 900],
  ['contra capa 1  fundo preto .png', 'back-dark-900.webp', 900],
];
const digest = (buffer) => createHash('sha256').update(buffer).digest('hex');
const entries = [];

await mkdir(assetRoot, { recursive: true });
await mkdir(fontRoot, { recursive: true });

for (const [source, output, width] of recipes) {
  const original = await readFile(join(sourceRoot, source));
  const metadata = await sharp(original).metadata();
  if (metadata.width !== metadata.height || metadata.width < width) {
    throw new Error(`Expected square source at least ${width}px: ${source}`);
  }
  // High quality and smart subsampling preserve the thin red artwork at UI sizes.
  // Only full-frame resizing and compression; no crop, tint, or background removal.
  const derivative = await sharp(original)
    .resize({ width, withoutEnlargement: true, kernel: 'lanczos3' })
    .webp({ quality: 88, smartSubsample: true, effort: 6 })
    .toBuffer();
  await writeFile(join(assetRoot, output), derivative);
  entries.push({
    source,
    sourceDimensions: [metadata.width, metadata.height],
    sourceBytes: original.byteLength,
    sourceSha256: digest(original),
    output: `public/assets/${output}`,
    dimensions: [width, width],
    bytes: derivative.byteLength,
    sha256: digest(derivative),
  });
}

const fontSource = join(fontPackageRoot, 'files', 'unifrakturcook-latin-700-normal.woff2');
const fontOutput = join(fontRoot, 'unifrakturcook-latin-700.woff2');
await copyFile(fontSource, fontOutput);
await copyFile(join(fontPackageRoot, 'LICENSE'), join(fontRoot, 'OFL.txt'));
const font = await readFile(fontOutput);
const fontPackage = JSON.parse(await readFile(join(fontPackageRoot, 'package.json'), 'utf8'));
const manifest = {
  tool: { name: 'sharp', version: sharp.versions.sharp, libvips: sharp.versions.vips },
  transformation: 'Full-frame Lanczos3 resize; WebP quality 88, smartSubsample, effort 6; no crop/recolor/background removal',
  images: entries,
  font: {
    package: fontPackage.name,
    version: fontPackage.version,
    source: 'files/unifrakturcook-latin-700-normal.woff2',
    output: 'public/fonts/unifrakturcook-latin-700.woff2',
    license: 'OFL-1.1; unmodified license copied to public/fonts/OFL.txt',
    bytes: font.byteLength,
    sha256: digest(font),
  },
};
await writeFile(join(sourceRoot, 'asset-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
for (const entry of entries) console.log(`${entry.output}: ${entry.bytes} bytes (${entry.dimensions.join(' × ')})`);
console.log(`All image derivatives: ${entries.reduce((total, entry) => total + entry.bytes, 0)} bytes`);
console.log(`Local font: ${font.byteLength} bytes`);
