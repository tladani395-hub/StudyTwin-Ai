const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('aanvi_intro_every_visit', 'true');
    localStorage.setItem('aanvi_sound', 'true');
  });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

  await page.goto('http://localhost:3000/?skip_audio_test=1');
  await page.waitForSelector('[data-testid="splash-skip-button"]', { timeout: 6000 });

  const s1 = await page.evaluate(() => ({
    isPlaying: window.__AANVI_AUDIO_SYNTH.isPlaying,
    isBlocked: window.__AANVI_AUDIO_SYNTH.isBlocked(),
    state: window.__AANVI_AUDIO_SYNTH.getContext().state
  }));
  console.log('Before skip:', s1);

  await page.click('[data-testid="splash-skip-button"]');
  console.log('Clicked skip button');
  
  for (let i = 0; i < 5; i++) {
    await page.waitForTimeout(100);
    const s2 = await page.evaluate(() => ({
      path: window.location.pathname,
      isPlaying: window.__AANVI_AUDIO_SYNTH ? window.__AANVI_AUDIO_SYNTH.isPlaying : 'no-synth',
    }));
    console.log(`After skip +${(i+1)*100}ms:`, s2);
  }

  await browser.close();
})();
