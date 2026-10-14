const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/Tirth/.gemini/antigravity/brain/b57d341f-3178-41ff-865e-6f1f32d21ba5';
const FFMPEG_BIN = 'D:/StudyTwin-AI/backend/venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
const AUDIO_PATH = path.resolve('D:/StudyTwin-AI/frontend/public/brand/intro_sound.mp3');

async function main() {
  console.log('Launching browser for Part A6 Deliverables Capture...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox'],
  });

  const context = await browser.newContext();
  await context.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
      localStorage.setItem('aanvi_sound', 'true');
    } catch (e) {}
  });

  // =========================================================================
  // 1. CAPTURE EXACT TIMESTAMPS FOR DESKTOP (1280x720)
  // =========================================================================
  const timestamps = [
    { t: 0.5, name: 'frame_0_5s', desc: '0.5s (deep space, first stars)' },
    { t: 1.5, name: 'frame_1_5s', desc: '1.5s (universe filled)' },
    { t: 3.0, name: 'frame_3_0s', desc: '3.0s (particles gathering)' },
    { t: 4.5, name: 'frame_4_5s', desc: '4.5s (logo drawn)' },
    { t: 5.2, name: 'frame_5_2s', desc: '5.2s (Picture 1 glowing orb)' },
    { t: 6.0, name: 'frame_6_0s', desc: '6.0s (Picture 2 happy face)' },
    { t: 7.0, name: 'frame_7_0s', desc: '7.0s (Aanvi text revealed)' },
    { t: 7.8, name: 'frame_8_0s', desc: '8.0s (doors opening, seam flare)' },
  ];

  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  await page.goto('http://localhost:3000/?capture=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 15000 });

  // Disable auto-finish for controlled stepped capture
  await page.evaluate(() => {
    window.__AANVI_DISABLE_AUTOFINISH = true;
  });

  fs.mkdirSync('D:/StudyTwin-AI/scratch/frames_exact', { recursive: true });

  for (const item of timestamps) {
    await page.evaluate((val) => {
      window.__AANVI_INTRO_T = val;
    }, item.t);

    await page.waitForTimeout(150); // Let WebGL render frame

    const outPath = path.resolve(`D:/StudyTwin-AI/scratch/frames_exact/${item.name}.png`);
    const artPath = path.join(ARTIFACT_DIR, `part_a6_${item.name}.png`);

    await page.screenshot({ path: outPath });
    fs.copyFileSync(outPath, artPath);
    console.log(`[Captured] ${item.desc} -> ${artPath}`);
  }

  // Also capture the doors opening state with the Welcome screen revealed behind them (t = 8.0s)
  await page.evaluate(() => {
    window.__AANVI_INTRO_T = 8.0;
  });
  await page.waitForTimeout(200);
  const doorsRevealedArt = path.join(ARTIFACT_DIR, 'part_a6_doors_opened_welcome.png');
  await page.screenshot({ path: doorsRevealedArt });
  console.log(`[Captured] Doors opened with Welcome screen -> ${doorsRevealedArt}`);

  // =========================================================================
  // 2. RECORD FULL 8.3-SECOND VIDEO SEQUENCE AT 30 FPS (DESKTOP 1280x720)
  // =========================================================================
  console.log('Rendering frames for Desktop 1280x720 video...');
  const desktopFramesDir = path.resolve('D:/StudyTwin-AI/scratch/frames_desktop');
  fs.mkdirSync(desktopFramesDir, { recursive: true });

  const fps = 30;
  const totalDuration = 8.3; // seconds
  const totalFrames = Math.floor(totalDuration * fps);

  for (let f = 0; f < totalFrames; f++) {
    const simT = f / fps;
    await page.evaluate((val) => {
      window.__AANVI_INTRO_T = val;
    }, simT);
    await page.waitForTimeout(25);

    const frameFile = path.join(desktopFramesDir, `frame_${String(f).padStart(4, '0')}.png`);
    await page.screenshot({ path: frameFile });
    if (f % 50 === 0 || f === totalFrames - 1) {
      console.log(`Desktop progress: Frame ${f}/${totalFrames} (${simT.toFixed(2)}s)`);
    }
  }

  await page.close();

  // Encode desktop video with audio using FFmpeg
  console.log('Encoding desktop video with ffmpeg...');
  const desktopOutMp4 = path.resolve('D:/StudyTwin-AI/scratch/part_a6_intro_desktop_1280.mp4');
  const desktopArtMp4 = path.join(ARTIFACT_DIR, 'part_a6_intro_desktop_1280.mp4');

  const ffmpegCmdDesktop = `"${FFMPEG_BIN}" -y -framerate ${fps} -i "${path.join(desktopFramesDir, 'frame_%04d.png')}" -i "${AUDIO_PATH}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${desktopOutMp4}"`;
  execSync(ffmpegCmdDesktop, { stdio: 'inherit' });
  fs.copyFileSync(desktopOutMp4, desktopArtMp4);
  console.log(`Desktop MP4 saved to ${desktopArtMp4}`);

  // =========================================================================
  // 3. RECORD FULL 8.3-SECOND VIDEO SEQUENCE AT 30 FPS (MOBILE 390x844)
  // =========================================================================
  console.log('Rendering frames for Mobile 390x844 video...');
  const mobilePage = await context.newPage();
  await mobilePage.setViewportSize({ width: 390, height: 844 });

  await mobilePage.goto('http://localhost:3000/?capture_mobile=1', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 15000 });
  await mobilePage.evaluate(() => {
    window.__AANVI_DISABLE_AUTOFINISH = true;
  });

  const mobileFramesDir = path.resolve('D:/StudyTwin-AI/scratch/frames_mobile');
  fs.mkdirSync(mobileFramesDir, { recursive: true });

  for (let f = 0; f < totalFrames; f++) {
    const simT = f / fps;
    await mobilePage.evaluate((val) => {
      window.__AANVI_INTRO_T = val;
    }, simT);
    await mobilePage.waitForTimeout(25);

    const frameFile = path.join(mobileFramesDir, `frame_${String(f).padStart(4, '0')}.png`);
    await mobilePage.screenshot({ path: frameFile });
    if (f % 50 === 0 || f === totalFrames - 1) {
      console.log(`Mobile progress: Frame ${f}/${totalFrames} (${simT.toFixed(2)}s)`);
    }
  }

  await mobilePage.close();

  // Encode mobile video with audio using FFmpeg
  console.log('Encoding mobile video with ffmpeg...');
  const mobileOutMp4 = path.resolve('D:/StudyTwin-AI/scratch/part_a6_intro_mobile_390.mp4');
  const mobileArtMp4 = path.join(ARTIFACT_DIR, 'part_a6_intro_mobile_390.mp4');

  const ffmpegCmdMobile = `"${FFMPEG_BIN}" -y -framerate ${fps} -i "${path.join(mobileFramesDir, 'frame_%04d.png')}" -i "${AUDIO_PATH}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${mobileOutMp4}"`;
  execSync(ffmpegCmdMobile, { stdio: 'inherit' });
  fs.copyFileSync(mobileOutMp4, mobileArtMp4);
  console.log(`Mobile MP4 saved to ${mobileArtMp4}`);

  await browser.close();
  console.log('All Part A6 Video captures completed successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
