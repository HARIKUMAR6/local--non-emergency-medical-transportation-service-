import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(root, 'dist');

const pages = (await readdir(DIST)).filter((f) => f.endsWith('.html'));

const pageAnchorMap = new Map();

// Step 1: Gather all ids in each page
for (const page of pages) {
  const content = await readFile(path.join(DIST, page), 'utf8');
  const ids = new Set([...content.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  pageAnchorMap.set(page, { ids, content });
}

console.log(`Found ${pages.length} compiled pages in dist/: ${pages.join(', ')}\n`);

let totalNavLinks = 0;
let brokenLinks = 0;

for (const page of pages) {
  const { content } = pageAnchorMap.get(page);
  // Match only <a ... href="..."> tags to audit navigation links
  const aTagMatches = [...content.matchAll(/<a\b[^>]*\bhref="([^"]*)"[^>]*>/gi)];

  console.log(`--- Checking <a> links in ${page} (${aTagMatches.length} links) ---`);

  for (const match of aTagMatches) {
    const rawHref = match[1];

    // Skip mailto, tel, javascript, and external absolute http links
    if (rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:') || rawHref.startsWith('http://') || rawHref.startsWith('https://')) {
      continue;
    }

    totalNavLinks++;

    const [targetFile, targetHash] = rawHref.split('#');

    let destinationPage = targetFile || page;
    if (destinationPage === '' || destinationPage === '/') destinationPage = 'index.html';
    if (!destinationPage.endsWith('.html')) destinationPage += '.html';

    if (!pageAnchorMap.has(destinationPage)) {
      console.error(`  [BROKEN LINK] in ${page}: href="${rawHref}" -> Page ${destinationPage} does NOT exist!`);
      brokenLinks++;
      continue;
    }

    if (targetHash) {
      const destIds = pageAnchorMap.get(destinationPage).ids;
      if (!destIds.has(targetHash)) {
        console.error(`  [BROKEN ANCHOR] in ${page}: href="${rawHref}" -> Anchor #${targetHash} does NOT exist in ${destinationPage}!`);
        brokenLinks++;
        continue;
      }
    }
  }
}

console.log(`\n========================================`);
console.log(`Navigation Link Audit Results: ${totalNavLinks} navigation links verified across all pages.`);
if (brokenLinks === 0) {
  console.log(`SUCCESS: 0 broken navigation links or missing anchors found!`);
} else {
  console.error(`FAILED: ${brokenLinks} broken links detected!`);
  process.exit(1);
}
