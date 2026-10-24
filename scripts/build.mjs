// Static HTML build: resolves partial includes in src/pages/*.html and
// copies static assets into dist/. Tailwind compiles CSS separately.
//
// Include syntax (inside a page or partial):
//   <!-- @include header -->
//   <!-- @include head title="Services" description="..." -->
// Attributes become {{key}} placeholders inside the partial.

import { readFile, writeFile, mkdir, readdir, rm, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const DIST = path.join(root, 'dist');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');

const INCLUDE_RE = /<!--\s*@include\s+([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g;
const ATTR_RE = /([\w-]+)="([^"]*)"/g;
const MAX_DEPTH = 5;

const escapeHtml = (value) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function loadPartial(name) {
  const file = path.join(PARTIALS, `${name}.html`);
  if (!existsSync(file)) throw new Error(`Unknown partial "${name}" (expected ${file})`);
  return readFile(file, 'utf8');
}

async function resolveIncludes(html, source, depth = 0) {
  if (depth > MAX_DEPTH) throw new Error(`Include depth exceeded in ${source}`);

  const matches = [...html.matchAll(INCLUDE_RE)];
  let output = html;

  for (const [directive, name, rawAttrs] of matches) {
    const attrs = Object.fromEntries([...rawAttrs.matchAll(ATTR_RE)].map(([, k, v]) => [k, v]));
    let partial = await loadPartial(name);

    partial = partial.replace(/\{\{\s*([\w-]+)\s*\}\}/g, (_, key) => {
      if (!(key in attrs)) throw new Error(`Missing "${key}" for partial "${name}" in ${source}`);
      return escapeHtml(attrs[key]);
    });

    if (name === 'head' && /<title[\s>]/i.test(html)) {
      partial = partial.replace(/<title>[\s\S]*?<\/title>\r?\n?/, '');
    }

    partial = await resolveIncludes(partial, `${name}.html`, depth + 1);
    output = output.replace(directive, () => partial.trim());
  }

  return output;
}

export async function buildHtml({ clean = true } = {}) {
  const started = Date.now();
  if (clean) await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const pages = (await readdir(PAGES)).filter((f) => f.endsWith('.html'));
  for (const page of pages) {
    const html = await readFile(path.join(PAGES, page), 'utf8');
    await writeFile(path.join(DIST, page), await resolveIncludes(html, page));
  }

  // Static assets (JS, images, fonts). CSS is written by the Tailwind CLI.
  await cp(path.join(SRC, 'assets'), path.join(DIST, 'assets'), { recursive: true });

  console.log(`[html] built ${pages.length} page(s) in ${Date.now() - started}ms`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildHtml().catch((error) => {
    console.error(`[html] ${error.message}`);
    process.exit(1);
  });
}
