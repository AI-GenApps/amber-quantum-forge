# City Drive task 00 — research notes

Research gathered 2026-10-15 for the City Drive epic
(`tasks/epics/17-city-drive/`). The knowledge base built from it is
`.agents/games/city-drive/`; the full decision list with rationale is
`.agents/games/city-drive/decisions-log.md`.

Provenance note: these facts were collected during the 2026-10-15 epic research
and recorded in the task file. Task 00 only wrote them down; the install and
rating tiers below are therefore dated 2026-10-15, not re-fetched at task time.

## Competitors (Google Play tiers, 2026-10-15)

| Game | Installs | Rating | Link |
|---|---|---|---|
| Dr. Driving | 500M+ | 4.3 | https://play.google.com/store/apps/details?id=com.ansangha.drdriving |
| Extreme Car Driving Simulator | 500M+ | 4.3 | https://play.google.com/store/apps/details?id=com.aim.racing |
| Car Parking Multiplayer | 100M+ | 4.5 | https://play.google.com/store/apps/details?id=com.olzhas.carparking.multyplayer |
| Drive Zone | 100M+ | 4.5 | https://play.google.com/store/apps/details?id=com.drivezone.car.race.game |
| Taxi Car Simulator: EVO | 10M+ | 4.5 | https://play.google.com/store/apps/details?id=com.ovilex.taxisim2019 |

All of them ship ads and IAP.

## Genre data

- CrazyGames driving genre: about 8.7 minutes average playtime, about 5.7%
  day-1 retention. https://docs.crazygames.com/resources/monetizing-driving/
- Retention drivers: missions/career, car unlocks, customization, daily
  challenges, login streaks.

## Technology facts

| Fact | Source |
|---|---|
| Babylon/Havok has no native vehicle controller (the 9.31.0 tarball has no vehicle code under `Physics/`) | npm tarball inspection, 2026-10-15 research |
| Rapier ships `DynamicRayCastVehicleController` | https://rapier.rs/docs/user_guides/javascript/vehicle_controller |
| Rapier documents cross-platform determinism | https://rapier.rs/docs/user_guides/javascript/determinism |
| Android WebView has no WebGPU, so WebGL2 is the baseline | https://caniuse.com/webgpu (`android` column) |
| Kenney City Kit and Car Kit are CC0 | https://kenney.nl |
| Quaternius moved to the non-CC0 "Quaternius Asset License" on 2026-08-28, so it is excluded | https://quaternius.com/license.html |
| Capacitor 8 requires Node 22+, minSdk 24 / targetSdk 36, iOS 15+ | Capacitor docs, https://capacitorjs.com/docs (task 17 re-verifies) |
