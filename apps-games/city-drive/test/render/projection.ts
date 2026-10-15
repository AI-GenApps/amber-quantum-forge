import type { Camera } from "@babylonjs/core/Cameras/camera.js";
import { type Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector.js";

export interface ScreenPoint {
  /** Normalised device x: -1 is the left screen edge, +1 the right edge. */
  x: number;
  /** Normalised device y: -1 is the bottom screen edge, +1 the top edge. */
  y: number;
  /** True when the point is in front of the camera (not behind it). */
  ahead: boolean;
}

/** A frozen copy of a camera's view-projection, so later camera moves do not change the answer. */
export interface CameraSnapshot {
  project(point: Vector3): ScreenPoint;
}

export function snapshotCamera(camera: Camera): CameraSnapshot {
  const viewProjection: Matrix = camera
    .getViewMatrix(true)
    .multiply(camera.getProjectionMatrix(true));
  const origin = camera.globalPosition.clone();
  const forward = camera.getDirection(Vector3.Forward(camera.getScene().useRightHandedSystem));
  return {
    project(point) {
      const ndc = Vector3.TransformCoordinates(point, viewProjection);
      return { x: ndc.x, y: ndc.y, ahead: Vector3.Dot(point.subtract(origin), forward) > 0 };
    },
  };
}

export function toScreen(camera: Camera, point: Vector3): ScreenPoint {
  return snapshotCamera(camera).project(point);
}
