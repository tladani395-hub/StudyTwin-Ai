'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { KnowledgeNode, KnowledgeEdge } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { useThemeStore } from '@/stores/useThemeStore';

interface Galaxy3DCanvasProps {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  selectedNode: KnowledgeNode | null;
  onSelectNode: (node: KnowledgeNode) => void;
  className?: string;
}

export default function Galaxy3DCanvas({
  nodes,
  edges,
  selectedNode,
  onSelectNode,
  className = '',
}: Galaxy3DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { mode } = useAuthStore();
  const { palette, theme } = useThemeStore();
  const isExplorer = mode === 'explorer';

  const [hoveredNode, setHoveredNode] = useState<KnowledgeNode | null>(null);

  // References for Three.js state
  const stateRef = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    nodeMeshes: Map<string, THREE.Mesh>;
    nodeData: Map<string, KnowledgeNode>;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    animId: number | null;
    isInteracting: boolean;
    rotY: number;
    rotX: number;
    targetRotY: number;
    targetRotX: number;
    zoom: number;
    targetZoom: number;
    prevMouseX: number;
    prevMouseY: number;
    isDragging: boolean;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    nodeMeshes: new Map(),
    nodeData: new Map(),
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(-999, -999),
    animId: null,
    isInteracting: false,
    rotY: 0,
    rotX: 0.2,
    targetRotY: 0,
    targetRotX: 0.2,
    zoom: 24,
    targetZoom: 24,
    prevMouseX: 0,
    prevMouseY: 0,
    isDragging: false,
  });

  // 3D Node Positions in spherical/celestial coordinates
  const positions3D: Record<string, [number, number, number]> = {
    DSA: [0, 6, 0],
    Arrays: [-8, 2, 4],
    Searching: [-10, -2, 2],
    BinarySearch: [-12, -6, 5],
    Trees: [0, 1, 8],
    BST: [2, -4, 9],
    TreeTraversal: [-3, -7, 10],
    Graphs: [8, 2, -4],
    BFS: [10, -3, -2],
    DFS: [12, -6, -6],
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 26);

    // 2. WebGL Renderer with Anti-aliasing
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch (e) {
      console.warn('WebGL initialization failed, falling back to 2D:', e);
      return;
    }

    stateRef.current.renderer = renderer;
    stateRef.current.scene = scene;
    stateRef.current.camera = camera;

    // 3. Background Starfield (200 particles)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 200;
    const starCoords = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starCoords[i] = (Math.random() - 0.5) * 80;
      starCoords[i + 1] = (Math.random() - 0.5) * 80;
      starCoords[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starCoords, 3));
    const starMat = new THREE.PointsMaterial({
      color: isExplorer ? 0xFFC93C : 0x7B4BFF,
      size: 0.6,
      transparent: true,
      opacity: 0.6,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(isExplorer ? 0xFF6B57 : 0x0E9F6E, 2.5, 50);
    pointLight.position.set(0, 8, 12);
    scene.add(pointLight);

    // 5. Build 3D Concept Spheres / Stars
    const group = new THREE.Group();
    scene.add(group);

    const meshes = new Map<string, THREE.Mesh>();
    const nodeMap = new Map<string, KnowledgeNode>();

    nodes.forEach((n) => {
      const pos = positions3D[n.id] || [(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 12];
      const radius = isExplorer ? 1.4 : 1.1;

      // Color mapping according to mode & mastery
      let nodeColor = 0x64748b;
      let emissiveColor = 0x000000;
      let emissiveIntensity = 0.2;

      if (n.status === 'mastered') {
        nodeColor = isExplorer ? 0xFFB800 : (palette === 'a' ? 0x0E9F6E : 0xF59E0B);
        emissiveColor = nodeColor;
        emissiveIntensity = 0.6;
      } else if (n.status === 'learning') {
        nodeColor = isExplorer ? 0x7B4BFF : (palette === 'a' ? 0x3B82F6 : 0x8B5CF6);
        emissiveColor = nodeColor;
        emissiveIntensity = 0.35;
      } else {
        nodeColor = 0x475569;
        emissiveIntensity = 0.05;
      }

      const geo = new THREE.SphereGeometry(radius, 24, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: nodeColor,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity,
        roughness: 0.3,
        metalness: 0.2,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(pos[0], pos[1], pos[2]);
      mesh.userData = { id: n.id, node: n };

      group.add(mesh);
      meshes.set(n.id, mesh);
      nodeMap.set(n.id, n);
    });

    stateRef.current.nodeMeshes = meshes;
    stateRef.current.nodeData = nodeMap;

    // 6. Prerequisite Line Connectors
    edges.forEach((edge) => {
      const srcPos = positions3D[edge.source];
      const tgtPos = positions3D[edge.target];
      if (!srcPos || !tgtPos) return;

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(srcPos[0], srcPos[1], srcPos[2]),
        new THREE.Vector3(tgtPos[0], tgtPos[1], tgtPos[2]),
      ]);

      const lineMat = new THREE.LineDashedMaterial({
        color: isExplorer ? 0xFF6B57 : 0x38bdf8,
        dashSize: 0.6,
        gapSize: 0.3,
        transparent: true,
        opacity: 0.5,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      group.add(line);
    });

    // 7. Animation Loop (Smooth 60fps Rotation with Tab Visibility Pause)
    let lastTime = 0;
    const animate = (time: number) => {
      stateRef.current.animId = requestAnimationFrame(animate);

      // Pause when hidden
      if (document.hidden) return;

      const dt = (time - lastTime) * 0.001;
      lastTime = time;

      const s = stateRef.current;

      // Orbit Inertia
      if (!s.isDragging) {
        s.targetRotY += 0.002;
      }

      s.rotY += (s.targetRotY - s.rotY) * 0.08;
      s.rotX += (s.targetRotX - s.rotX) * 0.08;
      s.zoom += (s.targetZoom - s.zoom) * 0.1;

      group.rotation.y = s.rotY;
      group.rotation.x = s.rotX;

      camera.position.z = s.zoom;

      // Gentle starfield drift
      starField.rotation.y += 0.0005;

      renderer.render(scene, camera);
    };

    stateRef.current.animId = requestAnimationFrame(animate);

    // Resize Handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (stateRef.current.animId) cancelAnimationFrame(stateRef.current.animId);
      renderer.dispose();
    };
  }, [nodes, edges, isExplorer, palette, theme]);

  // Pointer Interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    stateRef.current.isDragging = true;
    stateRef.current.prevMouseX = e.clientX;
    stateRef.current.prevMouseY = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const s = stateRef.current;
    if (s.isDragging) {
      const deltaX = e.clientX - s.prevMouseX;
      const deltaY = e.clientY - s.prevMouseY;
      s.targetRotY += deltaX * 0.008;
      s.targetRotX += deltaY * 0.008;
      s.prevMouseX = e.clientX;
      s.prevMouseY = e.clientY;
    }

    // Raycast for hover selection
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !s.camera || !s.scene) return;

    s.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    s.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    s.raycaster.setFromCamera(s.mouse, s.camera);
    const intersects = s.raycaster.intersectObjects(Array.from(s.nodeMeshes.values()));

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const node = hit.userData.node as KnowledgeNode;
      if (node) setHoveredNode(node);
    } else {
      setHoveredNode(null);
    }
  };

  const handleMouseUp = () => {
    stateRef.current.isDragging = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    const s = stateRef.current;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect || !s.camera || !s.scene) return;

    s.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    s.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    s.raycaster.setFromCamera(s.mouse, s.camera);
    const intersects = s.raycaster.intersectObjects(Array.from(s.nodeMeshes.values()));

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const node = hit.userData.node as KnowledgeNode;
      if (node) onSelectNode(node);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const s = stateRef.current;
    s.targetZoom = Math.min(Math.max(s.targetZoom + e.deltaY * 0.02, 14), 45);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[450px] select-none rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing bg-gradient-to-b from-[#0B0813] to-[#150F22] border border-[var(--border-subtle)] ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Orbit & View Controls Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 text-xs font-mono bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white/80">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span>{isExplorer ? '🪐 Explorer Planetary Orbit' : '✨ 3D Knowledge Constellation'}</span>
      </div>

      {/* Hover Info Tooltip */}
      {hoveredNode && (
        <div className="absolute bottom-4 left-4 z-10 px-3 py-2 rounded-xl bg-black/70 backdrop-blur-md border border-[var(--primary)] text-white text-xs font-sans shadow-lg pointer-events-none">
          <span className="font-bold block text-[var(--primary)]">{hoveredNode.label}</span>
          <span className="text-[10px] font-mono text-white/70">
            Mastery: {Math.round(hoveredNode.mastery * 100)}% • Click to Inspect
          </span>
        </div>
      )}

      {/* Orbit Tip */}
      <div className="absolute bottom-4 right-4 z-10 text-[10px] font-mono text-white/40 bg-black/30 px-2.5 py-1 rounded-lg">
        Drag to Orbit • Scroll to Zoom
      </div>
    </div>
  );
}
