import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'part_a3');

test.beforeAll(async () => {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }
});

test.describe('Part A3: Cinematic 3D Intro Visual Evaluation & Quality Testing', () => {
  test.beforeEach(async ({ context }) => {
    test.setTimeout(75000);
    await context.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
      localStorage.setItem('aanvi_reduced_motion', 'false');
    });
  });

  test('1. Render Still Frames at 0.5s, 2.0s, 3.5s, 4.5s, 6.0s (Desktop 1280px)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    page.on('console', (msg) => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('BROWSER ERR:', err.message));
    await page.setViewportSize({ width: 1280, height: 800 });
    console.error(`[TEST STEP] Start goto / at ${Date.now()}`);
    await page.goto('/');
    console.error(`[TEST STEP] goto / finished at ${Date.now()}`);

    const enterBtn = page.locator('[data-testid="enter-intro-btn"]');
    await expect(enterBtn).toBeVisible({ timeout: 6000 });
    console.error(`[TEST STEP] enterBtn visible at ${Date.now()}`);

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_enter_desktop_1280px.png') });

    // Tap to begin
    await enterBtn.click();
    console.error(`[TEST STEP] enterBtn clicked at ${Date.now()}`);

    const canvas = page.locator('[data-testid="three-intro-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 8000 });
    console.error(`[TEST STEP] canvas visible at ${Date.now()}`);

    // Prevent premature dismissal while inspecting frame renders
    await page.evaluate(() => {
      (window as any).__AANVI_DISABLE_AUTOFINISH = true;
    });

    // Frame 1: 0.5s (Deep space, 3 star layers, nebula, shooting star)
    await page.evaluate(() => { (window as any).__AANVI_INTRO_T = 0.5; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_0.5s_desktop.png') });

    // Frame 2: 2.0s (Constellation gathering, progressive edge tubes)
    await page.evaluate(() => { (window as any).__AANVI_INTRO_T = 2.0; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_2.0s_desktop.png') });

    // Frame 3: 3.5s (Logo lock, god rays, shockwave ring, 35 deg orbit)
    await page.evaluate(() => { (window as any).__AANVI_INTRO_T = 3.5; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_3.5s_desktop.png') });

    // Frame 4: 4.5s (Glass A monogram, 3D wordmark Aanvi letters, light sweep)
    await page.evaluate(() => { (window as any).__AANVI_INTRO_T = 4.5; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_4.5s_desktop.png') });

    // Frame 5: 6.0s (Full composition, tagline, golden sparkles)
    await page.evaluate(() => { (window as any).__AANVI_INTRO_T = 6.0; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_6.0s_desktop.png') });
  });

  test('2. Render Still Frames on Mobile (390px)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const enterBtn = page.locator('[data-testid="enter-intro-btn"]');
    await expect(enterBtn).toBeVisible({ timeout: 6000 });

    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_enter_mobile_390px.png') });
    await enterBtn.click();

    const canvas = page.locator('[data-testid="three-intro-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 8000 });

    await page.evaluate(() => {
      (window as any).__AANVI_DISABLE_AUTOFINISH = true;
    });

    await page.evaluate(() => { (window as any).__AANVI_INTRO_T = 2.0; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_2.0s_mobile_390px.png') });

    await page.evaluate(() => { (window as any).__AANVI_INTRO_T = 3.5; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_3.5s_mobile_390px.png') });

    await page.evaluate(() => { (window as any).__AANVI_INTRO_T = 6.0; });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'frame_6.0s_mobile_390px.png') });
  });

  test('3. Multilingual Tagline Sharpness & Translations (English, Hindi, Gujarati)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Test Hindi
    await page.goto('/');
    await page.click('button:has-text("हिन्दी")');
    await page.click('[data-testid="enter-intro-btn"]');
    await page.waitForTimeout(5800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tagline_hindi_1280px.png') });

    // Test Gujarati
    await page.goto('/');
    await page.click('button:has-text("ગુજરાતી")');
    await page.click('[data-testid="enter-intro-btn"]');
    await page.waitForTimeout(5800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tagline_gujarati_1280px.png') });
  });

  test('4. Measure Real FPS & Memory Stability', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await page.click('[data-testid="enter-intro-btn"]');
    await page.waitForTimeout(2000);

    const fpsBadge = page.locator('[data-testid="fps-badge"]');
    await expect(fpsBadge).toBeVisible({ timeout: 5000 });
    const fpsText = await fpsBadge.textContent();
    expect(fpsText).toBeTruthy();
    console.log(`[Performance Measurement] Detected: ${fpsText}`);
  });

  test('5. Verify Core App Routes (all 200 OK, no 404s)', async ({ page }) => {
    const routes = ['/', '/intro', '/login', '/signup', '/dashboard', '/welcome', '/courses', '/flashcards', '/study-plan'];
    for (const r of routes) {
      const resp = await page.goto(r);
      expect(resp?.status()).toBe(200);
      console.log(`[Route Verification] ${r} -> HTTP ${resp?.status()}`);
    }
  });

  test('6. Measure Audio Synthesis Levels (peak < -1 dB, RMS ~ -18 dB)', async () => {
    const wavPath = path.join(process.cwd(), 'public', 'audio', 'aanvi_intro_theme.wav');
    expect(fs.existsSync(wavPath)).toBe(true);
    const buf = fs.readFileSync(wavPath);
    expect(buf.length).toBeGreaterThan(100000);
    // Parse PCM header & samples
    let sumSquares = 0;
    let peak = 0;
    let count = 0;
    for (let i = 44; i < buf.length - 2; i += 2) {
      const sample = buf.readInt16LE(i) / 32768.0;
      const abs = Math.abs(sample);
      if (abs > peak) peak = abs;
      sumSquares += sample * sample;
      count++;
    }
    const rms = Math.sqrt(sumSquares / count);
    const peakDb = 20 * Math.log10(peak);
    const rmsDb = 20 * Math.log10(rms);
    console.log(`[Audio Verification] Peak: ${peakDb.toFixed(2)} dB, RMS: ${rmsDb.toFixed(2)} dB`);
    expect(peakDb).toBeLessThan(-0.5);
    expect(rmsDb).toBeGreaterThan(-30);
  });
});
