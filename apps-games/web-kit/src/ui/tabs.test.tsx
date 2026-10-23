import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTab, Tabs } from "./tabs";
import { act, mount } from "./testing";

afterEach(() => {
  document.body.innerHTML = "";
});

const tabs = [
  { id: "daily", label: "Daily" },
  { id: "stats", label: "Stats", disabled: true },
  { id: "shop", label: "Shop" },
] as const;

describe("nextTab", () => {
  it("moves between enabled tabs with wrap-around", () => {
    expect(nextTab(tabs, "daily", "ArrowRight")).toBe("shop");
    expect(nextTab(tabs, "shop", "ArrowRight")).toBe("daily");
    expect(nextTab(tabs, "daily", "ArrowLeft")).toBe("shop");
    expect(nextTab(tabs, "shop", "Home")).toBe("daily");
    expect(nextTab(tabs, "daily", "End")).toBe("shop");
    expect(nextTab(tabs, "daily", "a")).toBeUndefined();
    expect(nextTab([], "daily", "Home")).toBeUndefined();
  });
});

describe("Tabs", () => {
  it("renders tab semantics and the selected panel", async () => {
    const { container } = await mount(
      <Tabs tabs={tabs} selected="daily" onChange={() => undefined} label="Sections">
        <p>Daily content</p>
      </Tabs>,
    );
    expect(container.querySelector('[role="tablist"]')?.getAttribute("aria-label")).toBe(
      "Sections",
    );
    const buttons = [...container.querySelectorAll('[role="tab"]')];
    expect(buttons.map((b) => b.getAttribute("aria-selected"))).toEqual(["true", "false", "false"]);
    expect(buttons.map((b) => b.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    expect((buttons[1] as HTMLButtonElement).disabled).toBe(true);
    const panel = container.querySelector('[role="tabpanel"]');
    expect(panel?.textContent).toBe("Daily content");
    expect(panel?.getAttribute("aria-labelledby")).toBe(buttons[0]?.id);
    expect(buttons[0]?.getAttribute("aria-controls")).toBe(panel?.id);
  });

  it("selects on click", async () => {
    const onChange = vi.fn();
    const { container } = await mount(
      <Tabs tabs={tabs} selected="daily" onChange={onChange} label="Sections" />,
    );
    await act(() =>
      (container.querySelectorAll<HTMLElement>('[role="tab"]')[2] as HTMLElement).click(),
    );
    expect(onChange).toHaveBeenCalledWith("shop");
  });

  it("handles arrow keys and skips disabled tabs", async () => {
    const onChange = vi.fn();
    const { container } = await mount(
      <Tabs tabs={tabs} selected="daily" onChange={onChange} label="Sections" />,
    );
    const list = container.querySelector('[role="tablist"]') as HTMLElement;
    await act(() => {
      list.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith("shop");
    await act(() => {
      list.dispatchEvent(new KeyboardEvent("keydown", { key: "x", bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
