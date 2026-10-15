import { BASELINE_CAR } from "../../src/index";
import { detCos, detSin } from "../../src/physics/math";

export { BASELINE_CAR };

/** Max absolute error of the deterministic trig against Math.sin/cos over [-20, 20] rad. */
export function detCosSinForTests(): number {
  let worst = 0;
  for (let a = -20; a <= 20; a += 0.013) {
    worst = Math.max(worst, Math.abs(detSin(a) - Math.sin(a)), Math.abs(detCos(a) - Math.cos(a)));
  }
  return worst;
}
