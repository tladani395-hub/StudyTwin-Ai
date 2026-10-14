import asyncio
import os
import sys

# Ensure UTF-8 output on Windows console
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\Tirth\.gemini\antigravity\brain\b57d341f-3178-41ff-865e-6f1f32d21ba5"

async def capture_part6():
    async with async_playwright() as p:
        try:
            browser = await p.chromium.launch(channel="msedge", headless=True)
        except Exception:
            try:
                browser = await p.chromium.launch(channel="chrome", headless=True)
            except Exception:
                browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        # 1. Intro Animation Demo Screen
        print("1. Capturing Intro Animation (/animation-demo)...")
        try:
            await page.goto("http://localhost:3000/animation-demo", wait_until="networkidle")
            await page.wait_for_timeout(2000)
            intro_path = os.path.join(ARTIFACT_DIR, "part6_intro_animation.png")
            await page.screenshot(path=intro_path)
            print(f"   Saved: {intro_path}")
        except Exception as e:
            print(f"   Note: {e}")

        # 2. Voice Studio / Voice Tutor
        print("2. Capturing Voice Studio (/voice-studio)...")
        try:
            await page.goto("http://localhost:3000/voice-studio", wait_until="networkidle")
            await page.wait_for_timeout(1500)
            voice_path = os.path.join(ARTIFACT_DIR, "part6_voice_tutor.png")
            await page.screenshot(path=voice_path)
            print(f"   Saved: {voice_path}")
        except Exception as e:
            print(f"   Note: {e}")

        # 3. Camera Doubt & SymPy Step Checker
        print("3. Capturing Camera Doubt & SymPy Step Checker (/camera)...")
        try:
            await page.goto("http://localhost:3000/camera", wait_until="networkidle")
            await page.wait_for_timeout(1500)
            camera_path = os.path.join(ARTIFACT_DIR, "part6_camera_sympy.png")
            await page.screenshot(path=camera_path)
            print(f"   Saved: {camera_path}")
        except Exception as e:
            print(f"   Note: {e}")

        # 4. 3D Concept Galaxy - Scholar Dark
        print("4. Capturing 3D Concept Galaxy (Scholar Dark)...")
        try:
            await page.goto("http://localhost:3000/knowledge-graph", wait_until="networkidle")
            await page.evaluate("""() => {
                document.documentElement.setAttribute('data-mode', 'scholar');
                document.documentElement.setAttribute('data-theme', 'dark');
                document.documentElement.classList.add('dark');
            }""")
            await page.wait_for_timeout(2000)
            galaxy_scholar_path = os.path.join(ARTIFACT_DIR, "part6_galaxy_scholar.png")
            await page.screenshot(path=galaxy_scholar_path)
            print(f"   Saved: {galaxy_scholar_path}")
        except Exception as e:
            print(f"   Note: {e}")

        # 5. 3D Concept Galaxy - Explorer Light
        print("5. Capturing 3D Concept Galaxy (Explorer Light)...")
        try:
            await page.evaluate("""() => {
                document.documentElement.setAttribute('data-mode', 'explorer');
                document.documentElement.setAttribute('data-theme', 'light');
                document.documentElement.classList.remove('dark');
            }""")
            await page.wait_for_timeout(2000)
            galaxy_explorer_path = os.path.join(ARTIFACT_DIR, "part6_galaxy_explorer.png")
            await page.screenshot(path=galaxy_explorer_path)
            print(f"   Saved: {galaxy_explorer_path}")
        except Exception as e:
            print(f"   Note: {e}")

        # 6. Demo Script Overlay Triggered on Dashboard
        print("6. Capturing Demo Script Overlay on Dashboard...")
        try:
            await page.goto("http://localhost:3000/dashboard", wait_until="networkidle")
            await page.wait_for_timeout(1000)
            # Trigger Ctrl+D or click demo pitch button
            await page.keyboard.press("Control+d")
            await page.wait_for_timeout(1000)
            demo_path = os.path.join(ARTIFACT_DIR, "part6_demo_overlay.png")
            await page.screenshot(path=demo_path)
            print(f"   Saved: {demo_path}")
        except Exception as e:
            print(f"   Note: {e}")

        await browser.close()
        print("All Part 6 screenshots captured successfully!")

if __name__ == "__main__":
    asyncio.run(capture_part6())
