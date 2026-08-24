// Publishes the built site into the repository root so GitHub Pages can serve
// it straight from the `main` branch (Settings -> Pages -> Deploy from a
// branch -> main / root). Run `npm run publish` after any content change.
//
// Everything the previous publish copied is listed in `.pages-manifest.json`,
// so a page that disappears from the build is also removed from the root
// instead of lingering as a stale URL.
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const manifestPath = join(root, '.pages-manifest.json');

// Source files that must never be deleted by a stale-entry sweep, even if a
// future build happens to emit something with the same name.
const PROTECTED = new Set([
  '.git', '.github', '.gitignore', '.nvmrc', '.astro', 'node_modules', 'dist',
  'src', 'public', 'scripts', 'package.json', 'package-lock.json',
  'astro.config.mjs', 'tsconfig.json', 'README.md', 'CONTENT_GUIDE.md',
  '.pages-manifest.json',
]);

const entries = await readdir(dist);

const previous = await readFile(manifestPath, 'utf-8')
  .then((raw) => JSON.parse(raw).files)
  .catch(() => []);

for (const name of previous) {
  if (entries.includes(name) || PROTECTED.has(name)) continue;
  await rm(join(root, name), { recursive: true, force: true });
}

for (const name of entries) {
  if (PROTECTED.has(name)) {
    throw new Error(`Build emitted "${name}", which collides with a source path.`);
  }
  await rm(join(root, name), { recursive: true, force: true });
  await cp(join(dist, name), join(root, name), { recursive: true });
}

// Every image is glob-imported so the build can read its metadata, which makes
// Astro emit the untouched original next to the variants a page actually uses.
// Nothing links to those, so they are swept here rather than shipped.
async function collect(dir, out = []) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) await collect(full, out);
    else out.push(full);
  }
  return out;
}

const assetDir = join(root, '_astro');
if (await stat(assetDir).catch(() => null)) {
  const readable = /\.(html|css|js|xml|json|webmanifest|txt)$/;
  const pages = (await collect(root)).filter(
    (file) => readable.test(file) && !file.startsWith(assetDir),
  );
  const linked = new Set();
  for (const file of pages) {
    for (const match of (await readFile(file, 'utf-8')).matchAll(/_astro\/([^"'\s,)]+)/g)) {
      linked.add(match[1]);
    }
  }
  let swept = 0;
  for (const asset of await readdir(assetDir)) {
    if (linked.has(asset)) continue;
    await rm(join(assetDir, asset), { force: true });
    swept += 1;
  }
  if (swept) console.log(`Swept ${swept} unreferenced asset(s) from _astro.`);
}

await writeFile(manifestPath, `${JSON.stringify({ files: entries.sort() }, null, 2)}\n`);
console.log(`Published ${entries.length} top-level entries to the repository root.`);
