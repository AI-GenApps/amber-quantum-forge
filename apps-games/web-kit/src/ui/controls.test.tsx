import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, IconButton, Toggle } from "./controls";
import { act, mount } from "./testing";

afterEach(() => {
  document.body.innerHTML = "";
});

describe("Button", () => {
  it("renders a primary button by default and calls onClick", async () => {
    const onClick = vi.fn();
    const { container } = await mount(<Button onClick={onClick}>Play</Button>);
    const button = container.querySelector("button");
    expect(button?.type).toBe("button");
    expect(button?.className).toBe("wg-btn wg-btn--primary");
    await act(() => button?.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant, size and full width classes", async () => {
    const { container } = await mount(
      <Button variant="danger" size="large" fullWidth class="mine">
        Reset
      </Button>,
    );
    expect(container.querySelector("button")?.className).toBe(
      "wg-btn wg-btn--danger wg-btn--large wg-btn--full mine",
    );
  });

  it("does not fire onClick when disabled", async () => {
    const onClick = vi.fn();
    const { container } = await mount(
      <Button disabled onClick={onClick}>
        Locked
      </Button>,
    );
    const button = container.querySelector("button");
    expect(button?.disabled).toBe(true);
    await act(() => button?.click());
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("IconButton", () => {
  it("carries a required accessible name and the icon class", async () => {
    const onClick = vi.fn();
    const { container } = await mount(
      <IconButton label="Settings" onClick={onClick}>
        <svg aria-hidden="true" />
      </IconButton>,
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("aria-label")).toBe("Settings");
    expect(button?.classList.contains("wg-btn--icon")).toBe(true);
    expect(button?.classList.contains("wg-btn--ghost")).toBe(true);
    await act(() => button?.click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Toggle", () => {
  it("is a switch that reports the inverted value", async () => {
    const onChange = vi.fn();
    const { container, update } = await mount(
      <Toggle label="Sound" checked={false} onChange={onChange} />,
    );
    const toggle = container.querySelector('[role="switch"]');
    expect(toggle?.getAttribute("aria-checked")).toBe("false");
    expect(toggle?.textContent).toBe("Sound");
    await act(() => (toggle as HTMLElement).click());
    expect(onChange).toHaveBeenLastCalledWith(true);
    await update(<Toggle label="Sound" checked onChange={onChange} />);
    expect(container.querySelector('[role="switch"]')?.getAttribute("aria-checked")).toBe("true");
    await act(() => (container.querySelector('[role="switch"]') as HTMLElement).click());
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("ignores clicks while disabled", async () => {
    const onChange = vi.fn();
    const { container } = await mount(
      <Toggle label="Music" checked disabled onChange={onChange} />,
    );
    await act(() => (container.querySelector("button") as HTMLElement).click());
    expect(onChange).not.toHaveBeenCalled();
  });
});
