---
title: Ludo mobile UI and tutorial slice
description: Evidence-linked plan for the reference-first local Android mobile experience.
---

# Ludo mobile UI and tutorial slice

Status: **Implementation in progress; physical visual acceptance pending.** This
annex records the basic-mobile priority, ordered reference observations, and the
current local flow shape. It does not select a different rules variant, add
monetization, or claim device acceptance, deployment, or store readiness.

## Current scope

The user-directed milestone is a usable mobile-first local slice on the verified
physical Android device. The QA target is Samsung SM-A525F (serial
`RZ8R32EAB7T`), Android 14, native 1080x2400; the Unity project is pinned to
`6000.6.2f1`. These identify the test environment and do not close the visual gate.
Unity 3D remains the implementation technology, with a safe-area-aware portrait
flow and shallow top-down board. Backend, authentication, realtime, provider,
scheduler, ads, upgrades, and store work remain deferred. The public release order
remains iOS first; Android is the current QA surface only.

The reference archive is [the ordered Ludo capture set](../../.agents/resources/2026-09-19/ludo-reference/), with its [89-capture manifest](../../.agents/resources/2026-09-19/ludo-reference/manifest.json) and [study](../../.agents/resources/2026-09-19/ludo-reference/study.md). The links below are evidence, not assets to copy:

| Evidence | What is observed |
|---|---|
| [01 welcome](../../.agents/resources/2026-09-19/ludo-reference/01-home-welcome.png) | Welcome modal with a single Play action over the home surface. |
| [02 tutorial](../../.agents/resources/2026-09-19/ludo-reference/02-after-welcome-play.png) | Dimmed screen, fully visible square board, highlighted route, objective card, Next, and Skip Tutorial. |
| [03 profile](../../.agents/resources/2026-09-19/ludo-reference/03-mode-after-skip.png) | Profile choice modal with Select and Skip. |
| [04](../../.agents/resources/2026-09-19/ludo-reference/04-home-after-profile-skip.png), [05](../../.agents/resources/2026-09-19/ludo-reference/05-home-after-upsell-dismiss.png), [06](../../.agents/resources/2026-09-19/ludo-reference/06-home-clear.png), [07](../../.agents/resources/2026-09-19/ludo-reference/07-home-after-theme-offer.png) | Premium, coin, theme, and clean home states appear in sequence. |
| [08 mode](../../.agents/resources/2026-09-19/ludo-reference/08-computer-mode.png) | Classic and Rush Mode selection; the local slice uses Classic. |
| [09 setup](../../.agents/resources/2026-09-19/ludo-reference/09-computer-player-setup.png) | Token/color selection, two/four-player selection, and Play. |
| [10 game-start offer](../../.agents/resources/2026-09-19/ludo-reference/10-game-start.png) | A rewarded-ad offer/interstitial includes a board inset and “Keep one token out!” copy; this is ad content, not evidence for a core tutorial step. |
| [11](../../.agents/resources/2026-09-19/ludo-reference/11-game-board-before-roll.png), [12](../../.agents/resources/2026-09-19/ludo-reference/12-after-ad-back.png) | An unrelated interstitial remains visible before returning to the game. |
| [13](../../.agents/resources/2026-09-19/ludo-reference/13-ad-after-wait.png), [14](../../.agents/resources/2026-09-19/ludo-reference/14-board-before-roll.png) | Top-down square board, colored yards/home lanes, labels, and compact bottom player strip. |
| [15](../../.agents/resources/2026-09-19/ludo-reference/15-after-first-roll.png), [16](../../.agents/resources/2026-09-19/ludo-reference/16-roll-settled.png), [17](../../.agents/resources/2026-09-19/ludo-reference/17-computer-turn.png), [18](../../.agents/resources/2026-09-19/ludo-reference/18-after-no-move-wait.png), [19](../../.agents/resources/2026-09-19/ludo-reference/19-second-roll-attempt.png), [20](../../.agents/resources/2026-09-19/ludo-reference/20-turn-progress.png), [21](../../.agents/resources/2026-09-19/ludo-reference/21-turn-advance.png), [22](../../.agents/resources/2026-09-19/ludo-reference/22-token-tap-result.png) | Die animation/settled faces and an undo/re-roll affordance with a red `1` badge are visible; exact timing and rules are not established. |

The captures establish visual and interaction references only. They do not silently
change `rules_v1`, safe cells, home rules, turn rules, or the approved board contract.
Do not copy Ludo King logos, mascot art, branded copy, ad creatives, or proprietary
assets. Capture later gameplay evidence before describing a move, capture, win, or
turn-transition behavior as observed.

## Archive coverage

The manifest records 89 sequential PNG captures from the same physical device. It
extends the first 22 board/tutorial observations above with the following evidence:

| Capture range | Evidence recorded | Product treatment |
|---|---|---|
| 01–12 | Welcome and objective tutorial, profile/mode/setup, first-run offers, and game-start ad interruption | Tutorial and setup inform the local flow; offers and ads remain evidence only. |
| 13–52 | Board-before-roll, die and turn states, Computer six/token entry, blue token entry/move, menu, quit confirmation, and banners | Use for composition and touch hierarchy; exact rules remain unproven. |
| 53–65 | Playable-ad webview, Samsung Game Booster Touch Lock, board recovery, menu, and quit probes | System/ad transitions are recorded for diagnosis, not core acceptance. |
| 66–89 | Relaunch offers, Water Sort and diamond ads, Deals & Offers, Settings, tutorial catalog, external YouTube handoff, and persistent No Ads offer | Monetization and replay surfaces are deferred; tutorial replay remains a local requirement. |

The archive gaps are the complete in-game Next sequence, legal multi-space movement,
capture/blockade feedback, confirmed successful exit, individual help videos beyond
the observed YouTube handoff, and Rules content. These gaps must remain labelled as
unknown rather than filled by assumptions.

## Current redesign implementation

The accepted original direction is wired in the local flow scene builder and
controller: [scene builder](../../apps-native/unity/ludo/Assets/Editor/LudoFlowSceneBuilder.cs),
[controller](../../apps-native/unity/ludo/Assets/Scripts/Presentation/LudoFlowController.cs),
and the flow helpers under `Assets/Scripts/Presentation/`. It uses an opaque deep
midnight shield, a subdued blue fabric backdrop, compact bounded aspect-fit hero art,
rounded controls, readable sentence-case hierarchy, and Nunito typography. The
visual system uses `#071A36/#0D2A5A/#143B72` behind ivory board surfaces with ruby,
jade, sun, and azure team colors plus restrained brass trim. The default setup is
Azure/blue You versus Jade/green Computer.

| Asset or surface | Source and dimensions | Consumption path |
|---|---|---|
| Hero pawns and die | Generated `LudoHeroPawns.png`, 1536x1024 RGBA, transparent compact cluster with no board or crown | Bounded aspect-fit image in Welcome and Home hero cards. |
| Flow backdrop | Generated `LudoBackdrop-v2.png`, 1254x1254 RGB, low-contrast midnight cloth | Aspect-preserved crop behind the safe-area flow; never stretched to portrait. |
| Tutorial board and controls | Code-drawn 15x15 classic-cross illustration, rounded nine-slice panels/buttons, chips, toggles, and safe-area container | Runtime/editor helpers; board geometry remains code-owned rather than rasterized. |
| Typography | Official `Nunito[wght].ttf` under SIL Open Font License 1.1 | All generated flow text through `LudoFlowUiAssets.FlowFont()`. |

Prompts, hashes, alpha notes, license provenance, and consumers are recorded in
[ludo_visual_provenance.json](../../apps-native/unity/ludo/Assets/Content/ludo_visual_provenance.json).
The copied visual anchors and the rejected prior composition are in the
[redesign evidence directory](../../.agents/resources/2026-09-20/ludo-redesign/README.md).
The gameplay board/HUD worker still owns the final board camera, board geometry,
and turn presentation; physical classic-cross and layout acceptance remains open.

## Proposed local flow

The first-run route is a small local state machine:

1. `Welcome` presents a single Play action.
2. `Tutorial` presents three local illustrated states: entry on six, travel along a
   highlighted route, and travel into the ivory center. Next and Skip are available;
   completion is persisted and the sequence is replayable from Settings.
3. `Home` presents a clean local hub with Computer and Pass N Play entry points. It
   may use original placeholder art, but it does not offer live ads, upgrades, or
   premium purchases.
4. `ModeSelect` offers Classic for the first slice. Rush Mode remains a reference
   observation and a later mode decision.
5. `PlayerSetup` offers original token/color choices, two/four players, Back, and
   Play. Network matchmaking and account setup are deferred.
6. `GameBoard` presents the local deterministic fixture and touch-driven turn flow.

Every modal blocks controls behind it except its explicit actions. Back, close, Skip,
and Next must have visible touch targets. Tutorial completion is persisted locally,
and Help or Settings can replay the steps without resetting the match fixture.
The local flow has no backend, account, ad, purchase, or live matchmaking dependency.

## Tutorial architecture

Each tutorial step has an identifier, instruction, target region or control, blocking
policy, completion action, and replay eligibility. The presenter owns progression;
the board and setup screens expose only the actions required by the current step.
Spotlights and dimming must preserve contrast and must not hide the target. Reduced
motion uses the same state transitions without relying on animation completion.

Observed steps are the welcome Play transition and objective card with Next/Skip in
[01](../../.agents/resources/2026-09-19/ludo-reference/01-home-welcome.png) and
[02](../../.agents/resources/2026-09-19/ludo-reference/02-after-welcome-play.png).
The local three-state illustration is an original implementation informed by the
archive, not a claim that the reference exposes the same complete sequence. Profile,
mode, setup, Settings replay catalog, and external YouTube handoff are observed
flows; frame 10’s “Keep one token out!” prompt stays in the ad/upgrade evidence
bucket. Do not make the reference undo/re-roll affordance a local acceptance
requirement.

## Board visual and touch gates

The local board must remain Unity 3D while using a shallow orthographic top-down view.
The complete classic-cross board fits inside portrait safe margins with no clipped
edge, token, label, die, or modal. The board target is roughly 92% of the device
width, with opponent/header content above and player/die content below. It includes
high-contrast colored yards, an ivory track, home lanes, central finish geometry,
readable player labels, and spaced tokens informed by [13](../../.agents/resources/2026-09-19/ludo-reference/13-ad-after-wait.png) and [14](../../.agents/resources/2026-09-19/ludo-reference/14-board-before-roll.png).

Interactive controls use at least a 44 dp-equivalent touch target, with a larger
selection affordance for tokens and die actions. User-facing copy removes debug terms
such as “local authority demo” and “roll phase”. The bottom player strip, centered die,
menu affordance, turn emphasis, and legal-token highlight must remain readable at the
smallest supported portrait size. Audio, haptics, and reduced-motion settings remain
available without changing rules.

## Deferred monetization and evidence gates

Frames 04–07 and 10–12 document premium, coin, theme, rewarded-ad, and interstitial
states that the reference app can show. The local slice records those states in the
evidence log but does not call an ad SDK, request a purchase, or imply a No Ads product
entitlement. Original non-purchasable placeholders may be added later only when the
corresponding product decision is approved.

The provisional acceptance matrix is:

| Gate | Evidence or pending result |
|---|---|
| Launch and welcome | [01](../../.agents/resources/2026-09-19/ludo-reference/01-home-welcome.png), then physical Android capture. |
| Tutorial Next, Skip, persistence, replay | [02](../../.agents/resources/2026-09-19/ludo-reference/02-after-welcome-play.png), then implementation evidence. |
| Profile, home, Classic, setup | [03](../../.agents/resources/2026-09-19/ludo-reference/03-mode-after-skip.png), [07](../../.agents/resources/2026-09-19/ludo-reference/07-home-after-theme-offer.png), [08](../../.agents/resources/2026-09-19/ludo-reference/08-computer-mode.png), [09](../../.agents/resources/2026-09-19/ludo-reference/09-computer-player-setup.png). |
| Board-before-roll and die presentation | [14](../../.agents/resources/2026-09-19/ludo-reference/14-board-before-roll.png), [15–17](../../.agents/resources/2026-09-19/ludo-reference/15-after-first-roll.png). |
| Turn/undo observations | [18–22](../../.agents/resources/2026-09-19/ludo-reference/18-after-no-move-wait.png); no undo acceptance requirement. |
| Move, capture, win, restart, and final tutorial replay | Pending physical-device captures; do not infer from the current frames. |

The Android visual gate must report the editor patch, app ID, build artifact, device,
install/launch result, exact fixture, and observed behavior. It is a local visual
acceptance gate and cannot be reported as backend, provider, or release readiness.
The current evidence directory is [ludo-redesign](../../.agents/resources/2026-09-20/ludo-redesign/README.md); it records the reference anchors and explicitly leaves
physical visual acceptance pending because no new device capture is recorded yet.
