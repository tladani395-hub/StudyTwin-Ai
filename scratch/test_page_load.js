const { chromium } = require('../frontend/node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('aanvi_intro_every_visit', 'true');
      localStorage.setItem('aanvi_sound', 'true');
    } catch {}
  });

  page.on('response', res => {
    if (res.status() >= 400) console.log('FAILED REQ:', res.status(), res.url());
  });

  await page.goto('http://localhost:3000/?play_test=1');
  await page.waitForTimeout(2000);
  const splash = await page.locator('[data-testid="splash-screen-container"]').count();
  const canvas = await page.locator('[data-testid="three-intro-canvas"]').count();
  const title = await page.title();
  const html = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
  console.log('Title:', title);
  console.log('Splash count:', splash, 'Canvas count:', canvas);
  console.log('HTML snippet:', html);
  await browser.close();
})();
