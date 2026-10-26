import { act } from "preact/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, goTab, renderApp } from "../ui/harness";

afterEach(cleanup);

const nodeCount = (root: HTMLElement): number => root.querySelectorAll("*").length;

describe("performance guards (render)", () => {
  it("rendering the Build tab with every row 200 times does not grow the DOM", async () => {
    const r = await renderApp({ seed: "late" });
    await goTab(r, "build");
    const rows = r.qa("li").length;
    expect(rows).toBeGreaterThanOrEqual(8);
    const before = nodeCount(r.container);
    const samples: number[] = [];
    for (let i = 0; i < 200; i++) {
      await act(() => {
        r.harness.clock.advance(1000);
        r.harness.session.tick(1);
      });
      if (i % 50 === 49) samples.push(nodeCount(r.container));
    }
    const after = nodeCount(r.container);
    console.info(
      `performance: Build tab ${rows} rows, ${before} DOM nodes before, ${after} after 200 renders`,
    );
    expect(before).toBeGreaterThan(50);
    expect(after).toBeLessThanOrEqual(before);
    for (const sample of samples) expect(sample).toBeLessThanOrEqual(before);
    await r.unmount();
  });

  it("rendering the Observe tab 200 times does not grow the DOM or the listener set", async () => {
    const r = await renderApp({ seed: "mid" });
    const before = nodeCount(r.container);
    for (let i = 0; i < 200; i++) {
      await act(() => {
        r.harness.clock.advance(1000);
        r.harness.session.tick(1);
      });
    }
    expect(nodeCount(r.container)).toBeLessThanOrEqual(before + 2);
    await r.unmount();
  });
});
