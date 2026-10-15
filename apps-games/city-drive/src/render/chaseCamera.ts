import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera.js";
import { Vector3 } from "@babylonjs/core/Maths/math.vector.js";
import type { Scene } from "@babylonjs/core/scene.js";
import { raycastBoxes, rotateVec, type StaticBox, type Vec3 } from "@city-drive/core";
import type { CarPose } from "../game/interpolate";
import {
  CHASE,
  chaseFov,
  damp,
  dampVec,
  desiredCameraPosition,
  lookTarget,
  normalize2,
  resolveOcclusion,
} from "./cameraMath";

const FORWARD = { x: 0, y: 0, z: 1 };

/**
 * Smoothed follow camera. The car pose it receives is already interpolated, so the only smoothing
 * here is an exponential follow of the heading, the camera position and the look point (no Babylon
 * FollowCamera, which jitters). Buildings between the car and the camera pull it in.
 */
export class ChaseCamera {
  readonly camera: UniversalCamera;
  private heading = { x: 0, z: 1 };
  private position: Vec3 = { x: 0, y: CHASE.height, z: -CHASE.distance };
  private look: Vec3 = { x: 0, y: 0, z: 0 };
  private fov: number = CHASE.fovBase;
  private placed = false;

  constructor(
    scene: Scene,
    private readonly boxes: readonly StaticBox[],
  ) {
    this.camera = new UniversalCamera("chase", Vector3.Zero(), scene);
    this.camera.inputs.clear();
    this.camera.fov = CHASE.fovBase;
  }

  /** Jump to the ideal position next frame (after a respawn or the first frame). */
  snap(): void {
    this.placed = false;
  }

  update(dt: number, pose: CarPose): void {
    const car = pose.position;
    const forward = rotateVec(pose.rotation, FORWARD);
    const carHeading = normalize2(forward.x, forward.z, this.heading);
    const wantedLook = lookTarget(car, carHeading);
    if (!this.placed) {
      this.heading = carHeading;
      this.position = desiredCameraPosition(car, carHeading, pose.speedKmh);
      this.look = wantedLook;
      this.fov = chaseFov(pose.speedKmh);
      this.placed = true;
    } else {
      this.heading = normalize2(
        damp(this.heading.x, carHeading.x, CHASE.headingRate, dt),
        damp(this.heading.z, carHeading.z, CHASE.headingRate, dt),
        carHeading,
      );
      this.position = dampVec(
        this.position,
        desiredCameraPosition(car, this.heading, pose.speedKmh),
        CHASE.positionRate,
        dt,
      );
      this.look = dampVec(this.look, wantedLook, CHASE.lookRate, dt);
      this.fov = damp(this.fov, chaseFov(pose.speedKmh), CHASE.fovRate, dt);
    }
    const anchor = { x: car.x, y: car.y + CHASE.lookHeight, z: car.z };
    const placed = resolveOcclusion(anchor, this.position, this.occluder(anchor, this.position));
    this.camera.position.set(placed.x, placed.y, placed.z);
    this.camera.setTarget(new Vector3(this.look.x, this.look.y, this.look.z));
    this.camera.fov = this.fov;
  }

  private occluder(anchor: Vec3, to: Vec3): number | undefined {
    const dx = to.x - anchor.x;
    const dy = to.y - anchor.y;
    const dz = to.z - anchor.z;
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (length < 1e-6) return undefined;
    const dir = { x: dx / length, y: dy / length, z: dz / length };
    return raycastBoxes(this.boxes, anchor, dir, length)?.distance;
  }
}
