const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:3000/?test=1');
  await page.waitForSelector('[data-testid="splash-screen-container"]');
  // Wait 300ms for start(0) promise to settle
  await page.waitForTimeout(400);

  const state1 = await page.evaluate(() => ({
    state: window.__AANVI_AUDIO_SYNTH.getContext().state,
    blocked: window.__AANVI_AUDIO_SYNTH.isBlocked(),
    isPlaying: window.__AANVI_AUDIO_SYNTH.isPlaying
  }));
  console.log('State after settle:', state1);

  // Click on splash screen container
  console.log('Clicking splash screen container...');
  await page.click('[data-testid="splash-screen-container"]');
  await page.waitForTimeout(400);

  const state2 = await page.evaluate(() => ({
    state: window.__AANVI_AUDIO_SYNTH.getContext().state,
    blocked: window.__AANVI_AUDIO_SYNTH.isBlocked(),
    isPlaying: window.__AANVI_AUDIO_SYNTH.isPlaying
  }));
  console.log('State after splash click:', state2);

  await browser.close();
})();
