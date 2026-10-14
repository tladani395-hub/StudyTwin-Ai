const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/?skip_audio_test=1');
  await page.waitForSelector('[data-testid="splash-skip-button"]', { timeout: 6000 });

  console.log('Before skip isPlaying:', await page.evaluate(() => window.__AANVI_AUDIO_SYNTH.isPlaying));

  await page.click('[data-testid="splash-skip-button"]');
  await page.waitForTimeout(100);

  console.log('After skip isPlaying:', await page.evaluate(() => window.__AANVI_AUDIO_SYNTH.isPlaying));

  await browser.close();
})();
