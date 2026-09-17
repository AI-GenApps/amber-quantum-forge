# SnapQuest / Peeklings implementation handoff

SnapQuest and Peeklings are one product. Keep the internal identifier `snapquest`, canonical folder `Apps/SnapQuest/`, source path `apps-native/games/snapquest`, and production technical ID `app.w3dev.snapquest`. **Peeklings** is the current public-title candidate. External registration, publisher ownership and store reservation remain unresolved.

Source provenance is recorded in [snapquest.json](../sources/snapquest.json), including canonical Drive URLs, revision metadata, retrieval hashes, and the retained archive marker. The source bodies used for this reconciliation were read-only local snapshots; builds and tests do not depend on those snapshots or on Drive access. The source set includes the index, PRD, gameplay, technical, economy/operations, validation/delivery, decisions, Apple iOS, Google Play and the retained v0.1 archive. The local manifest uses the successful index ID `15qaZXs1Z1CF2XXTRPtqgTqcat8m9nb`; a stale `TRDR` spelling in an older platform record is retained only as a documented conflict and is not copied into registry validation.

## Ownership and boundaries

| Logical owner | Owns | Required handoff contract |
|---|---|---|
| `snapquest-domain` | `apps-native/games/packages/snapquest_rules` | Versioned quest/completion/reward/album state; one completion key for desk and camera |
| `snapquest-client` | `apps-native/games/snapquest` | Flutter UI, desk path, permission choice, local album and accessibility fallback |
| `snapquest-camera` | `apps-native/games/snapquest/lib/capabilities` | Camera package behind `CameraFrameSource`, bounded frame, local quality status, lifecycle/disposal |
| `snapquest-service` | `/games/snapquest` API integration | App-scoped daily/challenge/entitlement settlement; no raw capture or client `app_id` trust |
| `snapquest-content` | catalog, descriptor fixtures and validator | Descriptor/creature versions, held-out/device evidence, desk equivalents and review records |
| `snapquest-release` | app config, Google Play-first Android QA, privacy, sharing and evidence | Independent version/build, camera permission gate, hardware matrix and feature kill switches |

The pure rules package cannot import Flutter, camera or native SDKs. The camera adapter requests access only on capture, constructs `CameraController` with `enableAudio: false`, streams one frame, downsamples to at most 96×96 RGB bytes, marks Android YUV as luminance-only, and disposes buffers/controller on completion, cancellation, background or exit. No file, network, location, AR, raw-photo log or cloud inference is allowed. The default processor emits no descriptor; physical recognition remains unverified.

## v0.3 selected-MVP correction

The target is an integrated Peeklings candidate with approximately 20 safe descriptor candidates and 30 authored creatures, real local camera validation, equal desk mode, capability fallback, daily hunts, durable album/rewards, friend challenges, private share generation, telemetry and operational controls. Five colors/five creatures and the older ten-descriptor/twelve-creature scope are early fixtures, not caps. Each descriptor is camera-enabled only after held-out labeled tests and device results; optional AR is an isolated experiment and not required. No location tracking, cloud-photo inference, public raw-photo feed, face identification or camera-only premium progress.

## Requirement ledger

`yes` means specified in the current source; `partial` means code or a testable slice exists; `no` means no evidence in this worktree. `enabled` is a release gate, not a debug button.

| ID | Stage and requirement | Contract / acceptance test | Owner | Specified | Implemented | Integrated | Verified | Enabled |
|---|---|---|---|---|---|---|---|---|
| SQ-01 | P0 simulated onboarding and equal mode choice | Quest completes without camera; desk and camera remain available after denial | `snapquest-client` | yes | partial | partial | partial: widget/rules tests | no |
| SQ-02 | P0 bounded descriptor validation | Versioned dataset and accept/retry/uncertain behavior; unsupported semantics stay unverified | `snapquest-content` | yes | partial: descriptor contract | partial | no: calibration absent | no |
| SQ-03 | P0 private local capture | Raw capture is ephemeral/local; close/decline clears it; no hidden upload | `snapquest-camera` | yes | partial: bounded adapter/seam | partial: camera 0.12.1 and native permission integrated | partial: fake lifecycle tests | no |
| SQ-04 | P0/P1 capability fallback | Unsupported, missing model, lighting, inference and AR failures reach desk/non-AR path | `snapquest-client` | yes | partial: unavailable/denial path | partial | partial: rules/widget/capability tests | no |
| SQ-05 | P0 equal collectible progress | Camera/desk use same reward table; switching cannot duplicate grant | `snapquest-domain` | yes | partial | partial | partial: `snapquest_rules_test.dart` | no |
| SQ-06 | P1 daily quest schedule | Quest/date/version stable; clock/offline replay cannot mint daily rewards | `snapquest-service` | yes | no | no | no | no |
| SQ-07 | P1 safe friend challenge | Creator selects approved descriptor; link exposes no photo/location/private account | `snapquest-service` | yes | no | no | no | no |
| SQ-08 | P1 validated descriptor catalogue; v0.3 target is ~20 candidates | Five colors are P0; every additional descriptor needs held-out tests, review and desk equivalent | `snapquest-content` | yes | partial: five fixture IDs | partial | partial: catalog validation; no held-out data | no |
| SQ-09 | P1 authored creature catalogue; v0.3 target is ~30 | Unique IDs/rewards and upgrade-safe album; the early fixture count is not a cap | `snapquest-content` | yes | partial: two fixture creatures | partial | partial: catalog validation | no |
| SQ-10 | Deferred optional AR reveal | Base reward already secured; failed/unsupported AR shows fallback without a second scan | `snapquest-client` | yes | no | no | no | no |
| SQ-11 | P1 creature-only share card | Game-rendered card after preview/explicit share; real-background media deferred | `snapquest-client` | yes | no | no | no | no |
| SQ-12 | P1 privacy and permission controls | Clear captures, disable camera and complete desk quests; retention/deletion tested | `snapquest-camera` | yes | partial: lifecycle/ephemeral model | partial: camera permission integrated | partial: capability tests | no |
| SQ-13 | P1 reliable economy and entitlement recovery | Retry scan/result/purchase callbacks cannot duplicate; offline ledger policy is explicit | `snapquest-service` | yes | no | no | no | no |
| SQ-14 | P1 battery and lifecycle safety | Stop camera/processing on exit/background; degradation preserves desk/rewards | `snapquest-camera` | yes | partial | partial: native dependency integrated | partial: cancellation/background/disposal tests | no |
| SQ-15 | P1 safety and feature kill switches | Descriptor/model/AR can be disabled without losing collectibles or desk play | `snapquest-release` | yes | no | no | no | no |
| SQ-16 | P0/P1 truthful stage and marketing boundaries | Deferred, synthetic and untested outcomes are not advertised as live | `snapquest-release` | yes | partial: local sample label | partial | partial: widget/content checks | no |

## Current evidence and next tests

Current consumers are `apps-native/games/snapquest/lib/snapquest_app.dart` and `apps-native/games/packages/snapquest_rules`. `apps-native/games/snapquest/test/widget_test.dart` covers the desk hunt, wrong-object feedback, next-target reveal, local album restore, corrupt-save recovery, busy capture gating, wrong-descriptor rejection and the captured-frame/unverified-recognition distinction. Direct capability tests cover denial fallback, bounded frame clearing, unknown descriptor behavior, background pause/resume, cancellation and disposal; the plugin adapter has injectable controller tests for cancellation/disposal during initialization. The local entrypoint now uses `path_provider` application documents with a one-time app-scoped migration from the former temporary root; readback is verified before the legacy save is deleted, and failures preserve the source. The app now pins official `camera 0.12.1` in the scoped Pub lock, uses iOS 15/Android API 24 native floors, declares only camera permission, and links `camera_avfoundation` in the unsigned iOS artifact. The final scoped suite has 19 passing tests and `flutter analyze` reports no issues. Android QA accepted the readable 1080×2400 camera, desk-hunt, recovery and relaunch route captures preserved in [the visual review](../visual-review); the camera result remains `frameCaptured=true` with `descriptorId=null`, so no camera-recognition PASS or descriptor calibration is recorded. Current source metadata and exact route/recovery joins are in the visual review and its durable provenance ledger. The lifecycle queue and capture busy guard are covered by the passing suite. The Android Play-first camera check remains an owner gate and no simulator/emulator result is accepted.

Next tests must use the recorded physical device: permission grant/deny/revoke, iOS BGRA and Android YUV paths, orientation, unsupported format, timeout, background/navigation/error disposal, bounded memory, no network/file/log output, held-out descriptor thresholds and p95 latency. Only calibrated descriptors may move to `enabled`.

## Release and unresolved gates

The effective repository sequence is Google Play and Android first, following user steering on 2026-09-17. This supersedes the source records' Apple-first wording for execution while retaining that wording in the source set. Play readiness means the Android artifact, device evidence, listing, privacy declarations, signing and support gates are prepared; it does not mean registration, submission or publication. Store fields, Play publisher ownership, signing, billing, privacy manifests and track configuration are unconfigured. The camera package is an optional SnapQuest-only dependency; no other game may acquire it. Cosmetic price and rewarded-offer limits are hypotheses. Android camera capture and descriptor quality remain unresolved physical gates; the prior iOS signed/install/play baseline is retained, and further iOS QA is paused until after Google Play publication. Enablement requires native permission review, physical hardware evidence, descriptor quality review, service settlement, support ownership and kill switches; submission, spending and production migrations still require explicit approval.
