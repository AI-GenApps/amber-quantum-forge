// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { CapacitorBackSource } from "../../src/native/back";
import { DomExitPrompt } from "../../src/native/exitPrompt";
import { FakeApp, FakePrompt, flush, silenceErrors } from "./fakes";

afterEach(() => vi.restoreAllMocks());

async function setup(handled: boolean) {
  const app = new FakeApp();
  const prompt = new FakePrompt();
  const source = new CapacitorBackSource(app, prompt);
  const handler = vi.fn(() => handled);
  const stop = source.onBack(handler);
  await flush();
  return { app, prompt, handler, stop };
}

describe("hardware back button", () => {
  it("lets the game handle back while it can go back", async () => {
    const { app, prompt, handler } = await setup(true);
    app.emit("backButton", { canGoBack: false });
    await flush();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(prompt.asked).toBe(0);
    expect(app.exited).toBe(0);
  });

  it("asks before exiting from the home screen and exits on yes", async () => {
    const { app, prompt } = await setup(false);
    app.emit("backButton");
    await flush();
    expect(prompt.asked).toBe(1);
    expect(app.exited).toBe(0);
    prompt.answer(true);
    await flush();
    expect(app.exited).toBe(1);
  });

  it("stays in the app when the player declines", async () => {
    const { app, prompt } = await setup(false);
    app.emit("backButton");
    await flush();
    prompt.answer(false);
    await flush();
    expect(app.exited).toBe(0);
  });

  it("closes an open prompt on a second back press", async () => {
    const { app, prompt, handler } = await setup(false);
    app.emit("backButton");
    await flush();
    app.emit("backButton");
    await flush();
    expect(prompt.cancelled).toBe(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(app.exited).toBe(0);
  });

  it("stops listening when unbound", async () => {
    const { app, stop } = await setup(true);
    expect(app.count("backButton")).toBe(1);
    stop();
    await flush();
    expect(app.count("backButton")).toBe(0);
  });

  it("logs when exitApp fails", async () => {
    const log = silenceErrors();
    const { app, prompt } = await setup(false);
    app.exitApp = async () => {
      throw new Error("denied");
    };
    app.emit("backButton");
    await flush();
    prompt.answer(true);
    await flush();
    expect(log).toHaveBeenCalled();
  });
});

describe("DomExitPrompt", () => {
  function mount() {
    const host = document.createElement("div");
    document.body.append(host);
    return { host, prompt: new DomExitPrompt(host) };
  }

  it("resolves true on Exit and removes itself", async () => {
    const { host, prompt } = mount();
    const answer = prompt.confirm();
    expect(prompt.isOpen).toBe(true);
    expect(host.querySelector('[role="alertdialog"]')).not.toBeNull();
    const exit = [...host.querySelectorAll("button")].find((b) => b.textContent === "Exit");
    exit?.click();
    await expect(answer).resolves.toBe(true);
    expect(prompt.isOpen).toBe(false);
    expect(host.querySelector('[role="alertdialog"]')).toBeNull();
  });

  it("resolves false on Keep playing and on cancel", async () => {
    const { host, prompt } = mount();
    const first = prompt.confirm();
    host.querySelector<HTMLButtonElement>(".cd-button-primary")?.click();
    await expect(first).resolves.toBe(false);
    const second = prompt.confirm();
    prompt.cancel();
    await expect(second).resolves.toBe(false);
    expect(prompt.isOpen).toBe(false);
  });

  it("reuses the open prompt instead of stacking dialogs", () => {
    const { host, prompt } = mount();
    const a = prompt.confirm();
    const b = prompt.confirm();
    expect(a).toBe(b);
    expect(host.querySelectorAll('[role="alertdialog"]').length).toBe(1);
  });
});
