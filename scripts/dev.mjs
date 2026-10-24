// Development loop: rebuild HTML and CSS whenever src/ changes, and serve
// dist/ locally. Uses node's fs.watch rather than Tailwind's --watch, whose
// native file watcher is not reliable on every platform.

import { watch } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildHtml } from './build.mjs';
import { serve } from './serve.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src');
const TAILWIND = path.join(root, 'node_modules', '@tailwindcss', 'cli', 'dist', 'index.mjs');

function buildCss() {
  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(
      process.execPath,
      [TAILWIND, '-i', 'src/css/input.css', '-o', 'dist/assets/css/styles.css'],
      { cwd: root, stdio: ['ignore', 'ignore', 'pipe'] },
    );
    let errors = '';
    child.stderr.on('data', (chunk) => (errors += chunk));
    child.on('close', (code) => {
      if (code === 0) console.log(`[css]  built in ${Date.now() - started}ms`);
      else console.error(`[css]  ${errors.trim()}`);
      resolve();
    });
  });
}

async function rebuild({ clean = false } = {}) {
  try {
    await buildHtml({ clean });
  } catch (error) {
    console.error(`[html] ${error.message}`);
  }
  await buildCss();
}

// Serialise rebuilds; a change during a build schedules one more pass.
let running = false;
let queued = false;
async function schedule() {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  do {
    queued = false;
    await rebuild();
  } while (queued);
  running = false;
}

await rebuild({ clean: true });

let timer;
watch(SRC, { recursive: true }, () => {
  clearTimeout(timer);
  timer = setTimeout(schedule, 80);
});

serve();
