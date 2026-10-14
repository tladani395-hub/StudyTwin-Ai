const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');
const zlib = require('zlib');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const loadedChunks = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (url.endsWith('.js') && url.includes('/_next/static/chunks/')) {
      try {
        const body = await res.body();
        const gzipped = zlib.gzipSync(body);
        loadedChunks.push({
          name: url.split('/').pop(),
          rawBytes: body.length,
          gzipBytes: gzipped.length,
          content: body.toString('utf8'),
        });
      } catch {}
    }
  });

  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
    } catch {}
  });

  await page.goto('http://localhost:3000/?fps=1');
  await page.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 10000 });
  await page.waitForTimeout(2000);
  await browser.close();

  console.log('--- Network JS Chunks Loaded for Intro ---');
  let threeRelatedGzip = 0;
  let threeRelatedRaw = 0;
  let totalGzip = 0;
  let totalRaw = 0;

  for (const c of loadedChunks) {
    const isThree = c.content.includes('THREE') || c.content.includes('WebGLRenderer') || c.content.includes('BufferGeometry');
    if (isThree) {
      threeRelatedRaw += c.rawBytes;
      threeRelatedGzip += c.gzipBytes;
    }
    totalRaw += c.rawBytes;
    totalGzip += c.gzipBytes;

    console.log(
      `Chunk: ${c.name.padEnd(42)} | Raw: ${(c.rawBytes / 1024).toFixed(2).padStart(7)} KB | Gzip: ${(c.gzipBytes / 1024).toFixed(2).padStart(7)} KB ${isThree ? ' [3D / Three.js]' : ''}`
    );
  }

  console.log('----------------------------------------------------------------------');
  console.log(`Combined Three.js / 3D Intro Chunks: ${(threeRelatedRaw / 1024).toFixed(2)} KB raw | ${(threeRelatedGzip / 1024).toFixed(2)} KB gzipped`);
  console.log(`150 KB Budget Status:                 ${(threeRelatedGzip / 1024) <= 150 ? 'PASSED (Under 150 KB budget)' : 'EXCEEDED'}`);
  console.log(`Total of All Intro JS Chunks:        ${(totalRaw / 1024).toFixed(2)} KB raw | ${(totalGzip / 1024).toFixed(2)} KB gzipped`);
})();
