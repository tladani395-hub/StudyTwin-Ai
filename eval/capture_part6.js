const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = "C:\\Users\\Tirth\\.gemini\\antigravity\\brain\\b57d341f-3178-41ff-865e-6f1f32d21ba5";

async function captureAll() {
  console.log("Launching Chromium for Part 6 visual proofs...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // 1. Intro Animation
    console.log("1. Capturing Intro Animation (/animation-demo)...");
    await page.goto("http://localhost:3000/animation-demo", { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const introPath = path.join(ARTIFACT_DIR, "part6_intro_animation.png");
    await page.screenshot({ path: introPath });
    console.log("   Saved:", introPath);
  } catch (e) {
    console.error("   Error 1:", e.message);
  }

  try {
    // 2. Voice Studio
    console.log("2. Capturing Voice Studio (/voice-studio)...");
    await page.goto("http://localhost:3000/voice-studio", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const voicePath = path.join(ARTIFACT_DIR, "part6_voice_tutor.png");
    await page.screenshot({ path: voicePath });
    console.log("   Saved:", voicePath);
  } catch (e) {
    console.error("   Error 2:", e.message);
  }

  try {
    // 3. Camera Doubt
    console.log("3. Capturing Camera Doubt & SymPy Step Checker (/camera)...");
    await page.goto("http://localhost:3000/camera", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const cameraPath = path.join(ARTIFACT_DIR, "part6_camera_sympy.png");
    await page.screenshot({ path: cameraPath });
    console.log("   Saved:", cameraPath);
  } catch (e) {
    console.error("   Error 3:", e.message);
  }

  try {
    // 4. 3D Concept Galaxy (Scholar Dark)
    console.log("4. Capturing 3D Concept Galaxy (Scholar Dark)...");
    await page.goto("http://localhost:3000/knowledge-graph", { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-mode', 'scholar');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
    });
    await page.waitForTimeout(2000);
    const galaxyScholarPath = path.join(ARTIFACT_DIR, "part6_galaxy_scholar.png");
    await page.screenshot({ path: galaxyScholarPath });
    console.log("   Saved:", galaxyScholarPath);
  } catch (e) {
    console.error("   Error 4:", e.message);
  }

  try {
    // 5. 3D Concept Galaxy (Explorer Light)
    console.log("5. Capturing 3D Concept Galaxy (Explorer Light)...");
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-mode', 'explorer');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.waitForTimeout(2000);
    const galaxyExplorerPath = path.join(ARTIFACT_DIR, "part6_galaxy_explorer.png");
    await page.screenshot({ path: galaxyExplorerPath });
    console.log("   Saved:", galaxyExplorerPath);
  } catch (e) {
    console.error("   Error 5:", e.message);
  }

  try {
    // 6. Demo Script Overlay on Dashboard
    console.log("6. Capturing Demo Script Overlay on Dashboard...");
    await page.goto("http://localhost:3000/dashboard", { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.keyboard.press("Control+d");
    await page.waitForTimeout(1000);
    const demoPath = path.join(ARTIFACT_DIR, "part6_demo_overlay.png");
    await page.screenshot({ path: demoPath });
    console.log("   Saved:", demoPath);
  } catch (e) {
    console.error("   Error 6:", e.message);
  }

  await browser.close();
  console.log("All Part 6 screenshots captured successfully!");
}

captureAll().catch(err => console.error(err));
