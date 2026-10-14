const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3000/?record=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 6000 });

  const stateBefore = await page.evaluate(() => {
    const s = window.__AANVI_AUDIO_SYNTH;
    return {
      hasSynth: !!s,
      ctxState: s && s.getContext() ? s.getContext().state : 'no-ctx',
      isBlocked: s ? s.isBlocked() : null,
      isPlaying: s ? s.isPlaying : null
    };
  });
  console.log('State before gesture:', stateBefore);

  await page.evaluate(async () => {
    window.__AANVI_AUDIO_SYNTH.startRecording();
    await window.__AANVI_AUDIO_SYNTH.resume();
    await window.__AANVI_AUDIO_SYNTH.start(0);
  });

  const stateAfter = await page.evaluate(() => {
    const s = window.__AANVI_AUDIO_SYNTH;
    return {
      ctxState: s.getContext().state,
      isPlaying: s.isPlaying
    };
  });
  console.log('State after resume & start:', stateAfter);

  console.log('Recording 3 seconds of live audio...');
  await page.waitForTimeout(3000);

  const res = await page.evaluate(async () => {
    return await window.__AANVI_AUDIO_SYNTH.stopRecording();
  });

  console.log('Audio capture result:', {
    wavLength: res.wav ? res.wav.length : 0,
    webmLength: res.webm ? res.webm.length : 0,
    sampleRate: res.sampleRate
  });

  await browser.close();
})();
