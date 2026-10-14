const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/?test=1');
  await page.waitForSelector('[data-testid="splash-screen-container"]');

  const initState = await page.evaluate(() => {
    const s = window.__AANVI_AUDIO_SYNTH;
    return {
      state: s ? s.getContext().state : 'no-synth',
      blocked: s ? s.isBlocked() : 'no-synth',
      isPlaying: s ? s.isPlaying : false
    };
  });
  console.log('Init state:', initState);

  // Click body
  await page.click('body');
  await new Promise(r => setTimeout(r, 400));

  const afterClick = await page.evaluate(() => {
    const s = window.__AANVI_AUDIO_SYNTH;
    return {
      state: s ? s.getContext().state : 'no-synth',
      blocked: s ? s.isBlocked() : 'no-synth',
      isPlaying: s ? s.isPlaying : false
    };
  });
  console.log('After body click:', afterClick);

  // Directly call resume in user context
  await page.evaluate(async () => {
    const s = window.__AANVI_AUDIO_SYNTH;
    await s.resume();
    await s.start(0);
  });
  const afterDirect = await page.evaluate(() => window.__AANVI_AUDIO_SYNTH.getContext().state);
  console.log('After direct resume:', afterDirect);

  await browser.close();
})();
