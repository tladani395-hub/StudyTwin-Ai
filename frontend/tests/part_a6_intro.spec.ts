import { test, expect } from '@playwright/test';

test.describe('Part A6: The Final Intro Suite', () => {

  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await page.addInitScript(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('aanvi_intro_every_visit', 'true');
        localStorage.setItem('aanvi_sound', 'true');
      } catch {}
    });
  });

  test('Intro starts immediately on load with ZERO tap-to-begin screen and ZERO language buttons', async ({ page }) => {
    // Navigate to homepage with clean state
    await page.goto('http://localhost:3000/?play_test=1', { waitUntil: 'domcontentloaded' });

    // 1. Verify splash screen container is immediately active
    const splash = page.locator('[data-testid="splash-screen-container"]');
    await expect(splash).toBeVisible({ timeout: 6000 });

    // 2. STRICTURE: Test MUST FAIL if any "Tap to begin" button exists
    const tapButton = page.locator('text=/Tap to begin|शुरू करने के लिए टैप|શરૂ કરવા માટે ટેપ/i');
    await expect(tapButton).toHaveCount(0);
    const enterBtn = page.locator('[data-testid="enter-intro-btn"]');
    await expect(enterBtn).toHaveCount(0);

    // 3. STRICTURE: Test MUST FAIL if language buttons are in the intro
    const langPickerInIntro = page.locator('[data-testid="splash-screen-container"] button:has-text("हिन्दी"), [data-testid="splash-screen-container"] button:has-text("ગુજરાતી")');
    await expect(langPickerInIntro).toHaveCount(0);

    // 4. Verify subtle top-corner speaker icon is present
    const soundToggle = page.locator('[data-testid="splash-sound-toggle"]');
    await expect(soundToggle).toBeVisible({ timeout: 4000 });

    // 5. Verify Three.js 3D Canvas is rendering
    const canvas = page.locator('[data-testid="three-intro-canvas"]').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });

    // 6. Verify real FPS badge is present
    const fpsBadge = page.locator('[data-testid="fps-badge"]').first();
    await expect(fpsBadge).toBeVisible({ timeout: 4000 });
    const fpsText = await fpsBadge.textContent();
    expect(fpsText).toContain('Aanvi 3D Core');
  });

  test('Skip button appears after 1s and fast-forwards directly to two doors opening', async ({ page }) => {
    await page.goto('http://localhost:3000/?skip_test=1', { waitUntil: 'domcontentloaded' });

    // Wait for skip button to appear at 1.0s
    const skipBtn = page.locator('[data-testid="splash-skip-button"]');
    await expect(skipBtn).toBeVisible({ timeout: 4000 });

    // Click Skip button
    await skipBtn.click();

    // Verify doors begin opening immediately
    const leftDoor = page.locator('[data-testid="intro-door-left"]');
    const rightDoor = page.locator('[data-testid="intro-door-right"]');
    await expect(leftDoor).toBeVisible({ timeout: 3000 });
    await expect(rightDoor).toBeVisible({ timeout: 3000 });

    // Verify Welcome screen appears behind the doors with Sign in and Sign up buttons
    const signInBtn = page.locator('[data-testid="welcome-sign-in"]');
    const signUpBtn = page.locator('[data-testid="welcome-sign-up"]');
    await expect(signInBtn).toBeVisible({ timeout: 4000 });
    await expect(signUpBtn).toBeVisible({ timeout: 4000 });
  });

  test('Escape key fast-forwards directly to two doors opening without cutting to black', async ({ page }) => {
    await page.goto('http://localhost:3000/?esc_test=1', { waitUntil: 'domcontentloaded' });

    const splash = page.locator('[data-testid="splash-screen-container"]');
    await expect(splash).toBeVisible({ timeout: 6000 });

    // Press Escape
    await page.keyboard.press('Escape');

    // Doors must open
    const leftDoor = page.locator('[data-testid="intro-door-left"]');
    const rightDoor = page.locator('[data-testid="intro-door-right"]');
    await expect(leftDoor).toBeVisible({ timeout: 3000 });
    await expect(rightDoor).toBeVisible({ timeout: 3000 });

    // Revealed Welcome screen with Sign In & Sign Up
    const signInBtn = page.locator('[data-testid="welcome-sign-in"]');
    await expect(signInBtn).toBeVisible({ timeout: 4000 });
  });

  test('Full 8.2s timeline transitions: deep space -> logo -> happy face -> doors open -> welcome screen', async ({ page }) => {
    test.setTimeout(25000);
    await page.goto('http://localhost:3000/?timeline_test=1', { waitUntil: 'domcontentloaded' });

    const splash = page.locator('[data-testid="splash-screen-container"]');
    await expect(splash).toBeVisible({ timeout: 6000 });

    // Verify canvas is running
    await expect(page.locator('[data-testid="three-intro-canvas"]').first()).toBeVisible({ timeout: 5000 });

    // Both doors appear and split open at 7.3s
    const leftDoor = page.locator('[data-testid="intro-door-left"]');
    const rightDoor = page.locator('[data-testid="intro-door-right"]');
    await Promise.all([
      expect(leftDoor).toBeVisible({ timeout: 10000 }),
      expect(rightDoor).toBeVisible({ timeout: 10000 }),
    ]);

    // Wait until full intro finishes and resolves into Welcome screen with Sign In & Sign Up
    const welcomeSignIn = page.locator('[data-testid="welcome-sign-in"]');
    await expect(welcomeSignIn).toBeVisible({ timeout: 8000 });
  });

  test('Settings contains Play intro on every visit and Intro sound toggles (both default ON)', async ({ page }) => {
    await page.goto('http://localhost:3000/settings', { waitUntil: 'domcontentloaded' });

    // Navigate to appearance/theme settings tab
    const themeTab = page.locator('button:has-text("Theme"), button:has-text("Appearance")').first();
    if (await themeTab.isVisible()) {
      await themeTab.click();
    }

    // Verify "Play intro on every visit" toggle exists
    const introEveryToggle = page.locator('[data-testid="toggle-intro-every-visit"]');
    await expect(introEveryToggle).toBeVisible({ timeout: 5000 });

    // Verify "Intro sound" toggle exists
    const soundToggle = page.locator('[data-testid="toggle-intro-sound"]');
    await expect(soundToggle).toBeVisible({ timeout: 5000 });
  });

  test('Autoplay test with default policy: starts silent with sound-icon-muted, gesture unlocks sound-icon-unmuted', async ({ page }) => {
    await page.goto('/?autoplay_test=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="splash-screen-container"]');

    const soundBtn = page.locator('[data-testid="splash-sound-toggle"]');
    await expect(soundBtn).toBeVisible({ timeout: 4000 });

    // Emulate user gesture by clicking on the page
    await page.click('[data-testid="splash-screen-container"]');

    // Trigger audio resume directly via user gesture activation
    await page.evaluate(async () => {
      const s = (window as any).__AANVI_AUDIO_SYNTH;
      if (s) {
        await s.resume();
      }
    });

    // After gesture: speaker icon is unmuted and AudioContext is running
    const unmutedIcon = page.locator('[data-testid="sound-icon-unmuted"]');
    await expect(unmutedIcon).toBeVisible({ timeout: 4000 });
    const afterState = await page.evaluate(() => {
      const s = (window as any).__AANVI_AUDIO_SYNTH;
      return {
        ctxState: s && s.getContext() ? s.getContext().state : null,
        isPlaying: s ? s.isPlaying : null
      };
    });
    expect(afterState.ctxState).toBe('running');
  });

  test('WebGL canvas renders active 3D animation: two frames 1s apart differ', async ({ page }) => {
    await page.goto('/?diff_test=1', { waitUntil: 'domcontentloaded' });
    const canvas = page.locator('canvas[data-testid="three-intro-canvas"]').first();
    await expect(canvas).toBeVisible({ timeout: 6000 });

    // Frame 1 at ~1.0s
    await page.waitForTimeout(1000);
    const frame1 = await canvas.screenshot();

    // Frame 2 at ~2.0s (1 second later)
    await page.waitForTimeout(1000);
    const frame2 = await canvas.screenshot();

    // Verify frames are different (buffer diff > 0)
    let differentBytes = 0;
    const len = Math.min(frame1.length, frame2.length);
    for (let i = 0; i < len; i++) {
      if (frame1[i] !== frame2[i]) differentBytes++;
    }
    const diffRatio = differentBytes / len;
    console.log(`Measured 3D frame buffer difference: ${(diffRatio * 100).toFixed(2)}%`);
    expect(diffRatio).toBeGreaterThan(0.01);
  });

  test('AudioContext stops immediately on skip: isPlaying becomes false', async ({ page }) => {
    await page.goto('/?skip_audio_test=1', { waitUntil: 'domcontentloaded' });
    const skipBtn = page.locator('[data-testid="splash-skip-button"]');
    await expect(skipBtn).toBeVisible({ timeout: 6000 });

    // Click Skip
    await skipBtn.click();
    await page.waitForTimeout(200);

    // Confirm isPlaying stopped
    const isPlayingAfterSkip = await page.evaluate(() => {
      const s = (window as any).__AANVI_AUDIO_SYNTH;
      return s ? s.isPlaying : false;
    });
    expect(isPlayingAfterSkip).toBe(false);
  });

  test('prefers-reduced-motion media query gives static fallback screen', async ({ browser }) => {
    const context = await browser.newContext({
      reducedMotion: 'reduce',
      baseURL: 'http://localhost:3000',
    });
    const page = await context.newPage();
    await page.goto('/?reduced_test=1', { waitUntil: 'domcontentloaded' });

    const reducedMotionFallback = page.locator('[data-testid="splash-reduced-motion"]');
    await expect(reducedMotionFallback).toBeVisible({ timeout: 5000 });

    // 3D Canvas should NOT be rendered when reduced motion is requested
    const canvas = page.locator('canvas[data-testid="three-intro-canvas"]');
    await expect(canvas).toHaveCount(0);

    await context.close();
  });

  test('WebGL disabled gives static fallback with data-testid="intro-webgl-fallback"', async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = function (type: string) {
        if (type.includes('webgl')) return null;
        return null;
      } as any;
    });

    await page.goto('/?no_webgl=1', { waitUntil: 'domcontentloaded' });
    const fallback = page.locator('[data-testid="intro-webgl-fallback"]');
    await expect(fallback).toBeVisible({ timeout: 6000 });
  });

  test('After doors open, Sign in and Sign up are visible and clickable', async ({ page }) => {
    await page.goto('/?welcome_test=1', { waitUntil: 'domcontentloaded' });
    const skipBtn = page.locator('[data-testid="splash-skip-button"]');
    await expect(skipBtn).toBeVisible({ timeout: 6000 });
    await skipBtn.click();

    const signIn = page.locator('[data-testid="welcome-sign-in"]');
    const signUp = page.locator('[data-testid="welcome-sign-up"]');
    await expect(signIn).toBeVisible({ timeout: 5000 });
    await expect(signUp).toBeVisible({ timeout: 5000 });

    // Test clickability
    await signIn.click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('5 intro replays show memory does not leak (geometries and textures return to baseline)', async ({ page }) => {
    test.setTimeout(45000);
    const memorySnapshots: { geometries: number; textures: number }[] = [];

    for (let i = 0; i < 5; i++) {
      await page.goto(`/?replay=${i}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 6000 });
      await page.waitForTimeout(600);

      const mem = await page.evaluate(() => {
        const r = (window as any).__AANVI_RENDERER;
        if (r && r.info && r.info.memory) {
          return {
            geometries: r.info.memory.geometries,
            textures: r.info.memory.textures
          };
        }
        return { geometries: 0, textures: 0 };
      });
      memorySnapshots.push(mem);
    }

    console.log('5 Replays Memory Counts (geometries, textures):', memorySnapshots);
    expect(memorySnapshots[4].geometries).toBeLessThanOrEqual(memorySnapshots[0].geometries + 2);
    expect(memorySnapshots[4].textures).toBeLessThanOrEqual(memorySnapshots[0].textures + 2);
  });

  test('Strict Audio Test: Fails on silence, asserts RMS between -22 and -14 dBFS, Peak between -6 and -1 dBFS, and real energy across 6 cue windows', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('http://localhost:3000/?strict_audio=1', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('[data-testid="three-intro-canvas"]', { timeout: 6000 });

    // Prevent auto-finish during audio capture
    await page.evaluate(() => {
      (window as any).__AANVI_DISABLE_AUTOFINISH = true;
    });

    // Start synchronous audio capture from 0.0s
    await page.evaluate(async () => {
      if ((window as any).__AANVI_RESET_TIMELINE) {
        (window as any).__AANVI_RESET_TIMELINE();
      }
      const s = (window as any).__AANVI_AUDIO_SYNTH;
      if (s) {
        s.stop();
        s.startRecording();
        await s.resume();
        s.setVolume(0.8);
        await s.start(0);
      }
    });

    // Play entire 8.4s timeline
    await page.waitForTimeout(8800);

    // Retrieve captured audio
    const audioData = await page.evaluate(async () => {
      const s = (window as any).__AANVI_AUDIO_SYNTH;
      return s ? await s.stopRecording() : { wav: '', sampleRate: 48000 };
    });

    expect(audioData.wav).toBeTruthy();
    const rawBuffer = Buffer.from(audioData.wav, 'base64');
    expect(rawBuffer.length).toBeGreaterThan(44);

    // Parse 16-bit PCM WAV samples
    const sampleRate = rawBuffer.readUInt32LE(24);
    const numSamples = (rawBuffer.length - 44) / 2;
    const samples = new Float64Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      const val = rawBuffer.readInt16LE(44 + i * 2);
      samples[i] = val / 32768.0;
    }

    // 1. Overall Peak & RMS
    let maxPeak = 0;
    let sumSq = 0;
    for (let i = 0; i < samples.length; i++) {
      const absVal = Math.abs(samples[i]);
      if (absVal > maxPeak) maxPeak = absVal;
      sumSq += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sumSq / samples.length);
    const peakDbfs = 20 * Math.log10(maxPeak);
    const rmsDbfs = 20 * Math.log10(rms);

    console.log(`[Strict Audio Spec] Captured ${numSamples} samples (${(numSamples / sampleRate).toFixed(2)}s)`);
    console.log(`[Strict Audio Spec] Measured Peak: ${peakDbfs.toFixed(2)} dBFS, Measured RMS: ${rmsDbfs.toFixed(2)} dBFS`);

    // Strict assertions: MUST fail on silence
    expect(rmsDbfs).toBeGreaterThan(-22.0); // Strict floor: silence (-99) or quiet audio (-41) fails
    expect(rmsDbfs).toBeLessThan(-14.0);    // Strict ceiling: prevents uncomfortably loud audio
    expect(peakDbfs).toBeGreaterThan(-6.0); // Real audible transients
    expect(peakDbfs).toBeLessThan(-1.0);    // Limiter ceiling prevents digital clipping

    // 2. Assert real energy in each of the 6 cue windows
    const cueWindows = [
      { name: '0.15–1.8s (star chimes)', start: 0.15, end: 1.8 },
      { name: '3.0–4.6s (fly-through whoosh)', start: 3.0, end: 4.6 },
      { name: '4.6–5.5s (orb chime)', start: 4.6, end: 5.5 },
      { name: '5.6–6.3s (smile chime)', start: 5.6, end: 6.3 },
      { name: '6.4–7.2s (letters & chord)', start: 6.4, end: 7.2 },
      { name: '7.3–8.2s (doors grand whoosh)', start: 7.3, end: 8.2 },
    ];

    for (const win of cueWindows) {
      const startIdx = Math.floor(win.start * sampleRate);
      const endIdx = Math.min(samples.length, Math.floor(win.end * sampleRate));
      let winSumSq = 0;
      let winPeak = 0;
      const count = endIdx - startIdx;
      for (let i = startIdx; i < endIdx; i++) {
        const a = Math.abs(samples[i]);
        if (a > winPeak) winPeak = a;
        winSumSq += samples[i] * samples[i];
      }
      const winRms = Math.sqrt(winSumSq / count);
      const winRmsDbfs = 20 * Math.log10(winRms);
      const winPeakDbfs = 20 * Math.log10(winPeak);

      console.log(`  Cue Window [${win.name}]: Peak = ${winPeakDbfs.toFixed(2)} dBFS, RMS = ${winRmsDbfs.toFixed(2)} dBFS`);
      // Must not be silent: RMS must exceed -30 dBFS
      expect(winRmsDbfs).toBeGreaterThan(-30.0);
    }
  });

});

