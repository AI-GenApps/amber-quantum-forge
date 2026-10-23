import { afterEach, describe, expect, it, vi } from "vitest";
import { CoachCard } from "../src/overlays/CoachCard";
import { ConfirmSheet } from "../src/overlays/ConfirmSheet";
import { HintSheet } from "../src/overlays/HintSheet";
import { PauseSheet } from "../src/overlays/PauseSheet";
import { UnlockCelebration } from "../src/overlays/UnlockCelebration";
import { WinSheet } from "../src/overlays/WinSheet";
import type { WinSummary } from "../src/state/finish";
import { byText, click, createTestEnv, mountWithEnv, removeAnimate } from "./helpers/env";

afterEach(() => {
  document.body.replaceChildren();
  removeAnimate();
});

const noop = (): void => undefined;

async function show(node: preact.ComponentChild): Promise<HTMLElement> {
  const { env } = await createTestEnv({ fixture: "mid" });
  return (await mountWithEnv(env, node)).container;
}

const summary = (patch: Partial<WinSummary> = {}): WinSummary => ({
  kind: "campaign",
  stars: 2,
  seconds: 95,
  hints: 1,
  tokensGranted: 0,
  tokensCapped: false,
  newBestTime: false,
  streak: null,
  events: [],
  chaptersUnlocked: [],
  chaptersCleared: [],
  nextId: "harbor-02",
  shareText: null,
  ...patch,
});

describe("win sheet", () => {
  it("shows stars, time, hints and the next actions of a campaign solve", async () => {
    const onNext = vi.fn();
    const onReplay = vi.fn();
    const onHome = vi.fn();
    const root = await show(
      <WinSheet
        summary={summary()}
        onNext={onNext}
        onReplay={onReplay}
        onShare={noop}
        onHome={onHome}
      />,
    );
    expect(root.querySelector("[role='img']")?.getAttribute("aria-label")).toBe("2 of 3 stars");
    expect(root.querySelector("[data-testid='win-time']")?.textContent).toBe("Time 1:35");
    expect(root.querySelector("[data-testid='win-hints']")?.textContent).toBe("Hints used: 1");
    expect(byText(root, "button", "Share result")).toBeNull();
    await click(byText(root, "button", "Next puzzle"));
    await click(byText(root, "button", "Replay"));
    await click(byText(root, "button", "Home"));
    expect([onNext, onReplay, onHome].map((fn) => fn.mock.calls.length)).toEqual([1, 1, 1]);
  });

  it("lists the daily events: tokens, streak, freeze, milestone and cleared chapters", async () => {
    const root = await show(
      <WinSheet
        summary={summary({
          kind: "daily",
          stars: 3,
          hints: 0,
          tokensGranted: 4,
          tokensCapped: true,
          newBestTime: true,
          streak: 7,
          nextId: null,
          shareText: "Lantern Loops Daily",
          chaptersCleared: ["harbor"],
          events: [{ kind: "freeze-used" }, { kind: "milestone", days: 7, tokens: 2 }],
        })}
        onNext={noop}
        onReplay={noop}
        onShare={noop}
        onHome={noop}
      />,
    );
    const text = root.textContent ?? "";
    expect(text).toContain("Earned 4 hint tokens");
    expect(text).toContain("Your token jar is full");
    expect(text).toContain("New best time");
    expect(text).toContain("Streak: 7 days");
    expect(text).toContain("Streak freeze used to keep your streak");
    expect(text).toContain("Streak milestone: 7 days, 2 bonus tokens");
    expect(text).toContain("Harbor cleared");
    expect(byText(root, "button", "Next puzzle")).toBeNull();
    expect(byText(root, "button", "Share result")).not.toBeNull();
  });

  it("renders nothing without a summary", async () => {
    const root = await show(
      <WinSheet summary={null} onNext={noop} onReplay={noop} onShare={noop} onHome={noop} />,
    );
    expect(root.querySelector("[role='dialog']")).toBeNull();
  });
});

describe("other overlays", () => {
  it("pause sheet offers five actions and disables restart on an empty board", async () => {
    const calls: string[] = [];
    const root = await show(
      <PauseSheet
        open
        canRestart={false}
        onResume={() => calls.push("resume")}
        onRestart={() => calls.push("restart")}
        onHowTo={() => calls.push("howto")}
        onSettings={() => calls.push("settings")}
        onLeave={() => calls.push("leave")}
      />,
    );
    expect(root.querySelectorAll("[role='dialog'] button")).toHaveLength(5);
    expect((byText(root, "button", "Restart puzzle") as HTMLButtonElement).disabled).toBe(true);
    for (const label of ["Resume", "How to play", "Settings", "Leave puzzle"])
      await click(byText(root, "button", label));
    expect(calls).toEqual(["resume", "howto", "settings", "leave"]);
  });

  it("confirm sheet confirms and cancels", async () => {
    const calls: string[] = [];
    const root = await show(
      <ConfirmSheet
        open
        title="Sure?"
        body="Really?"
        confirmLabel="Do it"
        onConfirm={() => calls.push("yes")}
        onCancel={() => calls.push("no")}
      />,
    );
    await click(byText(root, "button", "Do it"));
    await click(byText(root, "button", "Cancel"));
    expect(calls).toEqual(["yes", "no"]);
  });

  it("hint sheet states the cost and the token count", async () => {
    const root = await show(<HintSheet open tokens={5} onConfirm={noop} onCancel={noop} />);
    expect(root.textContent).toContain("costs 1 token. You have 5.");
    expect(byText(root, "button", "Use hint")).not.toBeNull();
  });

  it("coach card names the mechanic", async () => {
    const bridge = await show(<CoachCard kind="bridge" onDismiss={noop} />);
    expect(bridge.textContent).toContain("Mirrors turn the light");
    document.body.replaceChildren();
    const sky = await show(<CoachCard kind="sky" onDismiss={noop} />);
    expect(sky.textContent).toContain("Gates need a straight tile");
    document.body.replaceChildren();
    const none = await show(<CoachCard kind={null} onDismiss={noop} />);
    expect(none.querySelector("[role='dialog']")).toBeNull();
  });

  it("unlock celebration names each opened chapter", async () => {
    const root = await show(
      <UnlockCelebration chapters={["garden", "bridge"]} onContinue={noop} />,
    );
    expect(root.querySelector("[data-unlocked='garden']")?.textContent).toContain("Garden is open");
    expect(root.querySelector("[data-unlocked='bridge']")?.textContent).toContain("Bridge is open");
    expect(byText(root, "button", "Continue")).not.toBeNull();
  });
});
