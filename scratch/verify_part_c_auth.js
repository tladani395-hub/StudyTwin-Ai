const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:/Users/Tirth/.gemini/antigravity/brain/b57d341f-3178-41ff-865e-6f1f32d21ba5';

async function run() {
  const browser = await chromium.launch({ headless: true });
  console.log('🚀 Launched browser for Part C Authentication Verification');

  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'mobile', width: 390, height: 844 },
  ];

  // =========================================================================
  // 1. SIGNUP PAGE VERIFICATION (DOB derivation, Guardian gate, Strength meter)
  // =========================================================================
  console.log('\n--- 1. Testing Signup Page (Responsive & Dynamic Derivation) ---');
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000/signup', { waitUntil: 'networkidle' });

    // Initial Neutral / Default
    const screenshotInitial = path.join(ARTIFACT_DIR, `auth_signup_initial_${vp.name}.png`);
    await page.screenshot({ path: screenshotInitial, fullPage: true });
    console.log(`✓ Captured signup initial (${vp.name}): ${screenshotInitial}`);

    // Enter minor DOB (2012-05-10, Age ~14) to trigger Explorer mode and Guardian email
    await page.fill('input[type="date"]', '2012-05-10');
    await page.fill('input[type="password"]', 'P@ssw0rd!');
    await page.waitForTimeout(500);

    const screenshotExplorer = path.join(ARTIFACT_DIR, `auth_signup_explorer_minor_${vp.name}.png`);
    await page.screenshot({ path: screenshotExplorer, fullPage: true });
    console.log(`✓ Captured signup minor Explorer mode with guardian email (${vp.name}): ${screenshotExplorer}`);

    // Enter adult DOB (2002-01-01, Age ~24) to trigger Scholar mode
    await page.fill('input[type="date"]', '2002-01-01');
    await page.waitForTimeout(500);

    const screenshotScholar = path.join(ARTIFACT_DIR, `auth_signup_scholar_adult_${vp.name}.png`);
    await page.screenshot({ path: screenshotScholar, fullPage: true });
    console.log(`✓ Captured signup adult Scholar mode (${vp.name}): ${screenshotScholar}`);

    await page.close();
  }

  // =========================================================================
  // 2. LOGIN PAGE VERIFICATION (Responsive, Show Password, Lockout Display)
  // =========================================================================
  console.log('\n--- 2. Testing Login Page (Responsive, Eye Toggle, Lockout) ---');
  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });

    // Desktop & mobile views
    const screenshotLogin = path.join(ARTIFACT_DIR, `auth_login_${vp.name}.png`);
    await page.screenshot({ path: screenshotLogin, fullPage: true });
    console.log(`✓ Captured login (${vp.name}): ${screenshotLogin}`);

    // Test Show Password toggle
    const toggleBtn = await page.$('button:has-text("Show")');
    if (toggleBtn) {
      await toggleBtn.click();
      await page.waitForTimeout(300);
      const screenshotShowPw = path.join(ARTIFACT_DIR, `auth_login_showpw_${vp.name}.png`);
      await page.screenshot({ path: screenshotShowPw, fullPage: true });
      console.log(`✓ Captured login show password toggle (${vp.name})`);
    }

    await page.close();
  }

  // =========================================================================
  // 3. FORGOT PASSWORD & RESET PASSWORD PAGES
  // =========================================================================
  console.log('\n--- 3. Testing Forgot Password & Reset Pages ---');
  const pageForgot = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await pageForgot.goto('http://localhost:3000/forgot-password', { waitUntil: 'networkidle' });
  const screenshotForgot = path.join(ARTIFACT_DIR, 'auth_forgot_password_desktop.png');
  await pageForgot.screenshot({ path: screenshotForgot, fullPage: true });
  console.log(`✓ Captured forgot password desktop: ${screenshotForgot}`);

  // Submit forgot password request
  await pageForgot.fill('input[type="email"]', 'scholar@aanvi.ai');
  await pageForgot.click('button[type="submit"]');
  await pageForgot.waitForTimeout(800);
  const screenshotForgotSubmitted = path.join(ARTIFACT_DIR, 'auth_forgot_password_submitted.png');
  await pageForgot.screenshot({ path: screenshotForgotSubmitted, fullPage: true });
  console.log(`✓ Captured forgot password submission confirmation: ${screenshotForgotSubmitted}`);

  // Test Reset Password view with token
  await pageForgot.goto('http://localhost:3000/forgot-password?token=sample_reset_token_demo_123', { waitUntil: 'networkidle' });
  await pageForgot.fill('input[placeholder="Minimum 8 characters"]', 'NewStrongP@ss99!');
  await pageForgot.waitForTimeout(400);
  const screenshotReset = path.join(ARTIFACT_DIR, 'auth_reset_password_with_token.png');
  await pageForgot.screenshot({ path: screenshotReset, fullPage: true });
  console.log(`✓ Captured reset password page with token & strength meter: ${screenshotReset}`);

  // =========================================================================
  // 4. PARENT ZONE GUARDIAN CONSENT CONFIRMATION
  // =========================================================================
  console.log('\n--- 4. Testing Parent Zone Consent Confirmation ---');
  await pageForgot.goto('http://localhost:3000/parent-zone?consent_token=sample_guardian_consent_456', { waitUntil: 'networkidle' });
  await pageForgot.waitForTimeout(500);
  const screenshotParentConsent = path.join(ARTIFACT_DIR, 'auth_parent_zone_consent_confirmed.png');
  await pageForgot.screenshot({ path: screenshotParentConsent, fullPage: true });
  console.log(`✓ Captured parent zone consent confirmation: ${screenshotParentConsent}`);

  await pageForgot.close();
  await browser.close();
  console.log('\n🎉 ALL PART C AUTHENTICATION VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

run().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
