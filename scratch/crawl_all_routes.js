const { chromium } = require('D:/StudyTwin-AI/frontend/node_modules/@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';

const PUBLIC_ROUTES = [
  { name: 'Home Landing', path: '/' },
  { name: 'Welcome Screen', path: '/welcome' },
  { name: 'Login Screen', path: '/login' },
  { name: 'Sign Up Screen', path: '/signup' },
  { name: 'Architecture Overview', path: '/architecture' },
  { name: 'Brand Intro Animation', path: '/intro' },
  { name: 'Forgot Password', path: '/forgot-password' },
  { name: 'Reset Password', path: '/reset-password' },
  { name: 'Privacy Policy', path: '/privacy' },
  { name: 'Terms of Service', path: '/terms' },
];

const EXPLORER_ROUTES = [
  { name: 'Adventure Map (Dashboard)', path: '/dashboard' },
  { name: 'Spark Tutor', path: '/tutor' },
  { name: 'Star Quiz (Assessment)', path: '/assessment' },
  { name: 'My Courses', path: '/courses' },
  { name: 'Space Galaxy (Knowledge Map)', path: '/knowledge-map' },
  { name: 'Camera Doubt Solver', path: '/camera-doubt' },
  { name: 'Concept Flashcards', path: '/flashcards' },
  { name: 'Parent Zone', path: '/parent-zone' },
  { name: 'Achievements & Quests', path: '/achievements' },
  { name: 'Explorer AI Safety & Evaluation', path: '/evaluation' },
  { name: 'Explorer Settings', path: '/settings' },
];

const SCHOLAR_ROUTES = [
  { name: 'Scholar Dashboard', path: '/dashboard' },
  { name: 'Source-Grounded Tutor', path: '/tutor' },
  { name: 'Adaptive Assessments', path: '/assessment' },
  { name: 'Results & BKT Feedback', path: '/results' },
  { name: 'Course Galaxy Map', path: '/knowledge-map' },
  { name: 'Spaced Schedule Planner', path: '/study-plan' },
  { name: 'Courses & Material', path: '/courses' },
  { name: 'Multimodal Upload', path: '/upload' },
  { name: 'RAGAS Evaluation', path: '/evaluation' },
  { name: 'Camera Doubt Proof Solver', path: '/camera-doubt' },
  { name: 'Flashcard Mastery', path: '/flashcards' },
  { name: 'Achievements & Badges', path: '/achievements' },
  { name: 'Scholar Settings', path: '/settings' },
];

async function crawlCategory(browser, categoryName, routes, setupFn) {
  console.log(`\n======================================================`);
  console.log(`Crawling: ${categoryName} (${routes.length} routes)`);
  console.log(`======================================================`);

  const results = [];
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  if (setupFn) {
    await setupFn(page);
  }

  for (const item of routes) {
    try {
      const response = await page.goto(item.path, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = response ? response.status() : 200;

      // Allow brief client hydration
      await page.waitForTimeout(400);

      const pageTitle = await page.title();
      const is404 = status === 404 || pageTitle.includes('404: This page could not be found');

      // Get main heading or title for proof
      const heading = await page.evaluate(() => {
        const h = document.querySelector('h1, h2, [data-testid="page-title"]');
        return h ? h.textContent.trim().replace(/\s+/g, ' ') : '';
      });

      const hasRealContent = !is404 && status === 200 && (heading.length > 0 || (await page.locator('main, [data-testid]').count()) > 0);

      const resObj = {
        name: item.name,
        path: item.path,
        category: categoryName,
        status: status,
        is404: is404,
        renderedContent: hasRealContent,
        headingSnippet: heading.slice(0, 40),
      };
      results.push(resObj);

      console.log(`[${status === 200 && !is404 ? 'PASS 200' : 'FAIL'}] ${item.path.padEnd(20)} | Content: ${hasRealContent ? 'YES' : 'NO'} | Heading: "${resObj.headingSnippet}"`);
    } catch (err) {
      console.error(`[ERROR] ${item.path}:`, err.message);
      results.push({
        name: item.name,
        path: item.path,
        category: categoryName,
        status: 500,
        is404: false,
        renderedContent: false,
        headingSnippet: err.message,
      });
    }
  }

  await context.close();
  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1. Logged-out Public Routes
  const publicResults = await crawlCategory(browser, 'Logged-Out (Public)', PUBLIC_ROUTES, async (page) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('aanvi_intro_finished', 'true');
    });
  });

  // 2. Logged-in Explorer Mode (Junior age <= 15)
  const explorerResults = await crawlCategory(browser, 'Logged-In (Explorer Mode)', EXPLORER_ROUTES, async (page) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('aanvi_intro_finished', 'true');
      localStorage.setItem('aanvi_user', JSON.stringify({
        id: 'explorer_user_1',
        email: 'explorer@studytwin.ai',
        fullName: 'Aanvi Explorer',
        role: 'student',
        ageGroup: 'junior',
        schoolGrade: '6th Grade',
        mode: 'explorer',
        stars: 48,
        theme: 'dark'
      }));
      localStorage.setItem('aanvi_mode', 'explorer');
    });
  });

  // 3. Logged-in Scholar Mode (Senior age >= 16)
  const scholarResults = await crawlCategory(browser, 'Logged-In (Scholar Mode)', SCHOLAR_ROUTES, async (page) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('aanvi_intro_finished', 'true');
      localStorage.setItem('aanvi_user', JSON.stringify({
        id: 'scholar_user_1',
        email: 'scholar@studytwin.ai',
        fullName: 'Prof. Aanvi Scholar',
        role: 'student',
        ageGroup: 'senior',
        schoolGrade: 'University / Undergraduate',
        mode: 'scholar',
        stars: 120,
        theme: 'dark'
      }));
      localStorage.setItem('aanvi_mode', 'scholar');
    });
  });

  await browser.close();

  const all = [...publicResults, ...explorerResults, ...scholarResults];
  const passed = all.filter(r => r.status === 200 && r.renderedContent);
  console.log(`\n======================================================`);
  console.log(`ROUTE AUDIT COMPLETE: ${passed.length} / ${all.length} PASSED`);
  console.log(`======================================================`);

  fs.writeFileSync(
    path.join(__dirname, 'route_crawl_results.json'),
    JSON.stringify(all, null, 2)
  );
}

main().catch(err => {
  console.error('Crawler failed:', err);
  process.exit(1);
});
