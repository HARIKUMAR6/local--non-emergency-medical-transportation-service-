// Navigation and URL test script
const pages = [
  '',
  'index.html',
  'home-2.html',
  'services.html',
  'pricing.html',
  'about.html',
  'contact.html',
  'login.html',
  'dashboard.html'
];

async function run() {
  console.log('Testing server response for all pages...');
  let failed = 0;
  for (const page of pages) {
    const url = `http://localhost:3000/${page}`;
    try {
      const res = await fetch(url);
      const html = await res.text();
      const hasTitle = /<title>(.*?)<\/title>/i.test(html);
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'NONE';
      console.log(`[${res.status}] ${url.padEnd(35)} - Title: "${title}" (Length: ${html.length})`);
      if (res.status !== 200) failed++;
    } catch (err) {
      console.error(`[FAIL] ${url} -> ${err.message}`);
      failed++;
    }
  }

  // Also test cleanUrls (without .html extension)
  const cleanPages = ['services', 'pricing', 'about', 'contact', 'login', 'dashboard', 'home-2'];
  console.log('\nTesting cleanUrls support...');
  for (const page of cleanPages) {
    const url = `http://localhost:3000/${page}`;
    try {
      const res = await fetch(url);
      console.log(`[${res.status}] ${url.padEnd(35)} (cleanUrl redirect/response)`);
      if (res.status !== 200) failed++;
    } catch (err) {
      console.error(`[FAIL] ${url} -> ${err.message}`);
      failed++;
    }
  }

  if (failed === 0) {
    console.log('\nALL 16 URL CHECKS PASSED WITH 200 OK!');
  } else {
    console.error(`\n${failed} checks failed.`);
    process.exit(1);
  }
}

run();
