const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ARTIFACT_DIR = 'C:/Users/Tirth/.gemini/antigravity/brain/b57d341f-3178-41ff-865e-6f1f32d21ba5';
const FFMPEG_BIN = 'D:/StudyTwin-AI/backend/venv/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe';
const AUDIO_PATH = path.resolve('D:/StudyTwin-AI/frontend/public/brand/intro_sound.mp3');

async function main() {
  console.log('Launching browser for Native Video Recording (Desktop & Mobile)...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox'],
  });

  const videosDir = path.resolve('D:/StudyTwin-AI/scratch/recorded_videos');
  fs.mkdirSync(videosDir, { recursive: true });

  // =========================================================================
  // 1. DESKTOP RECORDING (1280x720)
  // =========================================================================
  console.log('Recording Desktop 1280x720 video with sound...');
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: videosDir,
      size: { width: 1280, height: 720 },
    },
  });

  await desktopContext.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
      localStorage.setItem('aanvi_sound', 'true');
    } catch (e) {}
  });

  const desktopPage = await desktopContext.newPage();
  await desktopPage.goto('http://localhost:3000/?rec_desktop=1', { waitUntil: 'domcontentloaded' });
  await desktopPage.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 15000 });

  // Record for 8.6 seconds so full timeline plays: 0s -> 7.3s doors open -> 8.2s -> welcome screen
  await desktopPage.waitForTimeout(8800);
  await desktopPage.close();
  const rawDesktopVideo = await desktopPage.video().path();
  await desktopContext.close();
  console.log(`Raw desktop video recorded: ${rawDesktopVideo}`);

  // Mux desktop audio with FFmpeg to produce MP4
  const desktopOutMp4 = path.resolve('D:/StudyTwin-AI/scratch/part_a6_intro_desktop_1280.mp4');
  const desktopArtMp4 = path.join(ARTIFACT_DIR, 'part_a6_intro_desktop_1280.mp4');
  const desktopCmd = `"${FFMPEG_BIN}" -y -i "${rawDesktopVideo}" -i "${AUDIO_PATH}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${desktopOutMp4}"`;
  execSync(desktopCmd, { stdio: 'inherit' });
  fs.copyFileSync(desktopOutMp4, desktopArtMp4);
  console.log(`Desktop MP4 saved to artifact: ${desktopArtMp4}`);

  // =========================================================================
  // 2. MOBILE RECORDING (390x844)
  // =========================================================================
  console.log('Recording Mobile 390x844 video with sound...');
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: {
      dir: videosDir,
      size: { width: 390, height: 844 },
    },
  });

  await mobileContext.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
      localStorage.setItem('aanvi_sound', 'true');
    } catch (e) {}
  });

  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/?rec_mobile=1', { waitUntil: 'domcontentloaded' });
  await mobilePage.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 15000 });

  await mobilePage.waitForTimeout(8800);
  await mobilePage.close();
  const rawMobileVideo = await mobilePage.video().path();
  await mobileContext.close();
  console.log(`Raw mobile video recorded: ${rawMobileVideo}`);

  // Mux mobile audio with FFmpeg to produce MP4
  const mobileOutMp4 = path.resolve('D:/StudyTwin-AI/scratch/part_a6_intro_mobile_390.mp4');
  const mobileArtMp4 = path.join(ARTIFACT_DIR, 'part_a6_intro_mobile_390.mp4');
  const mobileCmd = `"${FFMPEG_BIN}" -y -i "${rawMobileVideo}" -i "${AUDIO_PATH}" -c:v libx264 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "${mobileOutMp4}"`;
  execSync(mobileCmd, { stdio: 'inherit' });
  fs.copyFileSync(mobileOutMp4, mobileArtMp4);
  console.log(`Mobile MP4 saved to artifact: ${mobileArtMp4}`);

  await browser.close();
  console.log('Done! Both desktop and mobile video recordings completed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
