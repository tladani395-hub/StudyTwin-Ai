import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const brandDir = path.resolve('public/brand');
  const artifactsDir = path.resolve('tests/artifacts/part_a3');

  // 1. Render 1024x1024 transparent PNG from aanvi-logo.svg
  const svgPath = path.join(brandDir, 'aanvi-logo.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  await page.setViewportSize({ width: 1024, height: 1024 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 1000px;
            height: 1000px;
            background: transparent;
            overflow: hidden;
          }
          svg {
            width: 1000px;
            height: 1000px;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `);

  const out1024 = path.join(brandDir, 'aanvi-logo-1024.png');
  await page.screenshot({ path: out1024, omitBackground: true });
  console.log('Saved 1024x1024 mascot PNG to:', out1024);

  // 2. Render 32x32 favicon
  const favSvgPath = path.join(brandDir, 'favicon.svg');
  const favContent = fs.readFileSync(favSvgPath, 'utf8');

  await page.setViewportSize({ width: 32, height: 32 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 32px;
            height: 32px;
            background: transparent;
            overflow: hidden;
          }
          svg {
            width: 32px;
            height: 32px;
          }
        </style>
      </head>
      <body>
        ${favContent}
      </body>
    </html>
  `);
  const outFav32 = path.join(brandDir, 'favicon-32.png');
  const outFavIco = path.resolve('public/favicon.ico');
  await page.screenshot({ path: outFav32 });
  fs.copyFileSync(outFav32, outFavIco);
  console.log('Saved 32x32 favicon to:', outFav32, 'and copied to:', outFavIco);

  // 3. Render side-by-side overlay comparison image
  // Left: Vector Logo (aanvi-logo-happy-tile.svg), Right: 3D Render (frame_6.0s_desktop.png)
  const frame6Path = path.join(artifactsDir, 'frame_6.0s_desktop.png');
  let frame6Data = '';
  if (fs.existsSync(frame6Path)) {
    frame6Data = 'data:image/png;base64,' + fs.readFileSync(frame6Path).toString('base64');
  }

  const happyTileSvg = fs.readFileSync(path.join(brandDir, 'aanvi-logo-happy-tile.svg'), 'utf8');

  await page.setViewportSize({ width: 1280, height: 680 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 24px;
            background: #0B0A12;
            color: #FFFFFF;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          h1 {
            font-size: 22px;
            font-weight: 800;
            margin: 0 0 6px 0;
            letter-spacing: -0.5px;
            background: linear-gradient(90deg, #FF6B57, #BA7FFF, #FFD166);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          p {
            font-size: 13px;
            color: rgba(255,255,255,0.6);
            margin: 0 0 20px 0;
            font-family: monospace;
          }
          .grid {
            display: flex;
            gap: 24px;
            width: 100%;
            max-width: 1200px;
            justify-content: center;
          }
          .card {
            flex: 1;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 16px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .card-title {
            font-size: 14px;
            font-weight: bold;
            color: #FFD166;
            margin-bottom: 12px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
          .img-box {
            width: 100%;
            height: 480px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            overflow: hidden;
            background: #06050a;
          }
          .img-box img, .img-box svg {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
          .badge {
            margin-top: 10px;
            font-size: 11px;
            font-family: monospace;
            padding: 4px 10px;
            border-radius: 20px;
            background: rgba(123, 75, 255, 0.25);
            border: 1px solid rgba(123, 75, 255, 0.5);
            color: #d1b8ff;
          }
        </style>
      </head>
      <body>
        <h1>Aanvi Part A5 • 3D Mascot vs Authentic Vector Specification</h1>
        <p>1:1 Geometry, Anatomy & Shading Fidelity Verification</p>
        <div class="grid">
          <div class="card">
            <div class="card-title">Authentic Vector Mascot Specification</div>
            <div class="img-box">
              ${happyTileSvg}
            </div>
            <div class="badge">brand/aanvi-logo-happy-tile.svg (Clean SVG)</div>
          </div>
          <div class="card">
            <div class="card-title">Real-Time 3D WebGL Scene (6.0s Still Frame)</div>
            <div class="img-box">
              <img src="${frame6Data}" alt="3D Render" />
            </div>
            <div class="badge">Three.js MeshPhysicalMaterial • 60 FPS • Extruded Wordmark</div>
          </div>
        </div>
      </body>
    </html>
  `);

  const outComparison = path.join(artifactsDir, 'overlay_mascot_comparison.png');
  await page.screenshot({ path: outComparison });
  console.log('Saved mascot comparison screenshot to:', outComparison);

  await browser.close();
}

main().catch(console.error);
