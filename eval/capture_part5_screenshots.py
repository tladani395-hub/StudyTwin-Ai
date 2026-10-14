import asyncio
import os
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5"

async def capture_all():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # 1. Architecture Inspector
        print("Capturing /architecture...")
        await page.goto("http://localhost:3000/architecture", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        arch_path = os.path.join(ARTIFACT_DIR, "architecture_inspector.png")
        await page.screenshot(path=arch_path, full_page=True)
        print(f"Saved: {arch_path}")

        # 2. Evaluation Page - Scholar Mode
        print("Capturing /evaluation (Scholar)...")
        await page.goto("http://localhost:3000/evaluation", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        eval_scholar_path = os.path.join(ARTIFACT_DIR, "evaluation_scholar.png")
        await page.screenshot(path=eval_scholar_path, full_page=True)
        print(f"Saved: {eval_scholar_path}")

        # 3. Evaluation Page - Explorer Mode
        print("Capturing /evaluation (Explorer)...")
        # Change mode to explorer via html data attribute or navigation
        await page.evaluate("() => { document.documentElement.setAttribute('data-mode', 'explorer'); }")
        await page.wait_for_timeout(500)
        eval_explorer_path = os.path.join(ARTIFACT_DIR, "evaluation_explorer.png")
        await page.screenshot(path=eval_explorer_path, full_page=True)
        print(f"Saved: {eval_explorer_path}")

        # 4. Tutor Chat with Sample Query Buttons & Citations
        print("Capturing /tutor (Grounded Chat)...")
        await page.goto("http://localhost:3000/tutor", wait_until="networkidle")
        await page.wait_for_timeout(1000)
        tutor_path = os.path.join(ARTIFACT_DIR, "tutor_grounded_citations.png")
        await page.screenshot(path=tutor_path, full_page=True)
        print(f"Saved: {tutor_path}")

        await browser.close()
        print("All screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture_all())
