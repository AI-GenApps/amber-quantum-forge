import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Modal, Sheet, Toast, useToast } from "./overlays";
import { act, mount } from "./testing";

afterEach(() => {
  document.body.innerHTML = "";
  vi.useRealTimers();
});

describe("Sheet and Modal", () => {
  it("renders nothing while closed", async () => {
    const { container } = await mount(
      <Sheet open={false} onClose={() => undefined} title="Settings" />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders an accessible dialog labelled by its title and takes focus", async () => {
    const { container } = await mount(
      <Sheet open onClose={() => undefined} title="Settings">
        <p>Body</p>
      </Sheet>,
    );
    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    const heading = container.querySelector("h2") as HTMLElement;
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
    expect(heading.textContent).toBe("Settings");
    expect(container.querySelector(".wg-overlay--sheet")).not.toBeNull();
    expect(document.activeElement).toBe(dialog);
  });

  it("Modal uses the centred variant", async () => {
    const { container } = await mount(<Modal open onClose={() => undefined} title="Quit?" />);
    expect(container.querySelector(".wg-overlay--modal")).not.toBeNull();
  });

  it("closes on Escape and on backdrop tap, but not on dialog tap", async () => {
    const onClose = vi.fn();
    const { container } = await mount(<Sheet open onClose={onClose} title="T" />);
    const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
    await act(() => dialog.click());
    expect(onClose).not.toHaveBeenCalled();
    await act(() => (container.querySelector(".wg-overlay") as HTMLElement).click());
    expect(onClose).toHaveBeenCalledTimes(1);
    await act(() => {
      dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("ignores backdrop taps when dismissOnBackdrop is false", async () => {
    const onClose = vi.fn();
    const { container } = await mount(
      <Sheet open onClose={onClose} title="T" dismissOnBackdrop={false} />,
    );
    await act(() => (container.querySelector(".wg-overlay") as HTMLElement).click());
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("Toast", () => {
  beforeEach(() => vi.useFakeTimers());

  it("announces politely and dismisses after the duration", async () => {
    const onDismiss = vi.fn();
    const { container } = await mount(
      <Toast message="Saved" tone="success" durationMs={1000} onDismiss={onDismiss} />,
    );
    const toast = container.querySelector(".wg-toast") as HTMLElement;
    expect(toast.getAttribute("role")).toBe("status");
    expect(toast.getAttribute("aria-live")).toBe("polite");
    expect(toast.classList.contains("wg-toast--success")).toBe(true);
    expect(toast.textContent).toBe("Saved");
    vi.advanceTimersByTime(999);
    expect(onDismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("stays when durationMs is 0 and clears the timer on unmount", async () => {
    const onDismiss = vi.fn();
    const sticky = await mount(<Toast message="Hold" durationMs={0} onDismiss={onDismiss} />);
    vi.advanceTimersByTime(60000);
    expect(onDismiss).not.toHaveBeenCalled();
    sticky.unmount();
    const timed = await mount(<Toast message="Bye" durationMs={500} onDismiss={onDismiss} />);
    timed.unmount();
    vi.advanceTimersByTime(1000);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("useToast keeps a single slot that show replaces and dismiss clears", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    function Probe() {
      api = useToast();
      return (
        <span>{api.toast ? `${api.toast.id}:${api.toast.tone}:${api.toast.message}` : "none"}</span>
      );
    }
    const { container } = await mount(<Probe />);
    expect(container.textContent).toBe("none");
    await act(() => api?.show("First"));
    expect(container.textContent).toBe("1:info:First");
    await act(() => api?.show("Second", "danger"));
    expect(container.textContent).toBe("2:danger:Second");
    await act(() => api?.dismiss());
    expect(container.textContent).toBe("none");
  });
});
