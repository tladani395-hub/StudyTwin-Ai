const { chromium } = require('d:/StudyTwin-AI/frontend/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/?strict_audio=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="three-intro-canvas"]');

  await page.evaluate(async () => {
    window.__AANVI_DISABLE_AUTOFINISH = true;
    if (window.__AANVI_RESET_TIMELINE) {
      window.__AANVI_RESET_TIMELINE();
    }
    const s = window.__AANVI_AUDIO_SYNTH;
    if (s) {
      s.stop();
      s.startRecording();
      await s.resume();
      s.setVolume(0.8);
      await s.start(0);
    }
  });

  await page.waitForTimeout(8500);

  const audioData = await page.evaluate(async () => {
    const s = window.__AANVI_AUDIO_SYNTH;
    return s ? await s.stopRecording() : { wav: '', sampleRate: 48000 };
  });

  const rawBuffer = Buffer.from(audioData.wav, 'base64');
  const sampleRate = rawBuffer.readUInt32LE(24);
  const numSamples = (rawBuffer.length - 44) / 2;
  const samples = new Float64Array(numSamples);
  for (let i = 0; i < numSamples; i++) {
    const val = rawBuffer.readInt16LE(44 + i * 2);
    samples[i] = val / 32768.0;
  }

  const cueWindows = [
    { name: '0.15–1.8s (star chimes)', start: 0.15, end: 1.8 },
    { name: '3.0–4.6s (fly-through whoosh)', start: 3.0, end: 4.6 },
    { name: '4.6–5.5s (orb chime)', start: 4.6, end: 5.5 },
    { name: '5.6–6.3s (smile chime)', start: 5.6, end: 6.3 },
    { name: '6.4–7.2s (letters & chord)', start: 6.4, end: 7.2 },
    { name: '7.3–8.2s (doors grand whoosh)', start: 7.3, end: 8.2 },
  ];

  for (const win of cueWindows) {
    const startIdx = Math.floor(win.start * sampleRate);
    const endIdx = Math.min(samples.length, Math.floor(win.end * sampleRate));
    let winSumSq = 0;
    let winPeak = 0;
    const count = endIdx - startIdx;
    for (let i = startIdx; i < endIdx; i++) {
      const a = Math.abs(samples[i]);
      if (a > winPeak) winPeak = a;
      winSumSq += samples[i] * samples[i];
    }
    const winRms = Math.sqrt(winSumSq / count);
    const winRmsDbfs = 20 * Math.log10(winRms);
    const winPeakDbfs = 20 * Math.log10(winPeak);
    console.log(`Cue [${win.name}]: Peak = ${winPeakDbfs.toFixed(2)} dBFS, RMS = ${winRmsDbfs.toFixed(2)} dBFS`);
  }

  await browser.close();
})();
