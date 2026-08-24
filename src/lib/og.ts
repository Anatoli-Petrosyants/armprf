import satori from 'satori';
import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FONTS = [
  {
    name: 'Archivo',
    data: readFileSync(resolve('./src/assets/og-fonts/archivo-700.woff')),
    weight: 700 as const,
    style: 'normal' as const,
  },
  {
    // Archivo carries no Armenian glyphs; satori falls through to this face.
    name: 'Noto Sans Armenian',
    data: readFileSync(resolve('./src/assets/og-fonts/noto-armenian-700.woff')),
    weight: 700 as const,
    style: 'normal' as const,
  },
];

const BG = '#0e1113';
const ACCENT = '#f2a800';
const INK = '#eef1f2';
const MUTED = '#9aa6ac';
const GRID = '#20282d';

interface OgInput {
  eyebrow: string;
  title: string;
  meta?: string;
}

/** Satori accepts React-shaped plain objects, so no JSX runtime is needed. */
const el = (type: string, style: Record<string, unknown>, children?: unknown) => ({
  type,
  props: { style, ...(children === undefined ? {} : { children }) },
});

function gridLines() {
  const lines = [];
  for (let x = 60; x < 1200; x += 60) {
    lines.push(el('div', { position: 'absolute', left: x, top: 0, width: 1, height: 630, background: GRID }));
  }
  for (let y = 60; y < 630; y += 60) {
    lines.push(el('div', { position: 'absolute', left: 0, top: y, width: 1200, height: 1, background: GRID }));
  }
  return lines;
}

function reticle() {
  return el(
    'div',
    { position: 'absolute', right: -110, top: 150, display: 'flex', width: 420, height: 420 },
    [
      el('div', {
        position: 'absolute', inset: 0, borderRadius: 999,
        border: `2px solid ${ACCENT}`, opacity: 0.35,
      }),
      el('div', {
        position: 'absolute', left: 110, top: 110, width: 200, height: 200, borderRadius: 999,
        border: `2px solid ${ACCENT}`, opacity: 0.25,
      }),
      el('div', { position: 'absolute', left: 0, top: 209, width: 420, height: 2, background: ACCENT, opacity: 0.3 }),
      el('div', { position: 'absolute', left: 209, top: 0, width: 2, height: 420, background: ACCENT, opacity: 0.3 }),
    ],
  );
}

/** 1200×630 social card. Rendered at build time, one PNG per page. */
export async function renderOg({ eyebrow, title, meta }: OgInput): Promise<Buffer> {
  const trimmed = title.length > 96 ? `${title.slice(0, 93)}…` : title;

  const tree = el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: 1200,
      height: 630,
      background: BG,
      padding: '64px 72px',
      position: 'relative',
      fontFamily: 'Archivo, "Noto Sans Armenian"',
      color: INK,
    },
    [
      ...gridLines(),
      reticle(),
      el('div', { display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }, [
        el('div', { width: 18, height: 18, borderRadius: 999, background: ACCENT }),
        el(
          'div',
          { fontSize: 22, letterSpacing: 4, textTransform: 'uppercase', color: ACCENT },
          eyebrow,
        ),
      ]),
      el(
        'div',
        {
          display: 'flex',
          fontSize: trimmed.length > 58 ? 56 : 72,
          lineHeight: 1.08,
          maxWidth: 900,
          position: 'relative',
        },
        trimmed,
      ),
      el('div', { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }, [
        el('div', { display: 'flex', fontSize: 26, letterSpacing: 6, color: INK }, 'ARMPRF'),
        el('div', { display: 'flex', fontSize: 22, color: MUTED }, meta ?? 'armprf.com'),
      ]),
    ],
  );

  const svg = await satori(tree as never, { width: 1200, height: 630, fonts: FONTS });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
