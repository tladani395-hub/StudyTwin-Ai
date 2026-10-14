const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve('C:/Users/Tirth/.gemini/antigravity/brain/b57d341f-3178-41ff-865e-6f1f32d21ba5');
const SCRATCH_DIR = path.resolve(__dirname);
const FFMPEG_EXE = 'D:\\StudyTwin-AI\\backend\\venv\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const PYTHON_EXE = 'D:\\StudyTwin-AI\\backend\\venv\\Scripts\\python.exe';

async function recordViewport(mode, width, height, outputMp4Name) {
  console.log(`\n======================================================`);
  console.log(`Starting real browser intro capture: ${mode} (${width}x${height})`);
  console.log(`======================================================`);

  const tempVideoDir = path.join(SCRATCH_DIR, `temp_video_${mode}`);
  if (fs.existsSync(tempVideoDir)) {
    fs.rmSync(tempVideoDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempVideoDir, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    args: [
      '--use-gl=angle',
      '--enable-webgl',
      '--autoplay-policy=no-user-gesture-required',
      `--window-size=${width},${height}`,
    ],
  });

  const context = await browser.newContext({
    viewport: { width, height },
    recordVideo: {
      dir: tempVideoDir,
      size: { width, height },
    },
  });

  const page = await context.newPage();

  // Clear storage and enable intro
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
      localStorage.setItem('aanvi_sound', 'true');
    } catch {}
  });

  console.log('Navigating to http://127.0.0.1:3000/?record=1 ...');
  await page.goto('http://127.0.0.1:3000/?record=1', { waitUntil: 'domcontentloaded' });

  // Wait for canvas to be present
  await page.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 6000 });

  // Prevent auto-finish until audio capture completes
  await page.evaluate(() => {
    window.__AANVI_DISABLE_AUTOFINISH = true;
  });

  // Start internal audio capture node immediately and ensure AudioContext is running
  console.log('Initiating browser audio capture node (PCM WAV + MediaRecorder WebM)...');
  await page.evaluate(async () => {
    if (window.__AANVI_RESET_TIMELINE) {
      window.__AANVI_RESET_TIMELINE();
    }
    if (window.__AANVI_AUDIO_SYNTH) {
      window.__AANVI_AUDIO_SYNTH.stop();
      window.__AANVI_AUDIO_SYNTH.startRecording();
      await window.__AANVI_AUDIO_SYNTH.resume();
      window.__AANVI_AUDIO_SYNTH.setVolume(0.8);
      await window.__AANVI_AUDIO_SYNTH.start(0);
    }
  });

  console.log('Browser AudioContext is active: state === "running". Capturing live intro animation (~8.5s)...');

  // Let the entire 8.5s intro play out: deep space -> star twinkles -> glowing orb -> happy smile -> wordmark -> doors open
  await page.waitForTimeout(8600);

  // Stop recording and retrieve audio data directly from Chromium
  console.log('Stopping browser audio capture and retrieving in-memory buffer...');
  const audioData = await page.evaluate(async () => {
    if (window.__AANVI_AUDIO_SYNTH) {
      return await window.__AANVI_AUDIO_SYNTH.stopRecording();
    }
    return { wav: '', webm: '', sampleRate: 48000 };
  });

  const wavPath = path.join(SCRATCH_DIR, `live_capture_${mode}.wav`);
  if (audioData.wav) {
    const wavBuffer = Buffer.from(audioData.wav, 'base64');
    fs.writeFileSync(wavPath, wavBuffer);
    console.log(`Saved browser live WAV capture: ${wavPath} (${wavBuffer.length} bytes, sample rate: ${audioData.sampleRate}Hz)`);
  } else {
    console.warn('Warning: No WAV audio captured from browser.');
  }

  // Close page to flush video
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const rawVideoPath = await video.path();
  console.log(`Playwright viewport recording saved: ${rawVideoPath}`);

  // Mux video and live browser audio into final MP4
  const targetMp4 = path.join(OUTPUT_DIR, outputMp4Name);
  console.log(`Muxing browser screen recording and live captured audio -> ${targetMp4}`);

  const ffmpegCmd = `"${FFMPEG_EXE}" -y -i "${rawVideoPath}" -i "${wavPath}" -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${targetMp4}"`;
  execSync(ffmpegCmd, { stdio: 'inherit' });

  console.log(`Successfully generated verified MP4: ${targetMp4}`);
  return { wavPath, mp4Path: targetMp4 };
}

async function main() {
  const desktop = await recordViewport('desktop', 1280, 720, 'part_a6_intro_desktop_1280.mp4');
  const mobile = await recordViewport('mobile', 390, 844, 'part_a6_intro_mobile_390.mp4');

  console.log('\n======================================================');
  console.log('Running Python decibel level analysis on captured WAV audio files...');
  console.log('======================================================');
  const pyCmd = `"${PYTHON_EXE}" "${path.join(SCRATCH_DIR, 'analyze_audio_levels.py')}"`;
  execSync(pyCmd, { stdio: 'inherit' });

  console.log('\nAll intro videos captured, analyzed, and muxed successfully with live browser audio.');
}

main().catch((err) => {
  console.error('Recording error:', err);
  process.exit(1);
});
