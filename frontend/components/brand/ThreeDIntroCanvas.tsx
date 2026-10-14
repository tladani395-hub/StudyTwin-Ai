'use client';

import React, { useEffect, useRef, useState } from 'react';
import type * as THREE_TYPES from 'three';
import { THREE } from '@/lib/threeIntro';
import {
  createMascotMothBodyShape,
  createMascotOutlineCurve,
  createMascotAntennaeCurves,
  createSparkleCrossShape,
  createHappyEyesCurves,
  createSmileCurve,
  createWordmarkLetterShapes,
} from '@/lib/logoMark';

interface ThreeDIntroCanvasProps {
  onTimelineProgress?: (seconds: number) => void;
  onComplete?: () => void;
  onSnapshotReady?: (dataUrl: string) => void;
  lang?: 'en' | 'hi' | 'gu';
  qualityOverride?: 'high' | 'medium' | 'low';
}

export default function ThreeDIntroCanvas({
  onTimelineProgress,
  onComplete,
  onSnapshotReady,
  lang = 'en',
  qualityOverride,
}: ThreeDIntroCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isCleanedUpRef = useRef<boolean>(false);
  const snapshotTakenRef = useRef<boolean>(false);

  const onProgressRef = useRef(onTimelineProgress);
  onProgressRef.current = onTimelineProgress;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onSnapshotReadyRef = useRef(onSnapshotReady);
  onSnapshotReadyRef.current = onSnapshotReady;

  const [webGlSupported, setWebGlSupported] = useState(true);
  const [measuredFps, setMeasuredFps] = useState(60);
  const [avgFrameTimeMs, setAvgFrameTimeMs] = useState(16.6);
  const [particleTotal, setParticleTotal] = useState(4000);
  const [activeQuality, setActiveQuality] = useState<'high' | 'medium' | 'low'>(qualityOverride || 'high');

  useEffect(() => {
    isCleanedUpRef.current = false;
    snapshotTakenRef.current = false;
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Detect initial profile
    const isMobile = width < 768;
    const urlQuality = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('quality') as ('high' | 'medium' | 'low' | null) : null;
    const windowQuality = typeof window !== 'undefined' ? (window as any).__AANVI_QUALITY_OVERRIDE : null;
    const initialQuality = qualityOverride || urlQuality || windowQuality || (isMobile ? 'low' : width < 1200 ? 'medium' : 'high');
    setActiveQuality(initialQuality);

    // 1. Initialize Three.js WebGL Renderer
    let renderer: THREE_TYPES.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: initialQuality !== 'low',
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, initialQuality === 'high' ? 2 : 1.5));
      renderer.setSize(width, height);
      renderer.setClearColor(0x05040a, 1); // Pure deep space background
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      renderer.domElement.setAttribute('data-testid', 'three-intro-canvas');
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      container.appendChild(renderer.domElement);
      if (typeof window !== 'undefined') {
        (window as any).__AANVI_RENDERER = renderer;
      }
    } catch (e) {
      console.warn('WebGL initialization failed, using fallback', e);
      setWebGlSupported(false);
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05040a, 0.032);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 0, 8.2);

    // Soft glow particle texture
    const makeGlowTexture = (size = 64) => {
      const c = document.createElement('canvas');
      c.width = size;
      c.height = size;
      const ctx = c.getContext('2d');
      if (ctx) {
        const half = size / 2;
        const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
        grad.addColorStop(0.5, 'rgba(255, 230, 210, 0.35)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(half, half, half, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(c);
    };

    const glowTex = makeGlowTexture(64);
    const starCrossTex = (() => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.fillRect(30, 8, 4, 48);
        ctx.fillRect(8, 30, 48, 4);
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 16);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(32, 32, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      return new THREE.CanvasTexture(c);
    })();

    // =========================================================================
    // STEP 1: 0.0s - 1.5s Hero Stars (5 Individual Stars Fading In Sequentially)
    // Colors: soft white, warm gold, faint coral, soft purple, blue-white
    // =========================================================================
    const heroStarsConfig = [
      { pos: new THREE.Vector3(-1.8, 1.3, 1.2), color: 0xffffff, start: 0.15, size: 0.28 },
      { pos: new THREE.Vector3(1.6, 0.9, 1.0), color: 0xffd166, start: 0.45, size: 0.26 },
      { pos: new THREE.Vector3(-1.3, -1.1, 0.8), color: 0xff6b57, start: 0.75, size: 0.25 },
      { pos: new THREE.Vector3(1.9, -0.9, 1.1), color: 0x9b6eff, start: 1.05, size: 0.25 },
      { pos: new THREE.Vector3(0.2, 1.7, 0.9), color: 0xe0f2fe, start: 1.30, size: 0.27 },
    ];

    const heroStarGeo = new THREE.PlaneGeometry(1, 1);
    const heroStarMeshes = heroStarsConfig.map((cfg) => {
      const mat = new THREE.MeshBasicMaterial({
        map: starCrossTex,
        color: cfg.color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(heroStarGeo, mat);
      mesh.position.copy(cfg.pos);
      mesh.scale.set(cfg.size, cfg.size, 1);
      scene.add(mesh);
      return { sprite: mesh, mat, cfg };
    });

    // =========================================================================
    // STEP 2: 1.5s - 3.0s Universe Fills (3 Layers of Starfields + Nebula + Shooting Star)
    // Particle count profiles matching A2 spec: ~4000 on desktop, ~1200 on mobile, scaled down for Low
    // =========================================================================
    const getParticleCounts = (mobile: boolean, quality: 'high' | 'medium' | 'low') => {
      if (mobile) {
        if (quality === 'low') {
          return { far: 380, mid: 130, near: 40, swirl: 50 }; // ~600 scaled down for Low
        }
        return { far: 750, mid: 250, near: 80, swirl: 120 }; // ~1200 on mobile
      }
      // Desktop
      if (quality === 'low') {
        return { far: 1000, mid: 350, near: 100, swirl: 150 }; // ~1600 scaled down for Low
      }
      if (quality === 'medium') {
        return { far: 1500, mid: 550, near: 150, swirl: 300 }; // ~2500 for Medium
      }
      return { far: 2400, mid: 850, near: 250, swirl: 500 }; // ~4000 on desktop High (A2 spec)
    };

    const pCounts = getParticleCounts(isMobile, initialQuality);
    const FAR_COUNT = pCounts.far;
    const MID_COUNT = pCounts.mid;
    const NEAR_COUNT = pCounts.near;
    const SWIRL_COUNT = pCounts.swirl;
    const TOTAL_PARTICLES = FAR_COUNT + MID_COUNT + NEAR_COUNT + SWIRL_COUNT;
    setParticleTotal(TOTAL_PARTICLES);

    const farGeo = new THREE.BufferGeometry();
    const farPos = new Float32Array(FAR_COUNT * 3);
    const farCol = new Float32Array(FAR_COUNT * 3);
    for (let i = 0; i < FAR_COUNT; i++) {
      farPos[i * 3] = (Math.random() - 0.5) * 55;
      farPos[i * 3 + 1] = (Math.random() - 0.5) * 35;
      farPos[i * 3 + 2] = -12 - Math.random() * 25;
      const isWarm = Math.random() > 0.6;
      farCol[i * 3] = isWarm ? 1.0 : 0.85;
      farCol[i * 3 + 1] = isWarm ? 0.88 : 0.90;
      farCol[i * 3 + 2] = isWarm ? 0.75 : 1.0;
    }
    farGeo.setAttribute('position', new THREE.BufferAttribute(farPos, 3));
    farGeo.setAttribute('color', new THREE.BufferAttribute(farCol, 3));

    const farMat = new THREE.PointsMaterial({
      size: 0.045,
      map: glowTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const farStarfield = new THREE.Points(farGeo, farMat);
    scene.add(farStarfield);

    // Mid Starfield (Layer 2)
    const midGeo = new THREE.BufferGeometry();
    const midPos = new Float32Array(MID_COUNT * 3);
    for (let i = 0; i < MID_COUNT; i++) {
      midPos[i * 3] = (Math.random() - 0.5) * 26;
      midPos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      midPos[i * 3 + 2] = -2 - Math.random() * 9;
    }
    midGeo.setAttribute('position', new THREE.BufferAttribute(midPos, 3));

    const midMat = new THREE.PointsMaterial({
      size: 0.09,
      map: glowTex,
      color: 0xfff3e0,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const midStarfield = new THREE.Points(midGeo, midMat);
    scene.add(midStarfield);

    // Near Starfield (Layer 3)
    const nearGeo = new THREE.BufferGeometry();
    const nearPos = new Float32Array(NEAR_COUNT * 3);
    const nearVel = new Float32Array(NEAR_COUNT * 3);
    for (let i = 0; i < NEAR_COUNT; i++) {
      nearPos[i * 3] = (Math.random() - 0.5) * 16;
      nearPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      nearPos[i * 3 + 2] = -1 + Math.random() * 8.5;
      nearVel[i * 3 + 2] = 0.8 + Math.random() * 1.5;
    }
    nearGeo.setAttribute('position', new THREE.BufferAttribute(nearPos, 3));

    const nearMat = new THREE.PointsMaterial({
      size: 0.16,
      map: glowTex,
      color: 0xffe2b8,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const nearStarfield = new THREE.Points(nearGeo, nearMat);
    scene.add(nearStarfield);

    // Faint Coral & Purple Nebula Clouds
    const nebulaPlanes: THREE_TYPES.Mesh[] = [];
    const nebulaConfigs = [
      { col: '#FF6B57', pos: new THREE.Vector3(-4.5, 2.5, -6), scale: 9.0, opacity: 0.16 },
      { col: '#7B4BFF', pos: new THREE.Vector3(4.5, -2.0, -5), scale: 10.0, opacity: 0.20 },
      { col: '#9B6EFF', pos: new THREE.Vector3(0, 3.8, -8), scale: 12.0, opacity: 0.14 },
    ];
    nebulaConfigs.forEach((cfg) => {
      const geo = new THREE.PlaneGeometry(cfg.scale, cfg.scale);
      const mat = new THREE.MeshBasicMaterial({
        map: glowTex,
        color: new THREE.Color(cfg.col),
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(cfg.pos);
      scene.add(mesh);
      nebulaPlanes.push(mesh);
    });

    // Shooting Star (Streaks across at t = 2.1s)
    const shootingStarHeadGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const shootingStarHeadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const shootingStarHead = new THREE.Mesh(shootingStarHeadGeo, shootingStarHeadMat);
    shootingStarHead.visible = false;
    scene.add(shootingStarHead);

    const shootingStarTrailGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
    ]);
    const shootingStarTrailMat = new THREE.PointsMaterial({
      color: 0xffd166,
      size: 4,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const shootingStarTrail = new THREE.Points(shootingStarTrailGeo, shootingStarTrailMat);
    scene.add(shootingStarTrail);

    const shootingStarStart = new THREE.Vector3(-7, 5, -2);
    const shootingStarEnd = new THREE.Vector3(8, -1.5, -1);

    // =========================================================================
    // STEP 3: Swirling Energy Inward Particles (t = 3.0s to 4.6s)
    // =========================================================================
    const swirlGeo = new THREE.BufferGeometry();
    const swirlPos = new Float32Array(SWIRL_COUNT * 3);
    const swirlInitAngle = new Float32Array(SWIRL_COUNT);
    const swirlInitRadius = new Float32Array(SWIRL_COUNT);
    for (let i = 0; i < SWIRL_COUNT; i++) {
      swirlInitAngle[i] = Math.random() * Math.PI * 2;
      swirlInitRadius[i] = 1.8 + Math.random() * 4.2;
      swirlPos[i * 3] = Math.cos(swirlInitAngle[i]) * swirlInitRadius[i];
      swirlPos[i * 3 + 1] = Math.sin(swirlInitAngle[i]) * swirlInitRadius[i];
      swirlPos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }
    swirlGeo.setAttribute('position', new THREE.BufferAttribute(swirlPos, 3));
    const swirlMat = new THREE.PointsMaterial({
      size: 0.12,
      map: glowTex,
      color: 0xffd166,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const swirlParticles = new THREE.Points(swirlGeo, swirlMat);
    scene.add(swirlParticles);

    // =========================================================================
    // STEP 4: 3D Aanvi Mascot Logo Elements
    // (Crossing Arrow Antennae, Velvet Body, Glowing Orb, Smile, Happy Eyes, Sparkles)
    // =========================================================================
    const logoGroup = new THREE.Group();
    const mascotGroup = new THREE.Group();
    const SCALE_FACTOR = 0.92;
    mascotGroup.position.set(0, 0.35, 0);

    const bodyShape = createMascotMothBodyShape(THREE);
    const bodyGeo = new THREE.ShapeGeometry(bodyShape);
    const bodyMat = new THREE.MeshBasicMaterial({
      color: 0x18102b,
      transparent: true,
      opacity: 0.0,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.scale.set(SCALE_FACTOR, SCALE_FACTOR, 1.0);
    mascotGroup.add(bodyMesh);

    // 2. Wings / Body Glowing Outline Tube
    const outlineCurve = createMascotOutlineCurve(THREE);
    const outlineGeo = new THREE.TubeGeometry(outlineCurve, 90, 0.034, 12, true);
    // Vertex colors: Coral on left (x < 0) to Purple on right (x > 0)
    const outlinePos = outlineGeo.attributes.position;
    const outlineCols = new Float32Array(outlinePos.count * 3);
    const colCoral = new THREE.Color(0xff6b57);
    const colPurple = new THREE.Color(0x7b4bff);
    for (let i = 0; i < outlinePos.count; i++) {
      const x = outlinePos.getX(i);
      const alpha = THREE.MathUtils.clamp((x + 0.9) / 1.8, 0, 1);
      const c = colCoral.clone().lerp(colPurple, alpha);
      outlineCols[i * 3] = c.r;
      outlineCols[i * 3 + 1] = c.g;
      outlineCols[i * 3 + 2] = c.b;
    }
    outlineGeo.setAttribute('color', new THREE.BufferAttribute(outlineCols, 3));

    const outlineMat = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.0,
    });
    const outlineMesh = new THREE.Mesh(outlineGeo, outlineMat);
    outlineMesh.scale.set(SCALE_FACTOR, SCALE_FACTOR, 1.0);
    outlineMesh.position.set(0, 0, 0.04);
    mascotGroup.add(outlineMesh);

    // 3. Crossing Arrow-Tipped Antennae
    const { left: leftAntCurve, right: rightAntCurve } = createMascotAntennaeCurves(THREE);
    const antGeoLeft = new THREE.TubeGeometry(leftAntCurve, 32, 0.028, 10, false);
    const antGeoRight = new THREE.TubeGeometry(rightAntCurve, 32, 0.028, 10, false);

    const antMatLeft = new THREE.MeshBasicMaterial({
      color: 0xff6b57,
      transparent: true,
      opacity: 0.0,
    });
    const antMatRight = new THREE.MeshBasicMaterial({
      color: 0x7b4bff,
      transparent: true,
      opacity: 0.0,
    });

    const leftAntennaMesh = new THREE.Mesh(antGeoLeft, antMatLeft);
    const rightAntennaMesh = new THREE.Mesh(antGeoRight, antMatRight);
    leftAntennaMesh.scale.set(SCALE_FACTOR, SCALE_FACTOR, 1.0);
    rightAntennaMesh.scale.set(SCALE_FACTOR, SCALE_FACTOR, 1.0);
    mascotGroup.add(leftAntennaMesh, rightAntennaMesh);

    // Antenna Arrowheads (3D Cone Arrows at Tips pointing outward)
    // Left antenna tip at (0.32, 1.44) pointing up-right (~45 deg)
    const arrowGeo = new THREE.SphereGeometry(0.065 * SCALE_FACTOR, 10, 10);
    const leftArrowMesh = new THREE.Mesh(arrowGeo, antMatLeft);
    leftArrowMesh.position.set(0.32 * SCALE_FACTOR, 1.44 * SCALE_FACTOR, 0.02);
    leftArrowMesh.rotation.z = -Math.PI / 4;
    mascotGroup.add(leftArrowMesh);

    // Right antenna tip at (-0.32, 1.44) pointing up-left (~-45 deg)
    const rightArrowMesh = new THREE.Mesh(arrowGeo, antMatRight);
    rightArrowMesh.position.set(-0.32 * SCALE_FACTOR, 1.44 * SCALE_FACTOR, 0.02);
    rightArrowMesh.rotation.z = Math.PI / 4;
    mascotGroup.add(rightArrowMesh);

    // 4. Center Glowing Orange Orb (Picture 1 Expression: Head/Portal)
    const orbGroup = new THREE.Group();
    orbGroup.position.set(0, 0.22 * SCALE_FACTOR, 0.12);

    const orbGeo = new THREE.SphereGeometry(0.18 * SCALE_FACTOR, 32, 32);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0xffb800,
      transparent: true,
      opacity: 0.0,
    });
    const orbMesh = new THREE.Mesh(orbGeo, orbMat);
    orbGroup.add(orbMesh);

    // Orb Torus Rim (Ring)
    const orbRimGeo = new THREE.RingGeometry(0.18 * SCALE_FACTOR, 0.22 * SCALE_FACTOR, 32);
    const orbRimMat = new THREE.MeshBasicMaterial({
      color: 0x241740,
      transparent: true,
      opacity: 0.0,
    });
    const orbRimMesh = new THREE.Mesh(orbRimGeo, orbRimMat);
    orbGroup.add(orbRimMesh);

    // Orb Soft Halo Texture Plane
    const haloGeo = new THREE.PlaneGeometry(1.2 * SCALE_FACTOR, 1.2 * SCALE_FACTOR);
    const haloMat = new THREE.MeshBasicMaterial({
      map: glowTex,
      color: new THREE.Color('#FF9E00'),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0, -0.04);
    orbGroup.add(haloMesh);

    mascotGroup.add(orbGroup);

    // 5. Two Soft Pink Emissive Cheek Dots
    const cheekGeo = new THREE.SphereGeometry(0.08 * SCALE_FACTOR, 20, 20);
    const cheekMat = new THREE.MeshBasicMaterial({
      color: 0xff85a1,
      transparent: true,
      opacity: 0.0,
    });
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMat);
    leftCheek.position.set(-0.38 * SCALE_FACTOR, -0.06 * SCALE_FACTOR, 0.10);
    const rightCheek = new THREE.Mesh(cheekGeo, cheekMat);
    rightCheek.position.set(0.38 * SCALE_FACTOR, -0.06 * SCALE_FACTOR, 0.10);
    mascotGroup.add(leftCheek, rightCheek);

    // 6. Gentle Smile Line
    const smileCurve = createSmileCurve(THREE);
    const smileGeo = new THREE.TubeGeometry(smileCurve, 20, 0.018 * SCALE_FACTOR, 8, false);
    const smileMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FFB800'),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const smileMesh = new THREE.Mesh(smileGeo, smileMat);
    smileMesh.scale.set(SCALE_FACTOR, SCALE_FACTOR, 1.0);
    smileMesh.position.set(0, 0, 0.10);
    mascotGroup.add(smileMesh);

    // 7. Shockwave Ring (Expands at Picture 1 lock-in)
    const ringGeo = new THREE.RingGeometry(0.1, 0.22, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FFF8E7'),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const shockwaveRing = new THREE.Mesh(ringGeo, ringMat);
    shockwaveRing.position.set(0, 0.22 * SCALE_FACTOR, 0.12);
    mascotGroup.add(shockwaveRing);

    // 8. Picture 2: Happy Arched Eyes (^ ^ / ⌒ ⌒) & Antenna Sparkles
    const happyEyesGroup = new THREE.Group();
    const { left: happyLeftCurve, right: happyRightCurve } = createHappyEyesCurves(THREE);
    const happyEyeLeftGeo = new THREE.TubeGeometry(happyLeftCurve, 20, 0.024 * SCALE_FACTOR, 8, false);
    const happyEyeRightGeo = new THREE.TubeGeometry(happyRightCurve, 20, 0.024 * SCALE_FACTOR, 8, false);
    const happyEyeMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FFD166'),
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const happyEyeLeftMesh = new THREE.Mesh(happyEyeLeftGeo, happyEyeMat);
    const happyEyeRightMesh = new THREE.Mesh(happyEyeRightGeo, happyEyeMat);
    happyEyeLeftMesh.scale.set(SCALE_FACTOR, SCALE_FACTOR, 1.0);
    happyEyeRightMesh.scale.set(SCALE_FACTOR, SCALE_FACTOR, 1.0);
    happyEyesGroup.add(happyEyeLeftMesh, happyEyeRightMesh);
    happyEyesGroup.position.set(0, 0, 0.12);
    happyEyesGroup.visible = false;
    mascotGroup.add(happyEyesGroup);

    // 3D Antenna Sparkle Star Crosses (+)
    const sparkleCrossShape = createSparkleCrossShape(THREE);
    const sparkleCrossGeo = new THREE.ShapeGeometry(sparkleCrossShape);
    const sparkleCrossMat = new THREE.MeshBasicMaterial({
      color: 0xffe27a,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const leftSparkle = new THREE.Mesh(sparkleCrossGeo, sparkleCrossMat);
    leftSparkle.position.set(0.38 * SCALE_FACTOR, 1.52 * SCALE_FACTOR, 0.04);
    const rightSparkle = new THREE.Mesh(sparkleCrossGeo, sparkleCrossMat);
    rightSparkle.position.set(-0.38 * SCALE_FACTOR, 1.52 * SCALE_FACTOR, 0.04);
    mascotGroup.add(leftSparkle, rightSparkle);

    logoGroup.add(mascotGroup);

    // =========================================================================
    // STEP 5: 3D Beveled "Aanvi" Letters + Tagline
    // =========================================================================
    const wordmarkGroup = new THREE.Group();
    wordmarkGroup.position.set(0, -0.66, 0.2);

    const letterShapes = createWordmarkLetterShapes(THREE);
    const letterConfigs = [
      { key: 'A', x: -0.62, idx: 0 },
      { key: 'a', x: -0.28, idx: 1 },
      { key: 'n', x: 0.06, idx: 2 },
      { key: 'v', x: 0.38, idx: 3 },
      { key: 'i', x: 0.62, idx: 4 },
      { key: 'i_dot', x: 0.62, idx: 4 },
    ];
    const letterMeshes: THREE_TYPES.Mesh[] = [];

    const letterExtrudeSettings = {
      steps: 1,
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelSegments: 3,
    };

    letterConfigs.forEach(({ key, x, idx }) => {
      const shape = letterShapes[key];
      if (!shape) return;
      const lGeo = new THREE.ExtrudeGeometry(shape, letterExtrudeSettings);
      lGeo.computeBoundingBox();
      const bb = lGeo.boundingBox;
      if (bb) {
        const cx = (bb.max.x + bb.min.x) / 2;
        lGeo.translate(-cx, 0, 0);
      }

      const lMat = new THREE.MeshBasicMaterial({
        color: 0xfaecd8,
        transparent: true,
        opacity: 0.0,
      });

      const lMesh = new THREE.Mesh(lGeo, lMat);
      lMesh.position.set(x, 0, 0);
      lMesh.scale.set(0.72, 0.72, 0.72);
      (lMesh as any).__letterIdx = idx;
      letterMeshes.push(lMesh);
      wordmarkGroup.add(lMesh);
    });
    logoGroup.add(wordmarkGroup);
    scene.add(logoGroup);

    // =========================================================================
    // STEP 6: Animation Timeline Loop (0.0s – 8.2s)
    // =========================================================================
    const TOTAL_DURATION = 8.2;
    const startTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = startTime;
    let lastFrameTimestamp = startTime;
    let accumulatedDeltaMs = 0;
    let accumulatedRenderCostMs = 0;
    let renderFrameCount = 0;
    let lowFpsCounter = 0;

    const animate = (nowTime: number) => {
      if (isCleanedUpRef.current) return;

      const overrideT = typeof window !== 'undefined' ? (window as any).__AANVI_INTRO_T : undefined;
      const elapsed = typeof overrideT === 'number' ? overrideT : (nowTime - startTime) / 1000;
      const t = Math.min(elapsed, TOTAL_DURATION);

      frameCount++;
      const deltaMs = lastFrameTimestamp > 0 ? (nowTime - lastFrameTimestamp) : 16.6;
      lastFrameTimestamp = nowTime;
      accumulatedDeltaMs += deltaMs;

      if (nowTime - lastFpsUpdate >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (nowTime - lastFpsUpdate));
        const avgFrameMs = frameCount > 0 ? (accumulatedDeltaMs / frameCount) : 16.6;
        const avgRenderCost = renderFrameCount > 0 ? (accumulatedRenderCostMs / renderFrameCount) : 0;
        setMeasuredFps(currentFps);
        setAvgFrameTimeMs(avgFrameMs);

        if (typeof window !== 'undefined') {
          (window as any).__AANVI_FRAME_TIME_MS = avgFrameMs;
          (window as any).__AANVI_RENDER_COST_MS = avgRenderCost;
          (window as any).__AANVI_FPS = currentFps;
          (window as any).__AANVI_PARTICLE_COUNT = TOTAL_PARTICLES;
          (window as any).__AANVI_ACTIVE_QUALITY = activeQuality;
        }

        console.log(`[Aanvi 3D Engine] FPS: ${currentFps} (${avgFrameMs.toFixed(2)} ms frame interval, true render cost: ${avgRenderCost.toFixed(2)} ms) | Quality: ${activeQuality} | Particles: ${TOTAL_PARTICLES}`);

        // Auto downgrade if FPS < 45
        if (currentFps < 45 && !qualityOverride) {
          lowFpsCounter++;
          if (lowFpsCounter >= 2 && activeQuality !== 'low') {
            console.warn('[Aanvi 3D Engine] FPS below 45, automatically downgrading quality profile to low');
            setActiveQuality('low');
          }
        } else {
          lowFpsCounter = 0;
        }

        frameCount = 0;
        accumulatedDeltaMs = 0;
        accumulatedRenderCostMs = 0;
        renderFrameCount = 0;
        lastFpsUpdate = nowTime;
      }

      if (onProgressRef.current) {
        onProgressRef.current(t);
      }

      // Check snapshot readiness right before doors open (at t = 7.3s)
      if (t >= 7.3 && !snapshotTakenRef.current && renderer) {
        snapshotTakenRef.current = true;
        try {
          const snapshotUrl = renderer.domElement.toDataURL('image/png');
          if (onSnapshotReadyRef.current) {
            onSnapshotReadyRef.current(snapshotUrl);
          }
        } catch (e) {
          console.warn('Snapshot capture failed', e);
        }
      }

      // -----------------------------------------------------------------------
      // 0.0s – 1.5s: Deep space, black screen, 5 hero stars appear & twinkle
      // -----------------------------------------------------------------------
      if (t < 1.5) {
        camera.position.set(0, 0, 8.2);
        camera.lookAt(0, 0, 0);

        heroStarMeshes.forEach(({ sprite, mat, cfg }) => {
          if (t >= cfg.start) {
            const age = t - cfg.start;
            const fadeIn = Math.min(1.0, age / 0.25);
            const twinkle = 0.8 + 0.3 * Math.sin(age * 16.0);
            mat.opacity = fadeIn * twinkle;
            sprite.scale.set(cfg.size * twinkle, cfg.size * twinkle, 1);
          } else {
            mat.opacity = 0;
          }
        });

        // Rest of universe is dark
        farMat.opacity = 0;
        midMat.opacity = 0;
        nearMat.opacity = 0;
        nebulaPlanes.forEach((n) => ((n.material as THREE_TYPES.MeshBasicMaterial).opacity = 0));
        bodyMat.opacity = 0;
        outlineMat.opacity = 0;
        antMatLeft.opacity = 0;
        antMatRight.opacity = 0;
      }

      // -----------------------------------------------------------------------
      // 1.5s – 3.0s: Universe fills at 3 depth layers, nebula drifts, shooting star
      // -----------------------------------------------------------------------
      else if (t >= 1.5 && t < 3.0) {
        const p = (t - 1.5) / 1.5; // 0 to 1
        camera.position.z = 8.2 - p * 1.6; // 8.2 -> 6.6
        camera.lookAt(0, 0, 0);

        // Starfields fade in
        farMat.opacity = Math.min(0.85, p * 0.85);
        midMat.opacity = Math.min(0.90, p * 0.90);
        nearMat.opacity = Math.min(0.80, p * 0.80);

        // Nebulas drift in
        nebulaPlanes.forEach((n, idx) => {
          const cfg = nebulaConfigs[idx];
          (n.material as THREE_TYPES.MeshBasicMaterial).opacity = p * cfg.opacity;
          n.rotation.z += idx % 2 === 0 ? 0.0006 : -0.0004;
        });

        // Shooting star at t = 2.0s -> 2.6s
        if (t >= 2.0 && t < 2.6) {
          const sp = (t - 2.0) / 0.6;
          shootingStarHead.visible = true;
          shootingStarHead.position.lerpVectors(shootingStarStart, shootingStarEnd, sp);
          const trStart = shootingStarStart.clone().lerp(shootingStarEnd, Math.max(0, sp - 0.25));
          shootingStarTrailGeo.setFromPoints([trStart, shootingStarHead.position.clone()]);
          shootingStarTrailMat.opacity = Math.sin(sp * Math.PI) * 0.95;
        } else {
          shootingStarHead.visible = false;
          shootingStarTrailMat.opacity = 0;
        }
      }

      // -----------------------------------------------------------------------
      // 3.0s – 4.6s: Swirl & gather, crossing arrow antennae & wings/body trace
      // -----------------------------------------------------------------------
      else if (t >= 3.0 && t < 4.6) {
        const p = (t - 3.0) / 1.6; // 0 to 1

        // Camera gentle 30° orbit
        const orbitAngle = Math.sin(p * Math.PI) * 0.52; // ~30 degrees
        camera.position.x = Math.sin(orbitAngle) * 6.2;
        camera.position.z = Math.cos(orbitAngle) * 6.2;
        camera.position.y = Math.sin(p * Math.PI) * 0.25;
        camera.lookAt(0, 0.2, 0);

        // Swirling particles rush inward
        swirlMat.opacity = Math.sin(p * Math.PI) * 0.95;
        const posAttr = swirlGeo.attributes.position as THREE_TYPES.BufferAttribute;
        const pArr = posAttr.array as Float32Array;
        for (let i = 0; i < SWIRL_COUNT; i++) {
          const r = swirlInitRadius[i] * (1.0 - p);
          const a = swirlInitAngle[i] + p * 6.0;
          pArr[i * 3] = Math.cos(a) * r;
          pArr[i * 3 + 1] = Math.sin(a) * r + 0.35;
        }
        posAttr.needsUpdate = true;

        // Crossing-arrow antennae trace first (t = 3.0 -> 3.9)
        const antP = Math.min(1.0, p / 0.6);
        antMatLeft.opacity = antP * 0.95;
        antMatRight.opacity = antP * 0.95;

        // Wings/body outline traces next (t = 3.6 -> 4.6)
        const outlineP = Math.max(0, (p - 0.35) / 0.65);
        outlineMat.opacity = outlineP * 0.95;
        const energyPulse = Math.sin(t * 9.0) * 0.4 + 0.6;
        (outlineMat as any).emissiveIntensity = 0.5 * energyPulse;
      }

      // -----------------------------------------------------------------------
      // 4.6s – 5.6s: Picture 1 Glowing Orb Head, Cheeks, Shockwave Ring, Breathe
      // -----------------------------------------------------------------------
      else if (t >= 4.6 && t < 5.6) {
        const p = (t - 4.6) / 1.0; // 0 to 1

        camera.position.set(0, 0, 5.4);
        camera.lookAt(0, 0, 0);

        swirlMat.opacity = 0;

        // Dark velvet body fills in
        bodyMat.opacity = Math.min(0.92, 0.4 + p * 0.52);
        outlineMat.opacity = 0.95;
        antMatLeft.opacity = 0.95;
        antMatRight.opacity = 0.95;

        // Orb ignites with warm amber glow & halo
        orbGroup.visible = true;
        orbMat.opacity = Math.min(1.0, p * 2.0);
        orbRimMat.opacity = Math.min(1.0, p * 2.0);
        haloMat.opacity = 0.75 + 0.25 * Math.sin(p * Math.PI * 3);

        // Soft pink cheek dots & smile appear
        cheekMat.opacity = Math.min(0.95, p * 2.0);
        smileMat.opacity = Math.min(0.90, p * 2.0);

        // Shockwave ring expansion
        shockwaveRing.visible = true;
        const ringScale = 1.0 + p * 7.5;
        shockwaveRing.scale.set(ringScale, ringScale, 1.0);
        ringMat.opacity = Math.max(0, 1.0 - p * 1.3);

        // Gentle breathing sway in 3D idle
        const breathe = 1.0 + Math.sin((t - 4.6) * 4.0) * 0.018;
        mascotGroup.scale.set(SCALE_FACTOR * breathe, SCALE_FACTOR * breathe, 1.0);
        mascotGroup.position.y = 0.35 + Math.sin((t - 4.6) * 3.0) * 0.015;
      }

      // -----------------------------------------------------------------------
      // 5.6s – 6.4s: Picture 2 Happy Face Morph (^ ^ Eyes, Broad Smile, Sparkles, Bounce)
      // -----------------------------------------------------------------------
      else if (t >= 5.6 && t < 6.4) {
        const p = (t - 5.6) / 0.8; // 0 to 1

        shockwaveRing.visible = false;

        // Orb smoothly fades out; happy eyes fade in
        orbGroup.visible = false;
        happyEyesGroup.visible = true;
        happyEyeMat.opacity = Math.min(1.0, p * 2.5);
        smileMat.opacity = 1.0;
        cheekMat.opacity = 0.95;

        // Subtle happy bounce
        const bounce = Math.sin(p * Math.PI) * 0.08;
        mascotGroup.position.y = 0.35 + bounce;

        // Antenna sparkles twirl and drift
        sparkleCrossMat.opacity = Math.min(1.0, p * 2.0);
        leftSparkle.rotation.z += 0.05;
        rightSparkle.rotation.z -= 0.05;
        leftSparkle.position.y = 1.52 * SCALE_FACTOR + p * 0.06;
        rightSparkle.position.y = 1.52 * SCALE_FACTOR + p * 0.06;
      }

      // -----------------------------------------------------------------------
      // 6.4s – 7.3s: 3D "Aanvi" Letters Rise with Light Sweep
      // -----------------------------------------------------------------------
      else if (t >= 6.4 && t < 7.3) {
        const p = (t - 6.4) / 0.9; // 0 to 1

        camera.position.set(0, 0, 5.4);
        camera.lookAt(0, 0, 0);

        mascotGroup.position.y = 0.35;
        leftSparkle.rotation.z += 0.02;
        rightSparkle.rotation.z -= 0.02;

        // Letters catch light from left to right
        letterMeshes.forEach((mesh) => {
          const idx = (mesh as any).__letterIdx ?? 0;
          const letterStart = idx * 0.16;
          if (p >= letterStart) {
            const lp = Math.min(1.0, (p - letterStart) / 0.22);
            const lMat = mesh.material as any;
            lMat.opacity = lp * 0.95;
            mesh.position.y = (1.0 - lp) * -0.20;
            const gleam = 1.0 - lp;
            if (gleam > 0.05) {
              lMat.color.setRGB(0.98 + 0.02 * gleam, 0.92 + 0.08 * gleam, 0.84 + 0.16 * gleam);
            } else {
              lMat.color.setHex(0xfaecd8);
            }
          }
        });
      }

      // -----------------------------------------------------------------------
      // 7.3s – 8.2s: Doors opening phase signaled to parent
      // -----------------------------------------------------------------------
      else if (t >= 7.3) {
        const p = (t - 7.3) / 0.9;
        const disableAutoFinish = typeof window !== 'undefined' && (window as any).__AANVI_DISABLE_AUTOFINISH;
        if (!disableAutoFinish && t >= TOTAL_DURATION && onCompleteRef.current) {
          onCompleteRef.current();
          return;
        }
      }

      const renderT0 = performance.now();
      renderer.render(scene, camera);
      const renderCostMs = performance.now() - renderT0;

      accumulatedRenderCostMs += renderCostMs;
      renderFrameCount++;

      if (typeof window !== 'undefined') {
        (window as any).__AANVI_LAST_RENDER_COST_MS = renderCostMs;
        (window as any).__AANVI_RENDER_COST_MS = renderFrameCount > 0 ? (accumulatedRenderCostMs / renderFrameCount) : renderCostMs;
      }

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Resource Disposal
    return () => {
      isCleanedUpRef.current = true;
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }

      // Dispose Geometries
      heroStarMeshes.forEach((m) => m.mat.dispose());
      farGeo.dispose();
      midGeo.dispose();
      nearGeo.dispose();
      swirlGeo.dispose();
      bodyGeo.dispose();
      outlineGeo.dispose();
      antGeoLeft.dispose();
      antGeoRight.dispose();
      arrowGeo.dispose();
      orbGeo.dispose();
      orbRimGeo.dispose();
      haloGeo.dispose();
      cheekGeo.dispose();
      smileGeo.dispose();
      shockwaveRing.geometry.dispose();
      happyEyeLeftGeo.dispose();
      happyEyeRightGeo.dispose();
      sparkleCrossGeo.dispose();
      letterMeshes.forEach((m) => m.geometry.dispose());

      // Dispose Materials
      farMat.dispose();
      midMat.dispose();
      nearMat.dispose();
      swirlMat.dispose();
      bodyMat.dispose();
      outlineMat.dispose();
      antMatLeft.dispose();
      antMatRight.dispose();
      orbMat.dispose();
      orbRimMat.dispose();
      haloMat.dispose();
      cheekMat.dispose();
      smileMat.dispose();
      ringMat.dispose();
      happyEyeMat.dispose();
      sparkleCrossMat.dispose();
      letterMeshes.forEach((m) => (m.material as THREE_TYPES.Material).dispose());

      // Dispose Textures
      glowTex.dispose();
      starCrossTex.dispose();

      if (renderer) {
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
        renderer.dispose();
        renderer.forceContextLoss();
        if (typeof window !== 'undefined') {
          (window as any).__AANVI_RENDERER = null;
        }
      }
    };
  }, [qualityOverride]);

  if (!webGlSupported) {
    return (
      <div
        data-testid="intro-webgl-fallback"
        className="absolute inset-0 flex flex-col items-center justify-center bg-[#05040a] select-none"
      >
        <img
          src="/brand/aanvi-logo.svg"
          alt="Aanvi"
          className="w-44 h-44 drop-shadow-[0_0_30px_rgba(255,107,87,0.5)] animate-pulse"
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none">
      <div
        data-testid="fps-badge"
        className="absolute bottom-3 left-4 z-40 text-[10px] font-mono text-white/50 select-none pointer-events-none"
      >
        Aanvi 3D Core • {measuredFps} fps • {avgFrameTimeMs.toFixed(1)} ms • {activeQuality} ({particleTotal} pts)
      </div>
    </div>
  );
}
