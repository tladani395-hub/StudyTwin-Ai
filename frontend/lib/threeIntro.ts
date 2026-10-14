/**
 * Minimal Modular Three.js Subset for Aanvi 3D Intro
 * Tree-shaken from three/src directly to stay strictly under the 150 KB gzipped budget.
 */

import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import { Color } from 'three/src/math/Color.js';
import { BufferGeometry } from 'three/src/core/BufferGeometry.js';
import { BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { Points } from 'three/src/objects/Points.js';
import { PointsMaterial } from 'three/src/materials/PointsMaterial.js';
import { CanvasTexture } from 'three/src/textures/CanvasTexture.js';
import { Mesh } from 'three/src/objects/Mesh.js';
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial.js';
import { PlaneGeometry } from 'three/src/geometries/PlaneGeometry.js';
import { SphereGeometry } from 'three/src/geometries/SphereGeometry.js';
import { RingGeometry } from 'three/src/geometries/RingGeometry.js';
import { ShapeGeometry } from 'three/src/geometries/ShapeGeometry.js';
import { ExtrudeGeometry } from 'three/src/geometries/ExtrudeGeometry.js';
import { TubeGeometry } from 'three/src/geometries/TubeGeometry.js';
import { Group } from 'three/src/objects/Group.js';
import { FogExp2 } from 'three/src/scenes/FogExp2.js';
import { AdditiveBlending, DoubleSide, ACESFilmicToneMapping } from 'three/src/constants.js';
import { MathUtils } from 'three/src/math/MathUtils.js';
import { Shape } from 'three/src/extras/core/Shape.js';
import { Path } from 'three/src/extras/core/Path.js';
import { Curve } from 'three/src/extras/core/Curve.js';
import { CatmullRomCurve3 } from 'three/src/extras/curves/CatmullRomCurve3.js';

export {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Vector3,
  Color,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  RingGeometry,
  ShapeGeometry,
  ExtrudeGeometry,
  TubeGeometry,
  Group,
  FogExp2,
  AdditiveBlending,
  DoubleSide,
  ACESFilmicToneMapping,
  MathUtils,
  Shape,
  Path,
  Curve,
  CatmullRomCurve3,
};

export const THREE = {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Vector3,
  Color,
  BufferGeometry,
  BufferAttribute,
  Points,
  PointsMaterial,
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial: MeshBasicMaterial,
  MeshPhysicalMaterial: MeshBasicMaterial,
  PlaneGeometry,
  SphereGeometry,
  RingGeometry,
  ShapeGeometry,
  ExtrudeGeometry,
  TubeGeometry,
  Group,
  FogExp2,
  AdditiveBlending,
  DoubleSide,
  ACESFilmicToneMapping,
  MathUtils,
  Shape,
  Path,
  Curve,
  CatmullRomCurve3,
};

export default THREE;
