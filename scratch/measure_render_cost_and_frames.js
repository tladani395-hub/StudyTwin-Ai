const { chromium } = require('d:/StudyTwin-AI/frontend/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const BRAIN_DIR = 'C:/Users/Tirth/.gemini/antigravity/brain/b57d341f-3178-41ff-865e-6f1f32d21ba5';
const OUT_DIR = path.join(__dirname, 'f0_measurements');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  console.log('--- Step 1: Measuring True Render Cost for 4 Quality Profiles ---');

  const profiles = [
    { name: 'high', width: 1280, height: 800, isMobile: false, expectedPts: 4000 },
    { name: 'medium', width: 1024, height: 768, isMobile: false, expectedPts: 2500 },
    { name: 'low', width: 1280, height: 800, isMobile: false, expectedPts: 1600 },
    { name: 'mobile', width: 390, height: 844, isMobile: true, expectedPts: 1200 },
  ];

  for (const prof of profiles) {
    const context = await browser.newContext({
      viewport: { width: prof.width, height: prof.height },
      isMobile: prof.isMobile,
    });
    const page = await context.newPage();

    // Set quality override before page scripts run
    await page.addInitScript((quality) => {
      window.__AANVI_QUALITY_OVERRIDE = quality === 'mobile' ? 'high' : quality; // for mobile, isMobile determines ~1200
      window.__AANVI_DISABLE_AUTOFINISH = true;
    }, prof.name);

    await page.goto(`http://localhost:3000/?quality=${prof.name === 'mobile' ? 'high' : prof.name}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas[data-testid="three-intro-canvas"]', { timeout: 10000 });

    // Allow animation to run for 2.5 seconds to collect stable render cost samples
    await page.waitForTimeout(2500);

    const metrics = await page.evaluate(() => {
      return {
        renderCostMs: (window).__AANVI_RENDER_COST_MS || (window).__AANVI_LAST_RENDER_COST_MS || 0,
        lastRenderCostMs: (window).__AANVI_LAST_RENDER_COST_MS || 0,
        frameIntervalMs: (window).__AANVI_FRAME_TIME_MS || 16.66,
        fps: (window).__AANVI_FPS || 60,
        particleCount: (window).__AANVI_PARTICLE_COUNT || 0,
        activeQuality: (window).__AANVI_ACTIVE_QUALITY || 'unknown',
      };
    });

    console.log(`Profile: ${prof.name.toUpperCase()}`);
    console.log(`  Particles: ${metrics.particleCount} (Target: ~${prof.expectedPts})`);
    console.log(`  True Render Cost: ${metrics.renderCostMs.toFixed(3)} ms (Last frame: ${metrics.lastRenderCostMs.toFixed(3)} ms)`);
    console.log(`  Frame Interval: ${metrics.frameIntervalMs.toFixed(2)} ms (Capped VSync: ${metrics.fps} FPS)`);

    results[prof.name] = metrics;
    await context.close();
  }

  console.log('\n--- Step 2: Capturing Frames at 3.0s, 5.2s, 6.0s, 7.0s for Visual Audit ---');
  const frameContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const framePage = await frameContext.newPage();

  await framePage.addInitScript(() => {
    window.__AANVI_DISABLE_AUTOFINISH = true;
  });

  await framePage.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await framePage.waitForSelector('canvas[data-testid="three-intro-canvas"]', { timeout: 10000 });

  const timestamps = [3.0, 5.2, 6.0, 7.0];
  for (const t of timestamps) {
    await framePage.evaluate((targetT) => {
      window.__AANVI_INTRO_T = targetT;
    }, t);
    // Allow one render tick to apply the exact timestamp
    await framePage.waitForTimeout(150);

    const frameName = `part_f0_frame_${t.toFixed(1).replace('.', '_')}s.png`;
    const framePath = path.join(OUT_DIR, frameName);
    const brainPath = path.join(BRAIN_DIR, frameName);

    await framePage.screenshot({ path: framePath });
    fs.copyFileSync(framePath, brainPath);
    console.log(`Captured frame at ${t.toFixed(1)}s -> ${framePath}`);
  }

  await frameContext.close();
  await browser.close();

  fs.writeFileSync(path.join(OUT_DIR, 'render_cost_results.json'), JSON.stringify(results, null, 2));
  console.log('\nSaved render cost results to f0_measurements/render_cost_results.json');
}

run().catch((err) => {
  console.error('Error running measurement:', err);
  process.exit(1);
});
