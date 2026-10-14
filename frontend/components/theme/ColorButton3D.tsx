'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useThemeStore } from '@/stores/useThemeStore';
import { useAuthStore } from '@/stores/useAuthStore';

interface ColorButton3DProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorButton3D({ className = '', size = 'md' }: ColorButton3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { palette, togglePalette, reducedMotion, sound } = useThemeStore();
  const { mode } = useAuthStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Animation and Three.js state references
  const threeRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    meshGroup: THREE.Group | null;
    matLeft: THREE.MeshPhysicalMaterial | null;
    matRight: THREE.MeshPhysicalMaterial | null;
    coreLight: THREE.PointLight | null;
    animFrameId: number | null;
    targetRotX: number;
    targetRotY: number;
    targetScaleY: number;
    targetScaleX: number;
    currentRotX: number;
    currentRotY: number;
    currentScaleY: number;
    currentScaleX: number;
    isAnimating: boolean;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    meshGroup: null,
    matLeft: null,
    matRight: null,
    coreLight: null,
    animFrameId: null,
    targetRotX: 0,
    targetRotY: 0,
    targetScaleY: 1,
    targetScaleX: 1,
    currentRotX: 0,
    currentRotY: 0,
    currentScaleY: 1,
    currentScaleX: 1,
    isAnimating: false,
  });

  // Dimension settings
  const width = size === 'sm' ? 84 : size === 'lg' ? 120 : 100;
  const height = size === 'sm' ? 32 : size === 'lg' ? 44 : 36;

  // Resolve palette hex colors based on current mode & active selection
  const isExplorer = mode === 'explorer';
  const colorA = isExplorer ? '#FF6B57' : '#0E9F6E'; // Coral / Emerald
  const colorB = isExplorer ? '#7B4BFF' : '#F59E0B'; // Purple / Amber
  const primaryColorHex = palette === 'a' ? colorA : colorB;
  const secondaryColorHex = palette === 'a' ? colorB : colorA;

  // Render loop - Runs on-demand when dirty/animating, then sleeps
  const requestRender = useCallback(() => {
    const s = threeRef.current;
    if (!s.renderer || !s.scene || !s.camera || !s.meshGroup) return;

    if (s.isAnimating) return;
    s.isAnimating = true;

    const animate = () => {
      if (!s.renderer || !s.scene || !s.camera || !s.meshGroup) {
        s.isAnimating = false;
        return;
      }

      // Smooth lerping for spring rotation & squish
      s.currentRotX += (s.targetRotX - s.currentRotX) * 0.22;
      s.currentRotY += (s.targetRotY - s.currentRotY) * 0.22;
      s.currentScaleX += (s.targetScaleX - s.currentScaleX) * 0.28;
      s.currentScaleY += (s.targetScaleY - s.currentScaleY) * 0.28;

      s.meshGroup.rotation.x = s.currentRotX;
      s.meshGroup.rotation.y = s.currentRotY;
      s.meshGroup.scale.set(s.currentScaleX, s.currentScaleY, 1);

      s.renderer.render(s.scene, s.camera);

      // Check if settled (epsilon threshold)
      const diffRot = Math.abs(s.targetRotX - s.currentRotX) + Math.abs(s.targetRotY - s.currentRotY);
      const diffScale = Math.abs(s.targetScaleX - s.currentScaleX) + Math.abs(s.targetScaleY - s.currentScaleY);

      if (diffRot > 0.001 || diffScale > 0.001) {
        s.animFrameId = requestAnimationFrame(animate);
      } else {
        s.isAnimating = false;
        s.animFrameId = null;
      }
    };

    s.animFrameId = requestAnimationFrame(animate);
  }, []);

  // Initialize Three.js scene once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 5.2;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      return;
    }

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.0);
    rimLight.position.set(-3, -2, -3);
    scene.add(rimLight);

    const coreLight = new THREE.PointLight(new THREE.Color(primaryColorHex), 1.5, 8);
    coreLight.position.set(0, 0, 2);
    scene.add(coreLight);

    // 3D Dual-Tone Pill Geometry
    const meshGroup = new THREE.Group();

    const matLeft = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(primaryColorHex),
      metalness: 0.1,
      roughness: 0.2,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
      reflectivity: 0.8,
    });

    const matRight = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(secondaryColorHex),
      metalness: 0.1,
      roughness: 0.25,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      reflectivity: 0.6,
    });

    // Left hemisphere / pill cap
    const sphereGeoLeft = new THREE.SphereGeometry(1.0, 24, 16, 0, Math.PI, 0, Math.PI);
    const leftMesh = new THREE.Mesh(sphereGeoLeft, matLeft);
    leftMesh.position.x = -0.7;
    leftMesh.rotation.y = -Math.PI / 2;
    meshGroup.add(leftMesh);

    // Center Left cylinder
    const cylGeoLeft = new THREE.CylinderGeometry(1.0, 1.0, 0.7, 24);
    const cylLeft = new THREE.Mesh(cylGeoLeft, matLeft);
    cylLeft.rotation.z = Math.PI / 2;
    cylLeft.position.x = -0.35;
    meshGroup.add(cylLeft);

    // Center Right cylinder
    const cylGeoRight = new THREE.CylinderGeometry(1.0, 1.0, 0.7, 24);
    const cylRight = new THREE.Mesh(cylGeoRight, matRight);
    cylRight.rotation.z = Math.PI / 2;
    cylRight.position.x = 0.35;
    meshGroup.add(cylRight);

    // Right hemisphere / pill cap
    const sphereGeoRight = new THREE.SphereGeometry(1.0, 24, 16, 0, Math.PI, 0, Math.PI);
    const rightMesh = new THREE.Mesh(sphereGeoRight, matRight);
    rightMesh.position.x = 0.7;
    rightMesh.rotation.y = Math.PI / 2;
    meshGroup.add(rightMesh);

    scene.add(meshGroup);

    threeRef.current = {
      ...threeRef.current,
      renderer,
      scene,
      camera,
      meshGroup,
      matLeft,
      matRight,
      coreLight,
    };

    // First render
    renderer.render(scene, camera);

    return () => {
      if (threeRef.current.animFrameId) {
        cancelAnimationFrame(threeRef.current.animFrameId);
      }
      sphereGeoLeft.dispose();
      sphereGeoRight.dispose();
      cylGeoLeft.dispose();
      cylGeoRight.dispose();
      matLeft.dispose();
      matRight.dispose();
      if (renderer) {
        renderer.dispose();
        renderer.forceContextLoss();
      }
      threeRef.current = {
        renderer: null,
        scene: null,
        camera: null,
        meshGroup: null,
        matLeft: null,
        matRight: null,
        coreLight: null,
        animFrameId: null,
        targetRotX: 0,
        targetRotY: 0,
        targetScaleY: 1,
        targetScaleX: 1,
        currentRotX: 0,
        currentRotY: 0,
        currentScaleY: 1,
        currentScaleX: 1,
        isAnimating: false,
      };
    };
  }, [width, height]);

  // Update Material Colors on Palette / Mode Change
  useEffect(() => {
    const s = threeRef.current;
    if (!s.matLeft || !s.matRight) return;

    s.matLeft.color.set(primaryColorHex);
    s.matRight.color.set(secondaryColorHex);
    if (s.coreLight) s.coreLight.color.set(primaryColorHex);

    // Flip animation on toggle
    if (!reducedMotion) {
      s.currentRotY += Math.PI;
      s.targetRotY = s.currentRotY;
    }
    requestRender();
  }, [primaryColorHex, secondaryColorHex, reducedMotion, requestRender]);

  // Mouse move tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    const s = threeRef.current;
    s.targetRotY = nx * 0.45;
    s.targetRotX = -ny * 0.35;
    requestRender();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (reducedMotion) return;
    const s = threeRef.current;
    s.targetScaleX = 1.06;
    s.targetScaleY = 1.06;
    requestRender();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsPressed(false);
    const s = threeRef.current;
    s.targetRotX = 0;
    s.targetRotY = 0;
    s.targetScaleX = 1;
    s.targetScaleY = 1;
    requestRender();
  };

  const handleMouseDown = () => {
    setIsPressed(true);
    const s = threeRef.current;
    s.targetScaleY = 0.86;
    s.targetScaleX = 1.08;
    requestRender();
  };

  const handleMouseUp = () => {
    setIsPressed(false);
    const s = threeRef.current;
    s.targetScaleY = isHovered ? 1.06 : 1;
    s.targetScaleX = isHovered ? 1.06 : 1;
    requestRender();
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : e.clientX;
    const y = rect ? rect.top + rect.height / 2 : e.clientY;

    togglePalette(x, y);
  };

  const paletteLabel = isExplorer
    ? palette === 'a'
      ? 'Coral'
      : 'Purple'
    : palette === 'a'
    ? 'Emerald'
    : 'Amber';

  return (
    <button
      ref={containerRef as any}
      type="button"
      aria-label={`Toggle color palette. Currently ${paletteLabel}`}
      aria-pressed={palette === 'b'}
      title={`3D Palette Switcher: Active ${paletteLabel}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove as any}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as unknown as React.MouseEvent);
        }
      }}
      className={`relative inline-flex items-center justify-center cursor-pointer select-none rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-app)] transition-transform ${
        isPressed ? 'scale-95' : isHovered ? 'scale-105' : 'scale-100'
      } ${className}`}
      style={{ width, height }}
    >
      {/* Glow aura */}
      <div
        className="absolute inset-0 rounded-full blur-md opacity-40 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${primaryColorHex} 0%, transparent 70%)`,
        }}
      />

      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="relative z-10 w-full h-full pointer-events-none rounded-full"
      />

      {/* Accessible Floating Label */}
      <span className="absolute z-20 pointer-events-none text-[10px] font-mono font-black uppercase text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] tracking-wider">
        {paletteLabel}
      </span>
    </button>
  );
}
