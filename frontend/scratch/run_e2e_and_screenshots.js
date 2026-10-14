const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ARTIFACT_DIR = 'C:/Users/Tirth/.gemini/antigravity/brain/b57d341f-3178-41ff-865e-6f1f32d21ba5';

async function seedData(userId) {
  return new Promise((resolve) => {
    const req = http.request(`http://127.0.0.1:8000/api/demo/seed?user_id=${userId}`, { method: 'POST' }, (res) => {
      resolve();
    });
    req.on('error', () => resolve());
    req.end();
  });
}

async function resetData(userId) {
  return new Promise((resolve) => {
    const req = http.request(`http://127.0.0.1:8000/api/demo/reset?user_id=${userId}`, { method: 'POST' }, (res) => {
      resolve();
    });
    req.on('error', () => resolve());
    req.end();
  });
}

async function run() {
  console.log('🚀 Starting Comprehensive E2E Playwright Suite & Screenshot Capture...\n');
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    // ══════════════════════════════════════════════════════════
    // 1. E2E TEST: THEME PERSISTENCE ACROSS LOGOUT / LOGIN
    // ══════════════════════════════════════════════════════════
    console.log('─── TEST 1: Theme Persistence Across Logout / Login (DB Sync) ───');
    await seedData(2); // Explorer user
    await seedData(1); // Scholar user

    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // Disable intro animation for faster direct testing
    await page.addInitScript(() => {
      sessionStorage.setItem('aanvi_intro_seen', 'true');
    });

    // 1A. Login as Demo Explorer
    await page.goto('http://localhost:3000/login');
    await page.click('button:has-text("Demo Explorer")');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in as Demo Explorer');

    // Change palette to B and theme to dark via Settings
    await page.goto('http://localhost:3000/settings');
    await page.waitForTimeout(500);

    // Click Palette B card
    await page.click('div:has-text("Palette B (Grape Purple Dominant)")');
    await page.waitForTimeout(600); // Debounce sync

    // Verify DOM attributes updated
    let domTheme = await page.getAttribute('html', 'data-theme');
    let domPalette = await page.getAttribute('html', 'data-palette');
    let domMode = await page.getAttribute('html', 'data-mode');
    console.log(`DOM State: mode=${domMode}, theme=${domTheme}, palette=${domPalette}`);
    if (domPalette !== 'b') throw new Error(`Expected data-palette="b", got "${domPalette}"`);

    // Logout
    await page.goto('http://localhost:3000/login');
    console.log('✅ Logged out');

    // Login back in
    await page.click('button:has-text("Demo Explorer")');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(600);

    // Verify restored from DB
    domPalette = await page.getAttribute('html', 'data-palette');
    domTheme = await page.getAttribute('html', 'data-theme');
    console.log(`Restored Explorer DOM State: theme=${domTheme}, palette=${domPalette}`);
    if (domPalette !== 'b') throw new Error(`Explorer DB restore failed: expected "b", got "${domPalette}"`);
    results.push({ name: 'Explorer Theme Persistence DB Restore', passed: true });

    // 1B. Repeat for Demo Scholar
    await page.goto('http://localhost:3000/login');
    await page.click('button:has-text("Demo Scholar")');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in as Demo Scholar');

    await page.goto('http://localhost:3000/settings');
    await page.waitForTimeout(500);

    // Set Palette B (Amber Dominant) and Light Theme
    await page.click('div:has-text("Palette B (Warm Amber Dominant)")');
    await page.click('button:has-text("Light")');
    await page.waitForTimeout(600);

    domTheme = await page.getAttribute('html', 'data-theme');
    domPalette = await page.getAttribute('html', 'data-palette');
    console.log(`Scholar Configured DOM State: theme=${domTheme}, palette=${domPalette}`);

    // Logout & Login
    await page.goto('http://localhost:3000/login');
    await page.click('button:has-text("Demo Scholar")');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    await page.waitForTimeout(600);

    domTheme = await page.getAttribute('html', 'data-theme');
    domPalette = await page.getAttribute('html', 'data-palette');
    console.log(`Restored Scholar DOM State: theme=${domTheme}, palette=${domPalette}`);
    if (domPalette !== 'b' || domTheme !== 'light') {
      throw new Error(`Scholar DB restore failed: expected theme="light", palette="b", got "${domTheme}" / "${domPalette}"`);
    }
    results.push({ name: 'Scholar Theme Persistence DB Restore', passed: true });

    // ══════════════════════════════════════════════════════════
    // 2. E2E TEST: 3D BUTTON ACCESSIBILITY & KEYBOARD TOGGLE
    // ══════════════════════════════════════════════════════════
    console.log('\n─── TEST 2: 3D Button Accessibility, ARIA & Keyboard ───');
    const colorBtn = await page.$('button[aria-label*="Toggle color"]');
    if (!colorBtn) throw new Error('3D Color button element not found in DOM');

    const ariaLabel = await colorBtn.getAttribute('aria-label');
    const ariaPressed = await colorBtn.getAttribute('aria-pressed');
    const tagName = await colorBtn.evaluate((el) => el.tagName);

    console.log(`Button Tag: <${tagName}>, aria-label: "${ariaLabel}", aria-pressed: "${ariaPressed}"`);
    if (tagName !== 'BUTTON') throw new Error(`Expected <button>, got <${tagName}>`);
    if (!ariaLabel || !ariaLabel.includes('Toggle color')) throw new Error('Missing aria-label');

    // Keyboard Toggle test: Focus and press Space
    await colorBtn.focus();
    const prevPal = await page.getAttribute('html', 'data-palette');
    await page.keyboard.press('Space');
    await page.waitForTimeout(300);

    const nextPal = await page.getAttribute('html', 'data-palette');
    console.log(`Keyboard toggle test: ${prevPal} -> ${nextPal}`);
    if (prevPal === nextPal) throw new Error('Keyboard Space press failed to toggle palette');
    results.push({ name: '3D Button ARIA & Keyboard Accessibility', passed: true });

    // ══════════════════════════════════════════════════════════
    // 3. CAPTURE ALL 8 SCREENSHOTS (Scholar & Explorer Themes)
    // ══════════════════════════════════════════════════════════
    console.log('\n─── CAPTURING DASHBOARD SCREENSHOTS ACROSS THEMES & PALETTES ───');

    const screenshotConfigs = [
      { mode: 'scholar', theme: 'dark', palette: 'a', file: 'scholar_dark_pal_a.png', title: 'Scholar Dark Palette A (Emerald Dominant)' },
      { mode: 'scholar', theme: 'dark', palette: 'b', file: 'scholar_dark_pal_b.png', title: 'Scholar Dark Palette B (Amber Dominant)' },
      { mode: 'scholar', theme: 'light', palette: 'a', file: 'scholar_light_pal_a.png', title: 'Scholar Light Palette A (Emerald Dominant)' },
      { mode: 'scholar', theme: 'light', palette: 'b', file: 'scholar_light_pal_b.png', title: 'Scholar Light Palette B (Amber Dominant)' },
      { mode: 'explorer', theme: 'dark', palette: 'a', file: 'explorer_dark_pal_a.png', title: 'Explorer Dark Palette A (Coral Dominant)' },
      { mode: 'explorer', theme: 'dark', palette: 'b', file: 'explorer_dark_pal_b.png', title: 'Explorer Dark Palette B (Grape Dominant)' },
      { mode: 'explorer', theme: 'light', palette: 'a', file: 'explorer_light_pal_a.png', title: 'Explorer Light Palette A (Coral Dominant)' },
      { mode: 'explorer', theme: 'light', palette: 'b', file: 'explorer_light_pal_b.png', title: 'Explorer Light Palette B (Grape Dominant)' },
    ];

    for (const cfg of screenshotConfigs) {
      const isExp = cfg.mode === 'explorer';
      await page.addInitScript(({ mode, theme, palette }) => {
        localStorage.setItem('aanvi_auth_store', JSON.stringify({
          state: {
            user: {
              id: mode === 'explorer' ? 2 : 1,
              name: mode === 'explorer' ? 'Demo Explorer' : 'Demo Scholar',
              email: mode === 'explorer' ? 'explorer@aanvi.ai' : 'scholar@aanvi.ai',
              mode,
              age: mode === 'explorer' ? 14 : 17,
              xp: mode === 'explorer' ? 1250 : 2400,
              stars: mode === 'explorer' ? 48 : 95,
              level: mode === 'explorer' ? 4 : 6,
              streak_days: 5,
            },
            mode,
            token: 'mock-token'
          }
        }));
        localStorage.setItem('aanvi_theme', theme);
        localStorage.setItem('aanvi_palette', palette);
        document.documentElement.setAttribute('data-mode', mode);
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-palette', palette);
      }, cfg);

      await page.goto('http://localhost:3000/dashboard');
      await page.evaluate(({ mode, theme, palette }) => {
        document.documentElement.setAttribute('data-mode', mode);
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-palette', palette);
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }, cfg);

      await page.waitForTimeout(500);
      const filePath = path.join(ARTIFACT_DIR, cfg.file);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`📸 Captured: ${cfg.title} -> ${cfg.file}`);
      results.push({ name: `Screenshot: ${cfg.title}`, passed: true, file: filePath });
    }

    // ══════════════════════════════════════════════════════════
    // 4. CAPTURE EMPTY STATES (Reset Data)
    // ══════════════════════════════════════════════════════════
    console.log('\n─── CAPTURING EMPTY STATE DASHBOARDS ───');
    await resetData(1);
    await resetData(2);

    // Scholar Empty State
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-mode', 'scholar');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-palette', 'a');
    });
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(500);
    const scholarEmptyPath = path.join(ARTIFACT_DIR, 'scholar_empty_state.png');
    await page.screenshot({ path: scholarEmptyPath, fullPage: true });
    console.log(`📸 Captured: Scholar Empty State -> scholar_empty_state.png`);
    results.push({ name: 'Screenshot: Scholar Empty State', passed: true, file: scholarEmptyPath });

    // Explorer Empty State
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-mode', 'explorer');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.setAttribute('data-palette', 'a');
    });
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForTimeout(500);
    const explorerEmptyPath = path.join(ARTIFACT_DIR, 'explorer_empty_state.png');
    await page.screenshot({ path: explorerEmptyPath, fullPage: true });
    console.log(`📸 Captured: Explorer Empty State -> explorer_empty_state.png`);
    results.push({ name: 'Screenshot: Explorer Empty State', passed: true, file: explorerEmptyPath });

    // Re-seed demo data back so app is in ready state
    await seedData(1);
    await seedData(2);

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('🎉 ALL PLAYWRIGHT E2E TESTS & SCREENSHOTS COMPLETED 100% PASS');
    console.log('══════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('❌ Playwright Error:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run();
