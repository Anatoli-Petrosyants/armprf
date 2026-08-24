// Publishes the built site into the repository root so GitHub Pages can serve
// it straight from the `main` branch (Settings -> Pages -> Deploy from a
// branch -> main / root). Run `npm run publish` after any content change.
//
// Everything the previous publish copied is listed in `.pages-manifest.json`,
// so a page that disappears from the build is also removed from the root
// instead of lingering as a stale URL.
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
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

await writeFile(manifestPath, `${JSON.stringify({ files: entries.sort() }, null, 2)}\n`);
console.log(`Published ${entries.length} top-level entries to the repository root.`);
