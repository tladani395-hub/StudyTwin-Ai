const { chromium } = require('@playwright/test');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\Tirth\\.gemini\\antigravity\\brain\\b57d341f-3178-41ff-865e-6f1f32d21ba5';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const setIntroSeen = async () => {
    await page.addInitScript(() => {
      localStorage.setItem('aanvi_intro_seen', 'true');
    });
  };

  await setIntroSeen();

  // 1. Architecture Inspector
  console.log('Capturing /architecture...');
  await page.goto('http://localhost:3000/architecture', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'architecture_inspector.png'), fullPage: true });

  // 2. Evaluation Page - Scholar Mode
  console.log('Capturing /evaluation (Scholar)...');
  await page.goto('http://localhost:3000/evaluation', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evaluation_scholar.png'), fullPage: true });

  // 3. Evaluation Page - Explorer Mode
  console.log('Capturing /evaluation (Explorer)...');
  await page.evaluate(() => {
    document.documentElement.setAttribute('data-mode', 'explorer');
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'evaluation_explorer.png'), fullPage: true });

  // 4. Tutor Chat Page with Sample Prompts & Citations
  console.log('Capturing /tutor...');
  await page.goto('http://localhost:3000/tutor', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'tutor_grounded_citations.png'), fullPage: true });

  await browser.close();
  console.log('All Part 5 screenshots captured successfully!');
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
