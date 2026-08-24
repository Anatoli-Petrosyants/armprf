#!/usr/bin/env python3
"""Turn the federation charter (.odt) into a print-ready HTML page.

The ODT is a zip; content.xml holds the document body. We walk it in document
order, keeping paragraphs, headings and list structure, and drop the empty
spacer paragraphs the word processor leaves behind.
"""
import base64
import html
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

TEXT = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0'
q = lambda t: t.split('}')[-1]

src, out_html, root = sys.argv[1], sys.argv[2], Path(sys.argv[3])

with zipfile.ZipFile(src) as z:
    content = z.read('content.xml')

body = ET.fromstring(content)
office_body = next(el for el in body.iter() if q(el.tag) == 'text')

blocks = []

def walk(node, in_list=False):
    for el in node:
        tag = q(el.tag)
        if tag in ('p', 'h'):
            text = ''.join(el.itertext()).strip()
            if not text:
                continue
            level = el.get(f'{{{TEXT}}}outline-level')
            blocks.append(('li' if in_list else ('h' + level if level else 'p'), text))
        elif tag == 'list':
            walk(el, in_list=True)
        elif tag == 'list-item':
            walk(el, in_list=in_list)
        else:
            walk(el, in_list=in_list)

walk(office_body)

def font(path, family, weight):
    data = base64.b64encode(Path(path).read_bytes()).decode()
    return (f"@font-face{{font-family:'{family}';font-weight:{weight};font-display:block;"
            f"src:url(data:font/woff2;base64,{data}) format('woff2');}}")

fonts = ''.join([
    font(root / 'public/fonts/noto-sans-armenian-armenian.woff2', 'NotoArm', '400 700'),
    font(root / 'public/fonts/archivo-latin.woff2', 'ArchivoLat', '400 700'),
])

parts = []
open_list = False
for kind, text in blocks:
    if kind == 'li' and not open_list:
        parts.append('<ul>')
        open_list = True
    if kind != 'li' and open_list:
        parts.append('</ul>')
        open_list = False
    esc = html.escape(text)
    if kind == 'li':
        parts.append(f'<li>{esc}</li>')
    elif kind.startswith('h'):
        lvl = min(int(kind[1:]), 4)
        parts.append(f'<h{lvl}>{esc}</h{lvl}>')
    else:
        parts.append(f'<p>{esc}</p>')
if open_list:
    parts.append('</ul>')

page = f"""<!doctype html>
<html lang="hy"><head><meta charset="utf-8">
<title>ARMPRF կանոնադրություն</title>
<style>
{fonts}
@page {{ size: A4; margin: 22mm 20mm; }}
html {{ -webkit-print-color-adjust: exact; }}
body {{ font-family: 'NotoArm','ArchivoLat',sans-serif; font-size: 10.5pt; line-height: 1.55;
        color: #14181a; margin: 0; }}
h1,h2,h3,h4 {{ font-weight: 700; line-height: 1.3; margin: 1.4em 0 .5em; page-break-after: avoid; }}
h1 {{ font-size: 15pt; }} h2 {{ font-size: 13pt; }} h3 {{ font-size: 11.5pt; }} h4 {{ font-size: 11pt; }}
p {{ margin: 0 0 .55em; text-align: justify; }}
ul {{ margin: 0 0 .8em 1.1em; padding: 0; }}
li {{ margin: 0 0 .35em; }}
</style></head><body>
{''.join(parts)}
</body></html>"""

Path(out_html).write_text(page, encoding='utf-8')
print(f'{len(blocks)} blocks -> {out_html}')
