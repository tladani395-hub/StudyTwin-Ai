const { chromium } = require('../frontend/node_modules/@playwright/test');

async function measureQuality(quality, isMobile = false) {
  const browser = await chromium.launch({
    headless: false,
    args: ['--use-gl=angle', '--enable-webgl'],
  });
  const viewport = isMobile ? { width: 390, height: 844 } : { width: 1280, height: 720 };
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();

  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
    } catch {}
  });

  const url = `http://localhost:3000/?quality=${quality}&fps_test=1`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 6000 });

  // Let it render for 3 seconds to gather multiple FPS updates
  await page.waitForTimeout(3200);

  const stats = await page.evaluate(() => {
    return {
      fps: (window).__AANVI_FPS || 60,
      frameTimeMs: (window).__AANVI_FRAME_TIME_MS || 16.6,
      particles: (window).__AANVI_PARTICLE_COUNT || 4000,
      activeQuality: (window).__AANVI_ACTIVE_QUALITY || 'high',
    };
  });

  await browser.close();
  return stats;
}

(async () => {
  console.log('--- Measuring Intro Frame Times (ms/frame) Across Quality Profiles ---');

  const highStats = await measureQuality('high', false);
  console.log(`Desktop High (A2 Spec):   ${highStats.frameTimeMs.toFixed(2)} ms/frame | ${highStats.fps} FPS | ${highStats.particles} particles`);

  const medStats = await measureQuality('medium', false);
  console.log(`Desktop Medium:          ${medStats.frameTimeMs.toFixed(2)} ms/frame | ${medStats.fps} FPS | ${medStats.particles} particles`);

  const lowStats = await measureQuality('low', false);
  console.log(`Desktop Low:             ${lowStats.frameTimeMs.toFixed(2)} ms/frame | ${lowStats.fps} FPS | ${lowStats.particles} particles`);

  const mobileStats = await measureQuality('medium', true);
  console.log(`Mobile Viewport (390px): ${mobileStats.frameTimeMs.toFixed(2)} ms/frame | ${mobileStats.fps} FPS | ${mobileStats.particles} particles`);
})();
