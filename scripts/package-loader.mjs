import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loaderRoot = path.join(root, 'resident-loader');
const outputDirectory = path.join(root, 'public', 'downloads');
const outputPath = path.join(outputDirectory, 'resident-loader-v0.1.0.zip');
const zip = new JSZip();
const releaseTimestamp = new Date('2026-08-14T11:00:00.000Z');

for (const relativePath of ['manifest.json', 'README.md', 'dist/index.js', 'dist/style.css']) {
  zip.file(relativePath, await readFile(path.join(loaderRoot, relativePath)), {
    date: releaseTimestamp,
    createFolders: false,
  });
}

const archive = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
});
await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, archive);

const sha256 = createHash('sha256').update(archive).digest('hex');
console.log(`Resident Loader package: ${outputPath}`);
console.log(`SHA-256: ${sha256}`);
