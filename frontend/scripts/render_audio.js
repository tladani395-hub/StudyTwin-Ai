/**
 * Offline Audio Synthesizer & Waveform Exporter for Aanvi Intro (7.0s Cinematic Timeline)
 * Generates frontend/public/audio/aanvi_intro_theme.wav (44.1kHz, 16-bit Stereo PCM)
 * and frontend/public/audio/aanvi_intro_waveform.svg.
 */

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION_SEC = 7.0;
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION_SEC);

const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

// 1. 0.0s – 3.2s: Deep Ambient Sub-Hum (55Hz -> 73.4Hz)
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  if (t <= 3.4) {
    const f = 55 + (73.4 - 55) * (t / 3.2);
    const env = t < 1.5 ? t / 1.5 : Math.exp(-(t - 1.5) * 1.2);
    const hum = Math.sin(2 * Math.PI * f * t) * 0.3 * env;
    left[i] += hum;
    right[i] += hum;
  }
}

// 2. 1.5s – 3.2s: Rising Swirl & Whoosh
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  if (t >= 1.5 && t <= 3.2) {
    const relT = (t - 1.5) / 1.7;
    const centerFreq = 180 * Math.pow(1600 / 180, relT);
    const env = Math.sin(relT * Math.PI) * 0.22;
    const noise = (Math.random() * 2 - 1) * Math.sin(2 * Math.PI * centerFreq * t);
    left[i] += noise * env * (1 - relT * 0.3);
    right[i] += noise * env * (0.7 + relT * 0.3);
  }
}

// 3. 3.2s – 4.2s: Logo Lock In Chime & Sub Impact
const chimeStart = 3.2;
const chimeFreqs = [880, 1318.51, 2093.0];
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  if (t >= chimeStart && t < chimeStart + 1.6) {
    const dt = t - chimeStart;
    const env = Math.exp(-dt * 3.2) * 0.26;
    let chimeSample = 0;
    chimeFreqs.forEach((freq, idx) => {
      chimeSample += Math.sin(2 * Math.PI * freq * dt) * (1 / (idx + 1));
    });
    // Add sub impact
    const subImpact = Math.sin(2 * Math.PI * (65 - dt * 30) * dt) * Math.exp(-dt * 5.0) * 0.28;
    left[i] += (chimeSample * 0.9 + subImpact) * env;
    right[i] += (chimeSample * 1.1 + subImpact) * env;
  }
}

// 4. 4.2s – 5.5s: 5 Letter Ticks (Aanvi)
const letterPitches = [523.25, 659.25, 783.99, 1046.5, 1318.51];
letterPitches.forEach((pitch, idx) => {
  const startT = 4.2 + idx * 0.24;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    if (t >= startT && t < startT + 0.38) {
      const dt = t - startT;
      const env = Math.exp(-dt * 11.0) * 0.18;
      const pan = idx / 4;
      const sample = Math.sin(2 * Math.PI * pitch * dt) + 0.38 * Math.sin(2 * Math.PI * pitch * 2.76 * dt);
      left[i] += sample * env * (1 - pan * 0.4);
      right[i] += sample * env * (0.6 + pan * 0.4);
    }
  }
});

// 5. 5.5s – 6.3s: Shimmer / Sparkle Burst
const sparkleStart = 5.5;
const sparkleNotes = [1567.98, 1760.0, 2093.0, 2637.02, 3135.96];
sparkleNotes.forEach((note, idx) => {
  const startT = sparkleStart + idx * 0.045;
  for (let i = 0; i < TOTAL_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    if (t >= startT && t < startT + 0.45) {
      const dt = t - startT;
      const env = Math.exp(-dt * 8.5) * 0.12;
      const sample = Math.sin(2 * Math.PI * note * dt);
      left[i] += sample * env;
      right[i] += sample * env;
    }
  }
});

// 6. 6.3s – 7.0s: Warm Resolving Chord (Fmaj9: F3, C4, E4, G4, A4)
const chordStart = 6.3;
const chordFreqs = [174.61, 261.63, 329.63, 392.0, 440.0];
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  const t = i / SAMPLE_RATE;
  if (t >= chordStart && t < 7.0) {
    const dt = t - chordStart;
    const attack = Math.min(1.0, dt / 0.18);
    const decay = Math.exp(-dt * 1.8);
    const env = attack * decay * 0.28;
    let chordSample = 0;
    chordFreqs.forEach((f) => {
      chordSample += Math.sin(2 * Math.PI * f * dt);
    });
    left[i] += chordSample * env;
    right[i] += chordSample * env;
  }
}

// Normalize
let maxAmp = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  maxAmp = Math.max(maxAmp, Math.abs(left[i]), Math.abs(right[i]));
}
const normFactor = maxAmp > 0.95 ? 0.95 / maxAmp : 0.9;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  left[i] *= normFactor;
  right[i] *= normFactor;
}

// Convert to 16-bit PCM WAV buffer
function createWavBuffer(leftChannel, rightChannel, sampleRate) {
  const numSamples = leftChannel.length;
  const byteRate = sampleRate * 2 * 2;
  const blockAlign = 4;
  const dataSize = numSamples * 4;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(2, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);

  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sL = Math.max(-1, Math.min(1, leftChannel[i]));
    const sR = Math.max(-1, Math.min(1, rightChannel[i]));
    const intL = sL < 0 ? sL * 0x8000 : sL * 0x7fff;
    const intR = sR < 0 ? sR * 0x8000 : sR * 0x7fff;
    buffer.writeInt16LE(Math.floor(intL), offset);
    buffer.writeInt16LE(Math.floor(intR), offset + 2);
    offset += 4;
  }

  return buffer;
}

const wavBuffer = createWavBuffer(left, right, SAMPLE_RATE);
const outputAudioDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(outputAudioDir)) {
  fs.mkdirSync(outputAudioDir, { recursive: true });
}

const wavPath = path.join(outputAudioDir, 'aanvi_intro_theme.wav');
fs.writeFileSync(wavPath, wavBuffer);
console.log(`[Audio Render] Wrote 7.0s 44.1kHz Stereo WAV to: ${wavPath} (${(wavBuffer.length / 1024).toFixed(1)} KB)`);

// Waveform SVG
const waveformSteps = 350;
const stepSamples = Math.floor(TOTAL_SAMPLES / waveformSteps);
const peaks = [];
for (let step = 0; step < waveformSteps; step++) {
  let peak = 0;
  for (let s = 0; s < stepSamples; s++) {
    const idx = step * stepSamples + s;
    if (idx < TOTAL_SAMPLES) {
      const amp = (Math.abs(left[idx]) + Math.abs(right[idx])) / 2;
      if (amp > peak) peak = amp;
    }
  }
  peaks.push(peak);
}

const svgWidth = 1000;
const svgHeight = 220;
const barWidth = svgWidth / waveformSteps;
const bars = peaks.map((p, idx) => {
  const x = idx * barWidth;
  const h = Math.max(2, p * (svgHeight - 40));
  const y = (svgHeight - h) / 2;
  const color = idx < waveformSteps * 0.46 ? '#FF6B57' : idx < waveformSteps * 0.8 ? '#7B4BFF' : '#FFB800';
  return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(barWidth * 0.8).toFixed(1)}" height="${h.toFixed(1)}" rx="1.5" fill="${color}" fill-opacity="0.85"/>`;
}).join('\n    ');

const waveformSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <rect width="${svgWidth}" height="${svgHeight}" rx="12" fill="#0B0A12"/>
  <g>
    ${bars}
  </g>
  <text x="15" y="200" font-family="JetBrains Mono, monospace" font-size="11" fill="#888">0.0s Space Hum</text>
  <text x="215" y="200" font-family="JetBrains Mono, monospace" font-size="11" fill="#FF6B57">1.5s Swirl Whoosh</text>
  <text x="450" y="200" font-family="JetBrains Mono, monospace" font-size="11" fill="#7B4BFF">3.2s Flash & Chime</text>
  <text x="610" y="200" font-family="JetBrains Mono, monospace" font-size="11" fill="#BA7FFF">4.2s Letter Ticks</text>
  <text x="785" y="200" font-family="JetBrains Mono, monospace" font-size="11" fill="#FFB800">5.5s Shimmer</text>
  <text x="900" y="200" font-family="JetBrains Mono, monospace" font-size="11" fill="#E0B0FF">6.3s Chord</text>
</svg>`;

const waveformSvgPath = path.join(outputAudioDir, 'aanvi_intro_waveform.svg');
fs.writeFileSync(waveformSvgPath, waveformSvg);
console.log(`[Waveform Export] Wrote waveform visualization to: ${waveformSvgPath}`);
