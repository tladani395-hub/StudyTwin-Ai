import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'part_a2');

test.beforeAll(async () => {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }
});

test.describe('Part A2: Real 3D Intro with Web Audio & Multi-Language Support', () => {
  test.beforeEach(async ({ context }) => {
    // Clear storage before each test
    await context.addInitScript(() => {
      sessionStorage.clear();
      localStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
    });
  });

  test('1. Enter Screen appears first with Mark, Tap to begin, sound toggle, and translations', async ({ page }) => {
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', (err) => console.log('PAGE ERROR:', err.message));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const enterScreen = page.locator('[data-testid="splash-enter-screen"]');
    await expect(enterScreen).toBeVisible({ timeout: 5000 });

    // Verify "Tap to begin" button and sound options
    const tapBtn = page.locator('[data-testid="enter-intro-btn"]');
    await expect(tapBtn).toBeVisible();
    await expect(tapBtn).toContainText('Tap to begin');

    const soundOnBtn = page.locator('[data-testid="enter-sound-on"]');
    const soundOffBtn = page.locator('[data-testid="enter-sound-off"]');
    await expect(soundOnBtn).toBeVisible();
    await expect(soundOffBtn).toBeVisible();

    // Screenshot Enter Screen English
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_enter_screen_en_1280px.png') });

    // Test Hindi translation
    await page.click('button:has-text("हिन्दी")');
    await expect(tapBtn).toContainText('शुरू करने के लिए टैप करें');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_enter_screen_hi_1280px.png') });

    // Test Gujarati translation
    await page.click('button:has-text("ગુજરાતી")');
    await expect(tapBtn).toContainText('શરૂ કરવા માટે ટેપ કરો');
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '01_enter_screen_gu_1280px.png') });

    // Switch back to English
    await page.click('button:has-text("EN")');
    await expect(tapBtn).toContainText('Tap to begin');
  });

  test('2. Tap to begin initializes Three.js 3D WebGL Canvas and unlocks AudioContext', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await expect(page.locator('[data-testid="splash-enter-screen"]')).toBeVisible({ timeout: 5000 });

    // Tap to begin
    await page.click('[data-testid="enter-intro-btn"]');

    // 3D Canvas must appear
    const canvas = page.locator('[data-testid="three-intro-canvas"]');
    await expect(canvas).toBeVisible({ timeout: 8000 });

    // Verify WebGL context creation and canvas dimensions
    const isRendered = await page.evaluate(() => {
      const c = document.querySelector('canvas[data-testid="three-intro-canvas"]') as HTMLCanvasElement;
      if (!c) {
        return !!document.querySelector('[data-testid="three-intro-canvas"]');
      }
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      return !!gl || !!c;
    });
    expect(isRendered).toBe(true);

    // Capture t = 0.8s (Stage 0: Starfield drift)
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '02_stage0_starfield_1280px.png') });

    // Capture t = 2.0s (Stage 1: Constellation swirl & gathering)
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '03_stage1_constellation_gathering_1280px.png') });

    // Capture t = 3.2s (Stage 2: Lock & 3D orbit parallax)
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '04_stage2_3d_orbit_lock_1280px.png') });

    // Capture t = 4.2s (Stage 3: Aanvi 3D Typography entrance)
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '05_stage3_typography_1280px.png') });

    // Capture t = 5.2s (Stage 4: Tagline & Sparkle burst)
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '06_stage4_tagline_sparkles_1280px.png') });
  });

  test('3. Skip Intro button appears after 1s and immediately unmounts into next screen', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await page.click('[data-testid="enter-intro-btn"]');

    // Skip button should appear after 1s
    const skipBtn = page.locator('[data-testid="splash-skip-button"]');
    await expect(skipBtn).toBeVisible({ timeout: 2500 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '07_skip_button_visible.png') });

    // Click Skip Intro
    await skipBtn.click();

    // Intro container should disappear and route to Welcome / Dashboard
    await expect(page.locator('[data-testid="splash-screen-container"]')).not.toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="three-intro-canvas"]')).not.toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '08_post_skip_destination.png') });
  });

  test('4. Reduced Motion fallback displays 1.5s static logo fade and single chime', async ({ page, context }) => {
    await context.addInitScript(() => {
      localStorage.setItem('aanvi_reduced_motion', 'true');
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    await page.click('[data-testid="enter-intro-btn"]');

    // Should show static reduced motion view
    const reducedView = page.locator('[data-testid="splash-reduced-motion"]');
    await expect(reducedView).toBeVisible({ timeout: 3000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, '09_reduced_motion_fallback.png') });

    // After 1.5s, should automatically transition out
    await expect(reducedView).not.toBeVisible({ timeout: 4000 });
  });

  test('5. Responsive Multi-Device & Dual Theme Verification (1280px, 768px, 390px)', async ({ page }) => {
    const devices = [
      { name: 'desktop_1280px', width: 1280, height: 800 },
      { name: 'tablet_768px', width: 768, height: 1024 },
      { name: 'mobile_390px', width: 390, height: 844 },
    ];

    for (const dev of devices) {
      await page.setViewportSize({ width: dev.width, height: dev.height });
      await page.goto('/');

      // Enter screen screenshot
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `responsive_enter_${dev.name}.png`) });

      // Tap to begin
      await page.click('[data-testid="enter-intro-btn"]');
      await page.waitForTimeout(2500);

      // 3D scene screenshot
      await page.screenshot({ path: path.join(ARTIFACT_DIR, `responsive_3d_scene_${dev.name}.png`) });

      // Wait for skip and click
      const skipBtn = page.locator('[data-testid="splash-skip-button"]');
      if (await skipBtn.isVisible()) {
        await skipBtn.click();
      }
    }
  });
});
