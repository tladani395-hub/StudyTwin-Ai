/**
 * Aanvi Logo Mark & Constellation Definition
 * 23-Node 3D Constellation forming the Aanvi Mascot Mark
 */

export interface ConstellationNode {
  id: string;
  pos: [number, number, number]; // [x, y, z]
  color?: string;
  size?: number;
  glow?: boolean;
}

export interface ConstellationEdge {
  from: string;
  to: string;
  color?: string;
  weight?: number;
}

export const LOGO_NODES: ConstellationNode[] = [
  // Apex & Spark
  { id: 'spark', pos: [0.00, 1.20, 0.06], color: '#FFFFFF', size: 0.09, glow: true },
  { id: 'apex', pos: [0.00, 0.85, 0.00], color: '#FFD166', size: 0.07 },

  // Crown / Ears
  { id: 'earL', pos: [-0.30, 0.98, 0.00], color: '#FF6B57', size: 0.06 },
  { id: 'earR', pos: [0.30, 0.98, 0.00], color: '#7B4BFF', size: 0.06 },

  // Head Silhouette
  { id: 'headL', pos: [-0.26, 0.62, 0.00], color: '#FF6B57', size: 0.06 },
  { id: 'headR', pos: [0.26, 0.62, 0.00], color: '#7B4BFF', size: 0.06 },

  // Celestial Eyes (popped forward in Z)
  { id: 'eyeL', pos: [-0.12, 0.55, 0.12], color: '#FFF8E7', size: 0.08, glow: true },
  { id: 'eyeR', pos: [0.12, 0.55, 0.12], color: '#FFF8E7', size: 0.08, glow: true },

  // Beak (popped forward in Z)
  { id: 'beak', pos: [0.00, 0.40, 0.12], color: '#FFB800', size: 0.07 },

  // Chest & Shoulders
  { id: 'chest', pos: [0.00, 0.12, 0.00], color: '#E0B0FF', size: 0.06 },
  { id: 'shL', pos: [-0.45, 0.20, 0.00], color: '#FF6B57', size: 0.06 },
  { id: 'shR', pos: [0.45, 0.20, 0.00], color: '#7B4BFF', size: 0.06 },

  // Crossbar / Wings Mid
  { id: 'cbL', pos: [-0.46, -0.15, 0.00], color: '#FF6B57', size: 0.06 },
  { id: 'cbM', pos: [0.00, -0.15, 0.00], color: '#BA7FFF', size: 0.06 },
  { id: 'cbR', pos: [0.46, -0.15, 0.00], color: '#7B4BFF', size: 0.06 },

  // Lower Wings / Legs
  { id: 'legL', pos: [-0.64, -0.55, 0.00], color: '#FF6B57', size: 0.06 },
  { id: 'legR', pos: [0.64, -0.55, 0.00], color: '#7B4BFF', size: 0.06 },

  // Feet / Talons base (slightly receded in Z)
  { id: 'footL', pos: [-0.80, -0.95, -0.08], color: '#FF6B57', size: 0.06 },
  { id: 'footR', pos: [0.80, -0.95, -0.08], color: '#7B4BFF', size: 0.06 },

  // Toes / Claws
  { id: 'toeLa', pos: [-0.94, -1.00, -0.08], color: '#FF6B57', size: 0.045 },
  { id: 'toeLb', pos: [-0.66, -1.00, -0.08], color: '#FF8A7A', size: 0.045 },
  { id: 'toeRa', pos: [0.66, -1.00, -0.08], color: '#9B6EFF', size: 0.045 },
  { id: 'toeRb', pos: [0.94, -1.00, -0.08], color: '#7B4BFF', size: 0.045 },
];

export const LOGO_EDGES: ConstellationEdge[] = [
  // Crown / Ears & Apex
  { from: 'spark', to: 'apex' },
  { from: 'apex', to: 'earL' },
  { from: 'apex', to: 'earR' },
  { from: 'earL', to: 'headL' },
  { from: 'earR', to: 'headR' },

  // Head / Face / Eyes
  { from: 'headL', to: 'shL' },
  { from: 'headR', to: 'shR' },
  { from: 'headL', to: 'eyeL' },
  { from: 'headR', to: 'eyeR' },
  { from: 'eyeL', to: 'beak' },
  { from: 'eyeR', to: 'beak' },
  { from: 'beak', to: 'chest' },

  // Torso / Crossbar
  { from: 'chest', to: 'cbM' },
  { from: 'shL', to: 'cbL' },
  { from: 'shR', to: 'cbR' },
  { from: 'cbL', to: 'cbM' },
  { from: 'cbR', to: 'cbM' },

  // Wings / Legs
  { from: 'cbL', to: 'legL' },
  { from: 'cbR', to: 'legR' },
  { from: 'legL', to: 'footL' },
  { from: 'legR', to: 'footR' },

  // Claws / Toes
  { from: 'footL', to: 'toeLa' },
  { from: 'footL', to: 'toeLb' },
  { from: 'footR', to: 'toeRa' },
  { from: 'footR', to: 'toeRb' },
];

export const LOGO_NODE_MAP = new Map<string, ConstellationNode>(
  LOGO_NODES.map((n) => [n.id, n])
);

/**
 * Generate 2D projection coordinates for SVG (viewBox 0 0 1000 1000)
 */
export function getNodeSvgCoords(node: ConstellationNode, cx = 500, cy = 480, scale = 360): [number, number] {
  const x = cx + node.pos[0] * scale;
  const y = cy - node.pos[1] * scale; // Invert Y for SVG coordinates
  return [x, y];
}

/**
 * Generate Aanvi Mark Standalone SVG string
 */
export function generateMarkSvg(): string {
  const lines = LOGO_EDGES.map((edge) => {
    const from = LOGO_NODE_MAP.get(edge.from);
    const to = LOGO_NODE_MAP.get(edge.to);
    if (!from || !to) return '';
    const [x1, y1] = getNodeSvgCoords(from);
    const [x2, y2] = getNodeSvgCoords(to);
    const midX = (from.pos[0] + to.pos[0]) / 2;
    const stroke = midX < -0.05 ? '#FF6B57' : midX > 0.05 ? '#7B4BFF' : '#E0B0FF';
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.85" filter="url(#glow)"/>`;
  }).join('\n    ');

  const circles = LOGO_NODES.map((node) => {
    const [x, y] = getNodeSvgCoords(node);
    const r = (node.size || 0.06) * 220;
    const fill = node.color || '#FFFFFF';
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" ${node.glow ? 'filter="url(#strongGlow)"' : ''}/>`;
  }).join('\n    ');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" width="1000" height="1000">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="#1E1435" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#0B0A12" stop-opacity="1"/>
    </radialGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
    <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur1"/>
      <feGaussianBlur stdDeviation="3" result="blur2"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="1000" height="1000" rx="180" fill="url(#bgGlow)"/>
  <g>
    ${lines}
    ${circles}
  </g>
</svg>`;
}

/**
 * Generate Aanvi Lockup (Mark + Typography) SVG string
 */
export function generateLockupSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 400" width="1200" height="400">
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="60%" stop-color="#FFF2E2"/>
      <stop offset="100%" stop-color="#FFD166"/>
    </linearGradient>
    <filter id="lockupGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="1200" height="400" fill="#0B0A12"/>
  <g transform="translate(40, 20) scale(0.36)">
    <!-- Aanvi Constellation Mark Embedded -->
    ${LOGO_EDGES.map((edge) => {
      const from = LOGO_NODE_MAP.get(edge.from);
      const to = LOGO_NODE_MAP.get(edge.to);
      if (!from || !to) return '';
      const [x1, y1] = getNodeSvgCoords(from, 500, 480, 360);
      const [x2, y2] = getNodeSvgCoords(to, 500, 480, 360);
      const midX = (from.pos[0] + to.pos[0]) / 2;
      const stroke = midX < -0.05 ? '#FF6B57' : midX > 0.05 ? '#7B4BFF' : '#E0B0FF';
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="7" stroke-linecap="round"/>`;
    }).join('\n    ')}
    ${LOGO_NODES.map((node) => {
      const [x, y] = getNodeSvgCoords(node, 500, 480, 360);
      const r = (node.size || 0.06) * 240;
      const fill = node.color || '#FFFFFF';
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;
    }).join('\n    ')}
  </g>
  <!-- Typography -->
  <g transform="translate(430, 210)">
    <text font-family="Plus Jakarta Sans, Inter, sans-serif" font-weight="800" font-size="108" fill="url(#textGrad)" letter-spacing="-2">Aanvi</text>
    <text y="48" font-family="Inter, sans-serif" font-weight="600" font-size="22" fill="#BA7FFF" letter-spacing="0.5">SOURCE-GROUNDED ADAPTIVE AI STUDY COMPANION</text>
    <g transform="translate(0, 90)">
      <rect width="130" height="28" rx="14" fill="#FF6B57" fill-opacity="0.18" stroke="#FF6B57" stroke-width="1.5"/>
      <text x="65" y="19" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#FF6B57" text-anchor="middle">EXACT CITATIONS</text>
      
      <rect x="145" width="145" height="28" rx="14" fill="#7B4BFF" fill-opacity="0.18" stroke="#7B4BFF" stroke-width="1.5"/>
      <text x="217" y="19" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#BA7FFF" text-anchor="middle">PREREQUISITE DAGS</text>
      
      <rect x="305" width="115" height="28" rx="14" fill="#FFB800" fill-opacity="0.18" stroke="#FFB800" stroke-width="1.5"/>
      <text x="362" y="19" font-family="JetBrains Mono, monospace" font-size="13" font-weight="700" fill="#FFD166" text-anchor="middle">BKT MASTERY</text>
    </g>
  </g>
</svg>`;
}

/**
 * Generate 2D Vector Path for the monolithic glass "A" silhouette (to be extruded with bevel)
 */
export function createAanviMonogramShape(THREE: any) {
  const shape = new THREE.Shape();
  // Outer silhouette: apex down left wing, claw curve, inner arch, right wing, claw curve, back to apex
  shape.moveTo(0, 0.88);
  shape.quadraticCurveTo(-0.35, 0.70, -0.48, 0.20);
  shape.quadraticCurveTo(-0.55, -0.30, -0.78, -0.92);
  shape.lineTo(-0.58, -0.92);
  shape.quadraticCurveTo(-0.40, -0.35, -0.22, 0.05);
  shape.lineTo(0.22, 0.05);
  shape.quadraticCurveTo(0.40, -0.35, 0.58, -0.92);
  shape.lineTo(0.78, -0.92);
  shape.quadraticCurveTo(0.55, -0.30, 0.48, 0.20);
  shape.quadraticCurveTo(0.35, 0.70, 0, 0.88);

  // Inner cutout hole
  const hole = new THREE.Path();
  hole.moveTo(0, 0.52);
  hole.lineTo(-0.16, 0.16);
  hole.lineTo(0.16, 0.16);
  hole.closePath();
  shape.holes.push(hole);

  return shape;
}

/**
 * Generate 3D letter shapes for 'Aanvi'
 */
export function createWordmarkLetterShapes(THREE: any): Record<string, any> {
  const letters: Record<string, any> = {};

  // Capital 'A': cap height 0.68, baseline 0
  const shapeA = new THREE.Shape();
  shapeA.moveTo(0, 0.68);
  shapeA.lineTo(-0.28, 0);
  shapeA.lineTo(-0.14, 0);
  shapeA.lineTo(-0.07, 0.22);
  shapeA.lineTo(0.07, 0.22);
  shapeA.lineTo(0.14, 0);
  shapeA.lineTo(0.28, 0);
  shapeA.closePath();

  const holeA = new THREE.Path();
  holeA.moveTo(0, 0.50);
  holeA.lineTo(-0.045, 0.32);
  holeA.lineTo(0.045, 0.32);
  holeA.closePath();
  shapeA.holes.push(holeA);
  letters['A'] = shapeA;

  // lowercase 'a': x-height 0.48, baseline 0
  const shape_a = new THREE.Shape();
  shape_a.moveTo(0.16, 0.48);
  shape_a.lineTo(0.16, 0);
  shape_a.lineTo(0.07, 0);
  shape_a.quadraticCurveTo(-0.16, 0, -0.16, 0.22);
  shape_a.quadraticCurveTo(-0.16, 0.48, 0.07, 0.48);
  shape_a.closePath();

  const hole_a = new THREE.Path();
  hole_a.moveTo(0.07, 0.12);
  hole_a.quadraticCurveTo(-0.06, 0.12, -0.06, 0.24);
  hole_a.quadraticCurveTo(-0.06, 0.36, 0.07, 0.36);
  hole_a.lineTo(0.07, 0.12);
  hole_a.closePath();
  shape_a.holes.push(hole_a);
  letters['a'] = shape_a;

  // lowercase 'n': x-height 0.48, baseline 0
  const shape_n = new THREE.Shape();
  shape_n.moveTo(-0.18, 0);
  shape_n.lineTo(-0.18, 0.48);
  shape_n.lineTo(-0.09, 0.48);
  shape_n.lineTo(-0.09, 0.38);
  shape_n.quadraticCurveTo(0.02, 0.50, 0.14, 0.44);
  shape_n.quadraticCurveTo(0.18, 0.38, 0.18, 0.26);
  shape_n.lineTo(0.18, 0);
  shape_n.lineTo(0.09, 0);
  shape_n.lineTo(0.09, 0.26);
  shape_n.quadraticCurveTo(0.09, 0.38, 0.01, 0.38);
  shape_n.quadraticCurveTo(-0.09, 0.38, -0.09, 0.26);
  shape_n.lineTo(-0.09, 0);
  shape_n.closePath();
  letters['n'] = shape_n;

  // lowercase 'v': x-height 0.48, baseline 0
  const shape_v = new THREE.Shape();
  shape_v.moveTo(-0.20, 0.48);
  shape_v.lineTo(-0.04, 0);
  shape_v.lineTo(0.04, 0);
  shape_v.lineTo(0.20, 0.48);
  shape_v.lineTo(0.11, 0.48);
  shape_v.lineTo(0, 0.12);
  shape_v.lineTo(-0.11, 0.48);
  shape_v.closePath();
  letters['v'] = shape_v;

  // lowercase 'i': stem baseline 0 to 0.34
  const shape_i = new THREE.Shape();
  shape_i.moveTo(-0.045, 0);
  shape_i.lineTo(-0.045, 0.34);
  shape_i.lineTo(0.045, 0.34);
  shape_i.lineTo(0.045, 0);
  shape_i.closePath();
  letters['i'] = shape_i;

  // tittle dot for 'i'
  const shape_i_dot = new THREE.Shape();
  shape_i_dot.absarc(0, 0.44, 0.045, 0, Math.PI * 2, false);
  letters['i_dot'] = shape_i_dot;

  return letters;
}

/**
 * =========================================================================
 * PART A5: Real 3D Aanvi Mascot Logo Geometries
 * Winged moth-like body in shield/kite shape, crossed curled antennae,
 * glowing orb, soft pink cheeks, glowing smile, and happy eye arcs
 * =========================================================================
 */

export function createMascotMothBodyShape(THREE: any) {
  const shape = new THREE.Shape();
  // Authentic winged moth-like shield body
  shape.moveTo(0, 0.70);
  shape.bezierCurveTo(-0.20, 0.70, -0.55, 0.55, -0.85, 0.25);
  shape.bezierCurveTo(-1.05, 0.00, -0.95, -0.38, -0.65, -0.62);
  shape.bezierCurveTo(-0.40, -0.78, -0.18, -0.70, 0, -0.52);
  shape.bezierCurveTo(0.18, -0.70, 0.40, -0.78, 0.65, -0.62);
  shape.bezierCurveTo(0.95, -0.38, 1.05, 0.00, 0.85, 0.25);
  shape.bezierCurveTo(0.55, 0.55, 0.20, 0.70, 0, 0.70);
  return shape;
}

export function createMascotOutlineCurve(THREE: any) {
  const points = [
    new THREE.Vector3(0, 0.70, 0),
    new THREE.Vector3(-0.35, 0.66, 0),
    new THREE.Vector3(-0.65, 0.46, 0),
    new THREE.Vector3(-0.85, 0.25, 0),
    new THREE.Vector3(-0.98, -0.05, 0),
    new THREE.Vector3(-0.85, -0.38, 0),
    new THREE.Vector3(-0.65, -0.62, 0),
    new THREE.Vector3(-0.32, -0.72, 0),
    new THREE.Vector3(0, -0.52, 0),
    new THREE.Vector3(0.32, -0.72, 0),
    new THREE.Vector3(0.65, -0.62, 0),
    new THREE.Vector3(0.85, -0.38, 0),
    new THREE.Vector3(0.98, -0.05, 0),
    new THREE.Vector3(0.85, 0.25, 0),
    new THREE.Vector3(0.65, 0.46, 0),
    new THREE.Vector3(0.35, 0.66, 0),
  ];
  return new THREE.CatmullRomCurve3(points, true);
}

export function createMascotAntennaeCurves(THREE: any) {
  // Left antenna: starts on neck left, crosses center, heads up-right toward arrowhead
  const leftPts = [
    new THREE.Vector3(-0.08, 0.70, 0.02),
    new THREE.Vector3(-0.06, 0.88, 0.03),
    new THREE.Vector3(0.00, 1.02, 0.04), // crosses over
    new THREE.Vector3(0.12, 1.18, 0.04),
    new THREE.Vector3(0.24, 1.34, 0.03),
    new THREE.Vector3(0.32, 1.44, 0.02),
  ];

  // Right antenna: starts on neck right, crosses center, heads up-left toward arrowhead
  const rightPts = [
    new THREE.Vector3(0.08, 0.70, 0.01),
    new THREE.Vector3(0.06, 0.88, 0.01),
    new THREE.Vector3(0.00, 1.02, 0.02), // crosses under
    new THREE.Vector3(-0.12, 1.18, 0.02),
    new THREE.Vector3(-0.24, 1.34, 0.03),
    new THREE.Vector3(-0.32, 1.44, 0.02),
  ];

  return {
    left: new THREE.CatmullRomCurve3(leftPts),
    right: new THREE.CatmullRomCurve3(rightPts),
  };
}

export function createSparkleCrossShape(THREE: any) {
  const shape = new THREE.Shape();
  const rOuter = 0.09;
  const rInner = 0.022;
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4;
    const r = i % 2 === 0 ? rOuter : rInner;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

export function createHappyEyesCurves(THREE: any) {
  const leftEyePts = [
    new THREE.Vector3(-0.32, 0.18, 0.10),
    new THREE.Vector3(-0.24, 0.30, 0.10),
    new THREE.Vector3(-0.14, 0.30, 0.10),
    new THREE.Vector3(-0.08, 0.18, 0.10),
  ];
  const rightEyePts = [
    new THREE.Vector3(0.08, 0.18, 0.10),
    new THREE.Vector3(0.14, 0.30, 0.10),
    new THREE.Vector3(0.24, 0.30, 0.10),
    new THREE.Vector3(0.32, 0.18, 0.10),
  ];
  return {
    left: new THREE.CatmullRomCurve3(leftEyePts),
    right: new THREE.CatmullRomCurve3(rightEyePts),
  };
}

export function createSmileCurve(THREE: any) {
  const smilePts = [
    new THREE.Vector3(-0.14, -0.14, 0.10),
    new THREE.Vector3(-0.07, -0.22, 0.10),
    new THREE.Vector3(0.00, -0.25, 0.10),
    new THREE.Vector3(0.07, -0.22, 0.10),
    new THREE.Vector3(0.14, -0.14, 0.10),
  ];
  return new THREE.CatmullRomCurve3(smilePts);
}

