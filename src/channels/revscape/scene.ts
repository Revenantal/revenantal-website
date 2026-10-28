import {
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  HemisphereLight,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  Sphere,
  Vector3,
  WebGLRenderer,
} from "three";
import { pose } from "./camera";
import type { CameraState } from "./camera";
import type { Chunk } from "./world";

/** The picture's size in pixels. The canvas is drawn this small and scaled up, pixelated. */
export const VIEW = { width: 512, height: 384 } as const;

/** Fully clear this far beyond the camera's target; black by `FOG_FAR`. */
const FOG_NEAR = 6;
const FOG_FAR = 10;

/** A running 3D view. */
export type SceneView = {
  /** Draws the town from a camera state. */
  render: (state: CameraState) => void;
  /** What the last frame cost. */
  stats: () => { triangles: number; calls: number };
  /** Frees the GPU memory and the WebGL context. Safe to call twice. */
  dispose: () => void;
};

/**
 * Starts three.js on a canvas: one flat-shaded Lambert material, one mesh per chunk, black
 * fog at the draw distance, and a fixed sun. Named imports only, so the bundle stays small.
 *
 * @param canvas - The canvas to draw on.
 * @param chunks - The world, from `buildWorld`.
 * @param onLost - Called if the browser takes the WebGL context away.
 * @returns The running view.
 * @throws When WebGL is unavailable.
 */
export function createScene(
  canvas: HTMLCanvasElement,
  chunks: readonly Chunk[],
  onLost: () => void,
): SceneView {
  const renderer = new WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(1);
  renderer.setSize(VIEW.width, VIEW.height, false);
  renderer.setClearColor(0x000000, 1);

  const scene = new Scene();
  scene.background = new Color(0x000000);
  scene.fog = new Fog(0x000000, FOG_NEAR, FOG_FAR);
  scene.add(new HemisphereLight(0xdfe8ff, 0x3a3020, 0.9));
  const sun = new DirectionalLight(0xfff2dd, 1.1);
  sun.position.set(-8, 14, 6);
  scene.add(sun);

  const camera = new PerspectiveCamera(46, VIEW.width / VIEW.height, 0.1, 40);
  const material = new MeshLambertMaterial({
    vertexColors: true,
    flatShading: true,
  });
  const geometries = chunks.map((chunk) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(chunk.positions, 3),
    );
    geometry.setAttribute("color", new Float32BufferAttribute(chunk.colors, 3));
    geometry.boundingSphere = new Sphere(
      new Vector3(...chunk.centre),
      chunk.radius,
    );
    scene.add(new Mesh(geometry, material));
    return geometry;
  });

  let lost = false;
  const handleLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    onLost();
  };
  canvas.addEventListener("webglcontextlost", handleLost);

  let disposed = false;
  return {
    render: (state) => {
      if (disposed || lost) return;
      const { position, target } = pose(state);
      camera.position.set(...position);
      camera.lookAt(...target);
      // The fog and far plane follow the camera's distance, so the draw distance is a fixed
      // radius round the target however far the viewer zooms.
      const fog = scene.fog as Fog;
      fog.near = state.dist + FOG_NEAR;
      fog.far = state.dist + FOG_FAR;
      camera.far = fog.far;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    },
    stats: () => ({
      triangles: renderer.info.render.triangles,
      calls: renderer.info.render.calls,
    }),
    dispose: () => {
      if (disposed) return;
      disposed = true;
      canvas.removeEventListener("webglcontextlost", handleLost);
      for (const geometry of geometries) geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
