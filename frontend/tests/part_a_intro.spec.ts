import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACT_DIR = path.join(__dirname, 'artifacts', 'part_a');

test.beforeAll(() => {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  }
});

const VIEWPORTS = [
  { name: 'desktop_1280', width: 1280, height: 800 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'mobile_390', width: 390, height: 844 },
];

const MODES = ['explorer', 'scholar'];

test.describe('PART A: Aanvi Intro Animation Flow & Verification', () => {
  for (const mode of MODES) {
    for (const vp of VIEWPORTS) {
      test(`Intro Frame Captures (0s, 1.5s, 3.0s, 5.0s) [${mode.toUpperCase()}] at ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });
        
        // Seed mode in localStorage before page load
        await page.addInitScript((userMode) => {
          try {
            const user = {
              id: userMode === 'explorer' ? 1 : 2,
              name: userMode === 'explorer' ? 'Demo Explorer' : 'Demo Scholar',
              email: `${userMode}@aanvi.ai`,
              age: userMode === 'explorer' ? 14 : 19,
              mode: userMode,
              streak_days: 5,
              stars: 48,
              level: 4
            };
            localStorage.setItem('aanvi_user', JSON.stringify(user));
            localStorage.setItem('aanvi_mode', userMode);
          } catch {}
        }, mode);

        await page.goto('http://localhost:3000/intro');

        // Frame 0s (Cosmic Star Drift & Orbit)
        const splash = page.locator('[data-testid="splash-screen-container"]');
        await expect(splash).toBeVisible({ timeout: 5000 });
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `intro_${mode}_${vp.name}_0s.png`) });

        // Frame 1.5s (Constellation Outline Draw & Dual Color Fill)
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `intro_${mode}_${vp.name}_1.5s.png`) });

        // Frame 3.0s (Typographic Shimmer & Letter by Letter Reveal)
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `intro_${mode}_${vp.name}_3.0s.png`) });

        // Frame 5.0s (Portal open & App reveal)
        await page.waitForTimeout(2000);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, `intro_${mode}_${vp.name}_5.0s.png`) });
      });
    }
  }

  test('Intro Plays on 3 Consecutive Full Page Reloads', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Visit 1
    await page.goto('http://localhost:3000/intro');
    let splash = page.locator('[data-testid="splash-screen-container"]');
    await expect(splash).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reload_1_intro.png') });

    // Reload 1 (Visit 2)
    await page.reload();
    splash = page.locator('[data-testid="splash-screen-container"]');
    await expect(splash).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reload_2_intro.png') });

    // Reload 2 (Visit 3)
    await page.reload();
    splash = page.locator('[data-testid="splash-screen-container"]');
    await expect(splash).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reload_3_intro.png') });
  });

  test('Skip Button Works Immediately After 1.0s', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/intro');

    // Wait for skip button to appear at 1.0s
    const skipBtn = page.locator('[data-testid="splash-skip-button"]');
    await expect(skipBtn).toBeVisible({ timeout: 4000 });

    // Click Skip
    await skipBtn.click();
    await page.waitForTimeout(600);

    // Verify splash screen container is dismissed
    const splash = page.locator('[data-testid="splash-screen-container"]');
    await expect(splash).not.toBeVisible();
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'skip_button_success.png') });
  });

  test('Reduced Motion Mode Displays Static Logo Fade for 1.5s', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:3000/intro');

    const reducedSplash = page.locator('[data-testid="splash-reduced-motion"]');
    await expect(reducedSplash).toBeVisible({ timeout: 4000 });
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'reduced_motion_static_fade.png') });

    // Verify it finishes in ~1.5s
    await page.waitForTimeout(2000);
    await expect(reducedSplash).not.toBeVisible();
  });
});
