const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Test the audio synthesis inside Chromium context
  const audioData = await page.evaluate(async () => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    await ctx.resume();

    const sampleRate = ctx.sampleRate;
    const duration = 8.5; // seconds
    const totalSamples = Math.floor(sampleRate * duration);

    // Build the exact audio graph requested in Part A6.2
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.80, ctx.currentTime); // 80% volume default

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-16, ctx.currentTime);
    compressor.knee.setValueAtTime(10, ctx.currentTime);
    compressor.ratio.setValueAtTime(4.0, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.18, ctx.currentTime);

    const makeupGain = ctx.createGain();
    makeupGain.gain.setValueAtTime(0.95, ctx.currentTime);

    // Limiter curve: ceiling at 0.86 (-1.31 dBFS)
    const limiter = ctx.createWaveShaper();
    const n = 4096;
    const curve = new Float32Array(n);
    const ceiling = 0.86;
    for (let i = 0; i < n; i++) {
      const x = (i * 2) / n - 1;
      const av = Math.abs(x);
      const sign = Math.sign(x);
      if (av <= 0.65) {
        curve[i] = x;
      } else {
        const excess = av - 0.65;
        const compressed = 0.65 + (ceiling - 0.65) * Math.tanh(excess / (ceiling - 0.65));
        curve[i] = sign * Math.min(compressed, ceiling);
      }
    }
    limiter.curve = curve;
    limiter.oversample = '2x';

    masterGain.connect(compressor);
    compressor.connect(makeupGain);
    makeupGain.connect(limiter);

    // PCM Recording script processor
    const pcmCapture = ctx.createScriptProcessor(4096, 1, 1);
    const recordedFloat32 = [];
    pcmCapture.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      recordedFloat32.push(new Float32Array(input));
    };
    limiter.connect(pcmCapture);
    pcmCapture.connect(ctx.destination);

    // Helpers
    const playChime = (freqs, dur, vol, startT) => {
      freqs.forEach(f => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, startT);
        const perVoice = freqs.length > 1 ? vol / Math.sqrt(freqs.length) : vol;
        g.gain.setValueAtTime(perVoice, startT);
        g.gain.exponentialRampToValueAtTime(0.0001, startT + dur);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(startT);
        osc.stop(startT + dur);
      });
    };

    const playKalimba = (freq, dur, vol, startT) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2.76, startT);
      g.gain.setValueAtTime(vol, startT);
      g.gain.exponentialRampToValueAtTime(0.001, startT + dur);
      osc.connect(g);
      osc2.connect(g);
      g.connect(masterGain);
      osc.start(startT);
      osc2.start(startT);
      osc.stop(startT + dur);
      osc2.stop(startT + dur);
    };

    const startT = ctx.currentTime;

    // 0.0s - 1.8s: Deep space hum + star twinkles
    const humOsc = ctx.createOscillator();
    const humGain = ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(55, startT);
    humOsc.frequency.exponentialRampToValueAtTime(73.4, startT + 3.2);
    humGain.gain.setValueAtTime(0.35, startT);
    humGain.gain.exponentialRampToValueAtTime(0.001, startT + 3.2);
    humOsc.connect(humGain);
    humGain.connect(masterGain);
    humOsc.start(startT);
    humOsc.stop(startT + 3.2);

    const twinkles = [
      { t: 0.15, f: 1760.0 },
      { t: 0.45, f: 2093.0 },
      { t: 0.75, f: 2349.3 },
      { t: 1.05, f: 2637.0 },
      { t: 1.30, f: 3135.9 },
    ];
    twinkles.forEach(tw => playChime([tw.f], 0.45, 0.48, startT + tw.t));

    // 3.0s - 4.6s: Deep space fly-through whoosh
    const wOsc = ctx.createOscillator();
    const wOsc2 = ctx.createOscillator();
    const wFilter = ctx.createBiquadFilter();
    const wGain = ctx.createGain();
    wOsc.type = 'sawtooth';
    wOsc.frequency.setValueAtTime(65, startT + 3.0);
    wOsc.frequency.exponentialRampToValueAtTime(280, startT + 4.4);
    wOsc2.type = 'sine';
    wOsc2.frequency.setValueAtTime(80, startT + 3.0);
    wOsc2.frequency.exponentialRampToValueAtTime(360, startT + 4.4);
    wFilter.type = 'lowpass';
    wFilter.frequency.setValueAtTime(180, startT + 3.0);
    wFilter.frequency.exponentialRampToValueAtTime(1400, startT + 3.8);
    wFilter.frequency.exponentialRampToValueAtTime(220, startT + 4.5);
    wGain.gain.setValueAtTime(0.001, startT + 3.0);
    wGain.gain.linearRampToValueAtTime(0.45, startT + 3.8);
    wGain.gain.exponentialRampToValueAtTime(0.001, startT + 4.5);
    wOsc.connect(wFilter);
    wOsc2.connect(wFilter);
    wFilter.connect(wGain);
    wGain.connect(masterGain);
    wOsc.start(startT + 3.0);
    wOsc2.start(startT + 3.0);
    wOsc.stop(startT + 4.6);
    wOsc2.stop(startT + 4.6);

    // 4.6s: Picture 1 Orb Chime (Harmonic 4-voice chord)
    playChime([659.25, 987.77, 1318.51, 1975.53], 1.8, 0.65, startT + 4.6);

    // 5.7s: Picture 2 Happy Smile (Joyful Apple / Duolingo chime)
    playChime([1046.50, 1318.51, 1567.98, 2093.00], 1.4, 0.70, startT + 5.65);

    // 6.4s - 7.0s: 5 Letter Kalimba Ticks + Warm Chord
    const letterFreqs = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    letterFreqs.forEach((freq, idx) => {
      playKalimba(freq, 0.35, 0.42, startT + 6.4 + idx * 0.16);
    });
    // 7.0s Chord
    playChime([349.23, 440.0, 523.25, 659.25], 1.6, 0.55, startT + 7.0);

    // 7.3s - 8.2s: Two Doors Opening Grand Whoosh
    const dOsc = ctx.createOscillator();
    const dGain = ctx.createGain();
    dOsc.type = 'sine';
    dOsc.frequency.setValueAtTime(140, startT + 7.3);
    dOsc.frequency.exponentialRampToValueAtTime(1100, startT + 8.1);
    dGain.gain.setValueAtTime(0.001, startT + 7.3);
    dGain.gain.linearRampToValueAtTime(0.55, startT + 7.75);
    dGain.gain.exponentialRampToValueAtTime(0.001, startT + 8.2);
    dOsc.connect(dGain);
    dGain.connect(masterGain);
    dOsc.start(startT + 7.3);
    dOsc.stop(startT + 8.2);

    // Wait 8.5 seconds to capture all audio
    await new Promise(resolve => setTimeout(resolve, 8500));

    // Merge Float32 samples
    let totalLen = 0;
    for (const arr of recordedFloat32) totalLen += arr.length;
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const arr of recordedFloat32) {
      merged.set(arr, offset);
      offset += arr.length;
    }

    // Convert to 16-bit PCM WAV base64
    const buffer = new ArrayBuffer(44 + merged.length * 2);
    const view = new DataView(buffer);
    const writeString = (v, off, str) => {
      for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i));
    };
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + merged.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, merged.length * 2, true);

    let pcmOff = 44;
    for (let i = 0; i < merged.length; i++) {
      const s = Math.max(-1, Math.min(1, merged[i]));
      view.setInt16(pcmOff, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      pcmOff += 2;
    }

    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return { wavBase64: btoa(binary), sampleRate, samplesCount: merged.length };
  });

  await browser.close();

  const wavBuffer = Buffer.from(audioData.wavBase64, 'base64');
  const outPath = path.join(__dirname, 'tuned_intro_sim.wav');
  fs.writeFileSync(outPath, wavBuffer);
  console.log(`Saved tuned WAV to ${outPath} (${audioData.samplesCount} samples, ${audioData.sampleRate} Hz)`);
})();
