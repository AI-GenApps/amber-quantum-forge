// @vitest-environment happy-dom
import { notice } from "@city-drive/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { showSaveNotice } from "../../src/save";

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("showSaveNotice", () => {
  it("shows the message as a non-blocking status and removes it later", () => {
    vi.useFakeTimers();
    const toast = showSaveNotice(document.body, notice("recovered-backup"), 1000);
    expect(toast.getAttribute("role")).toBe("status");
    expect(toast.textContent).toContain("restored an earlier backup");
    expect(toast.dataset.kind).toBe("recovered-backup");
    expect(toast.style.pointerEvents).toBe("none");
    expect(document.body.contains(toast)).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(document.body.contains(toast)).toBe(false);
  });
});
