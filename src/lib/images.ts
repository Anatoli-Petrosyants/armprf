import type { ImageMetadata } from 'astro';

/**
 * Every image on the site is addressed as `/img/<folder>/<file>` and lives at
 * `src/assets/img/<folder>/<file>`, so content files never mention `src/`.
 * Eager glob is required: Astro needs the metadata at build time to emit
 * responsive AVIF/WebP variants.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/img/**/*.{jpg,jpeg,png,webp,avif,gif}',
  { eager: true },
);

const svgModules = import.meta.glob<{ default: ImageMetadata }>('/src/assets/img/**/*.svg', {
  eager: true,
});

const byPath = new Map<string, ImageMetadata>();
for (const [key, mod] of Object.entries({ ...modules, ...svgModules })) {
  byPath.set(key.replace('/src/assets/img/', '/img/'), mod.default);
}

const missing = new Set<string>();

/** Resolve `/img/...` to processed image metadata. Unknown paths warn once. */
export function resolveImage(path: string | undefined): ImageMetadata | undefined {
  if (!path) return undefined;
  const found = byPath.get(path);
  if (!found && !missing.has(path)) {
    missing.add(path);
    console.warn(`[images] missing file for ${path} — expected src/assets${path}`);
  }
  return found;
}
