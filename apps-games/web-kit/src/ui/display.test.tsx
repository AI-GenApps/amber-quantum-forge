import { afterEach, describe, expect, it } from "vitest";
import { Card, ProgressBar, Screen, StarRating } from "./display";
import { mount } from "./testing";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Screen", () => {
  it("renders a safe-area screen section with its name", async () => {
    const { container } = await mount(
      <Screen name="home" class="extra">
        <p>Hello</p>
      </Screen>,
    );
    const section = container.querySelector("section");
    expect(section?.className).toBe("wg-screen extra");
    expect(section?.getAttribute("data-screen")).toBe("home");
    expect(section?.textContent).toBe("Hello");
  });
});

describe("Card", () => {
  it("renders an optional title and the raised tone", async () => {
    const { container } = await mount(
      <Card title="Daily" tone="raised">
        body
      </Card>,
    );
    expect(container.querySelector(".wg-card")?.classList.contains("wg-card--raised")).toBe(true);
    expect(container.querySelector("h3")?.textContent).toBe("Daily");
    const plain = await mount(<Card>only</Card>);
    expect(plain.container.querySelector("h3")).toBeNull();
  });
});

describe("ProgressBar", () => {
  const bar = (container: HTMLElement) => container.querySelector('[role="progressbar"]');

  it("exposes progressbar semantics and scales the fill", async () => {
    const { container } = await mount(<ProgressBar value={25} label="Level progress" />);
    expect(bar(container)?.getAttribute("aria-valuenow")).toBe("25");
    expect(bar(container)?.getAttribute("aria-valuemax")).toBe("100");
    expect(bar(container)?.getAttribute("aria-label")).toBe("Level progress");
    expect(container.querySelector<HTMLElement>(".wg-progress__fill")?.style.transform).toBe(
      "scaleX(0.25)",
    );
  });

  it("clamps out-of-range and invalid values", async () => {
    const over = await mount(<ProgressBar value={9} max={3} label="x" />);
    expect(bar(over.container)?.getAttribute("aria-valuenow")).toBe("3");
    const under = await mount(<ProgressBar value={-5} label="x" />);
    expect(bar(under.container)?.getAttribute("aria-valuenow")).toBe("0");
    const nan = await mount(<ProgressBar value={Number.NaN} max={0} label="x" />);
    expect(bar(nan.container)?.getAttribute("aria-valuemax")).toBe("1");
    expect(bar(nan.container)?.getAttribute("aria-valuenow")).toBe("0");
  });
});

describe("StarRating", () => {
  const on = (container: HTMLElement) => container.querySelectorAll(".wg-star--on").length;

  it("fills the given number of stars and labels the group", async () => {
    const { container } = await mount(<StarRating value={2} />);
    expect(container.querySelectorAll("svg")).toHaveLength(3);
    expect(on(container)).toBe(2);
    expect(container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(
      "2 of 3 stars",
    );
  });

  it("supports a custom max and label, and clamps", async () => {
    const five = await mount(<StarRating value={9} max={5} label="Best score" />);
    expect(on(five.container)).toBe(5);
    expect(five.container.querySelector('[role="img"]')?.getAttribute("aria-label")).toBe(
      "Best score",
    );
    const none = await mount(<StarRating value={-1} />);
    expect(on(none.container)).toBe(0);
  });

  it("hides decorative svgs from assistive tech", async () => {
    const { container } = await mount(<StarRating value={1} />);
    expect(container.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });
});
