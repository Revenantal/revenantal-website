import type { Material } from "three";
import {
  BufferGeometry,
  Color,
  Group,
  GreaterDepth,
  MeshBasicMaterial,
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
import { FOV, pose } from "./camera";
import type { CameraState } from "./camera";
import { HIP, SHOULDER, buildFigure, buildMarker } from "./figure";
import type { Part } from "./figure";
import type { Chunk } from "./world";

/** The picture's size in pixels. The canvas is drawn this small and scaled up, pixelated. */
export const VIEW = { width: 512, height: 384 } as const;

/** Fully clear this far beyond the camera's target; black by `FOG_FAR`. */
const FOG_NEAR = 6;
const FOG_FAR = 10;

/** What moves: the player and the destination marker, in world units. */
export type Entities = {
  player: {
    x: number;
    y: number;
    z: number;
    facing: number;
    swing: number;
    phase: number;
  };
  marker: { x: number; y: number; z: number } | null;
};

/** A running 3D view. */
export type SceneView = {
  /** Draws the town and what moves in it from a camera state. */
  render: (state: CameraState, entities: Entities) => void;
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

  const camera = new PerspectiveCamera(FOV, VIEW.width / VIEW.height, 0.1, 40);
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

  const geometryOf = (part: Part) => {
    const geometry = new BufferGeometry();
    geometry.setAttribute(
      "position",
      new Float32BufferAttribute(part.positions, 3),
    );
    geometry.setAttribute("color", new Float32BufferAttribute(part.colors, 3));
    geometries.push(geometry);
    return geometry;
  };
  const figure = buildFigure();
  const bodyGeometry = geometryOf(figure.body);
  const legGeometry = geometryOf(figure.leg);
  const armGeometry = geometryOf(figure.arm);
  // One person made of five meshes; the same geometry is drawn twice, solid and, where a
  // building hides them, as a faint see-through shape.
  const makePerson = (shown: Material) => {
    const group = new Group();
    const legs = [-1, 1].map((side) => {
      const mesh = new Mesh(legGeometry, shown);
      mesh.position.set(side * HIP.x, HIP.y, 0);
      return mesh;
    });
    const arms = [-1, 1].map((side) => {
      const mesh = new Mesh(armGeometry, shown);
      mesh.position.set(side * SHOULDER.x, SHOULDER.y, 0);
      return mesh;
    });
    group.add(new Mesh(bodyGeometry, shown), ...legs, ...arms);
    scene.add(group);
    return { group, legs, arms };
  };
  const ghostMaterial = new MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.45,
    depthWrite: false,
    // Only where something nearer is in the way.
    depthFunc: GreaterDepth,
  });
  const people = [makePerson(material), makePerson(ghostMaterial)];
  // The destination X is always drawn on top, even behind a roof.
  const markerMaterial = new MeshBasicMaterial({
    vertexColors: true,
    depthTest: false,
  });
  const marker = new Mesh(geometryOf(buildMarker()), markerMaterial);
  marker.renderOrder = 10;
  marker.visible = false;
  scene.add(marker);

  let lost = false;
  const handleLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    onLost();
  };
  canvas.addEventListener("webglcontextlost", handleLost);

  let disposed = false;
  return {
    render: (state, entities) => {
      if (disposed || lost) return;
      const { player } = entities;
      const swing = Math.sin(player.phase) * 0.8 * player.swing;
      for (const { group, legs, arms } of people) {
        group.position.set(player.x, player.y, player.z);
        group.rotation.y = player.facing;
        // Opposite arms and legs swing together, as in a walk.
        legs[0]?.rotation.set(swing, 0, 0);
        legs[1]?.rotation.set(-swing, 0, 0);
        arms[0]?.rotation.set(-swing, 0, 0);
        arms[1]?.rotation.set(swing, 0, 0);
      }
      marker.visible = entities.marker !== null;
      if (entities.marker)
        marker.position.set(
          entities.marker.x,
          entities.marker.y,
          entities.marker.z,
        );
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
      markerMaterial.dispose();
      ghostMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
