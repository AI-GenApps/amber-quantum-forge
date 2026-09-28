/// The home lobby (task 08): the post-onboarding landing screen with four
/// entry cards matching Ludo King's structure per
/// `.agents/resources/2026-09-19/ludo-reference/study.md` — Computer, Pass N
/// Play, Play with Friends, Online.
///
/// Computer and Pass N Play are enabled and route to task 09's mode/setup
/// sheet, then to the game board screen with the chosen local config. Play
/// with Friends and Online (task 26) are enabled once an online client
/// actually resolves — Firebase init succeeded (task 24) and an API base
/// URL is configured (`ludo_online_client.dart`) — and stay visibly and
/// semantically disabled with a "coming soon" badge and no tap action
/// otherwise (a config-absent build): this screen must never let a tap on
/// a disabled tile silently do nothing while looking tappable.
///
/// No King Pass/subscription offer, coin/diamond purchase prompt, or ad of
/// any kind appears here, matching task 07's product decision.
library;

import 'dart:async' show unawaited;

import 'package:flutter/foundation.dart' show kDebugMode;
import 'package:flutter/material.dart';
import 'package:ludo_rules/ludo_rules.dart' show LudoColor, LudoRuleset;

import '../app.dart' show ludoIdentity;
import '../assets/ludo_art_manifest.dart' show LudoArtManifest, LudoArtSlot;
import '../net/ludo_deep_link_router.dart' show LudoDeepLinkRouter;
import '../net/ludo_engine_state_codec.dart'
    show ludoEngineStateFromWire, ludoSubjectIsBot;
import '../net/ludo_match_models.dart' as ludo_wire;
import '../net/ludo_match_state_source.dart'
    show LudoOnlineMatchSession, createLudoMatchStateSource;
import '../net/ludo_online_client.dart';
import '../net/ludo_online_controller.dart';
import '../net/ludo_online_preview_mode.dart' show LudoOnlinePreviewMode;
import '../net/ludo_preview_online.dart' show createLudoPreviewOnlineClient;
import '../net/ludo_wire_json.dart' show LudoApiException;
import '../state/ludo_local_save.dart';
import '../state/ludo_profile_settings.dart';
import '../state/ludo_sound_settings.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_3d_button.dart' show Ludo3dButton;
import '../widgets/ludo_avatar.dart'
    show LudoAvatarMotif, LudoAvatarView, ludoAvatars;
import '../widgets/ludo_dialog_frame.dart';
import '../widgets/ludo_panel.dart';
import 'game_board_screen.dart';
import 'matchmaking_search_screen.dart';
import 'mode_setup_sheet.dart';

const _minTapTarget = 48.0;

/// Builds the seat identities a freshly-started local match shows on its
/// player panels: seat 0 is always "You" (the local human), a bot seat is
/// labeled "Bot N", and any other human seat (Pass N Play) is labeled
/// "Player N". Real onboarding-profile name/avatar wiring for seat 0 is a
/// later task's concern (this screen has no profile dependency).
List<LudoSeatIdentity> _defaultSeatIdentities(LudoLocalMatchConfig config) {
  return [
    for (var seat = 0; seat < config.seats.length; seat++)
      LudoSeatIdentity(
        name: seat == 0
            ? 'You'
            : (config.seats[seat].isBot ? 'Bot $seat' : 'Player ${seat + 1}'),
        avatarId: _avatarIdForColor(config.seats[seat].color),
      ),
  ];
}

/// The stable "-face" avatar id for [color] (always present — every
/// [LudoColor] has both a face and spark motif in [ludoAvatars]).
String _avatarIdForColor(LudoColor color) => ludoAvatars
    .firstWhere(
      (avatar) => avatar.color == color && avatar.motif == LudoAvatarMotif.face,
    )
    .id;

/// Opens [ModeSetupSheet] for [isComputerMatch] and, once a config is
/// chosen, pushes [GameBoardScreen] with it. A cancelled sheet (`null`
/// result) navigates nowhere.
Future<void> startLudoLocalMatch(
  BuildContext context, {
  required bool isComputerMatch,
  LudoTelemetry? telemetry,
  int? diceSeed,
}) async {
  final config = await ModeSetupSheet.show(
    context,
    isComputerMatch: isComputerMatch,
  );
  if (config == null || !context.mounted) return;
  (telemetry ?? LudoTelemetry()).matchStarted(
    variant: config.isComputerMatch
        ? LudoMatchVariant.vsComputer
        : LudoMatchVariant.passAndPlay,
    ruleset: config.ruleset.id,
    seatCount: config.playerCount,
  );
  await Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => GameBoardScreen(
        config: config,
        seatIdentities: _defaultSeatIdentities(config),
        soundSettings: LudoSoundSettings(),
        telemetry: telemetry,
        diceSeed: diceSeed,
      ),
    ),
  );
}

/// Builds the [LudoLocalMatchConfig]/seat-identity list [GameBoardScreen]
/// needs from an online match's wire state — the online counterpart of
/// [_defaultSeatIdentities], labeling [localSeat] "You", every other
/// server-assigned bot seat (`ludoSubjectIsBot`) "Bot N", and every other
/// human seat "Player N" (no display name is available client-side beyond
/// what the server's `subject` — a bare Firebase UID or `bot:<uuid>` —
/// carries, matching this task's "no PII beyond seat/subject hashes"
/// telemetry constraint for the match itself).
(LudoLocalMatchConfig, List<LudoSeatIdentity>) _onlineConfigAndIdentities({
  required ludo_wire.LudoMatchState wire,
  required int localSeat,
}) {
  final ruleset = LudoRuleset.byId[wire.mode.toWire()]!;
  final seats = <LudoSeatConfig>[];
  final identities = <LudoSeatIdentity>[];
  for (final player in wire.players) {
    final isBot = ludoSubjectIsBot(player.subject);
    final color = LudoColor.values.byName(player.color.toWire());
    seats.add(
      LudoSeatConfig(
        color: color,
        isBot: isBot,
        botDifficulty: isBot ? 'medium' : null,
      ),
    );
    identities.add(
      LudoSeatIdentity(
        name: player.seat == localSeat
            ? 'You'
            : (isBot ? 'Bot ${player.seat + 1}' : 'Player ${player.seat + 1}'),
        avatarId: _avatarIdForColor(color),
      ),
    );
  }
  return (
    LudoLocalMatchConfig(
      ruleset: ruleset,
      seats: seats,
      isComputerMatch: seats.any((seat) => seat.isBot),
    ),
    identities,
  );
}

/// Pushes [GameBoardScreen] for a ready online match, recording the
/// online-mode `ludo_match_started` variant first (task 26).
Future<void> _launchOnlineMatch(
  BuildContext context, {
  required LudoOnlineClient onlineClient,
  required LudoOnlineMatchReadyResult ready,
  required LudoMatchVariant variant,
  LudoTelemetry? telemetry,
}) async {
  if (!context.mounted) return;
  final (config, identities) = _onlineConfigAndIdentities(
    wire: ready.wireMatchState,
    localSeat: ready.localSeat,
  );
  final effectiveTelemetry =
      telemetry ?? onlineClient.onlineController.telemetry;
  effectiveTelemetry.matchStarted(
    variant: variant,
    ruleset: config.ruleset.id,
    seatCount: config.playerCount,
  );
  final stateSource = createLudoMatchStateSource(
    gateway: onlineClient.gateway,
    appId: ludoIdentity.stableId,
    environment: ready.wireMatchState.environment,
    matchId: ready.matchId,
    gameToken: ready.gameToken,
  );
  final onlineMatch = LudoOnlineMatchSession(
    gateway: onlineClient.gateway,
    matchId: ready.matchId,
    gameToken: ready.gameToken,
    localSeat: ready.localSeat,
    stateSource: stateSource,
  );
  await Navigator.of(context).push(
    MaterialPageRoute<void>(
      builder: (_) => GameBoardScreen(
        config: config,
        seatIdentities: identities,
        soundSettings: LudoSoundSettings(),
        initialState: ludoEngineStateFromWire(ready.wireMatchState),
        telemetry: effectiveTelemetry,
        onlineMatch: onlineMatch,
        onlineVariant: variant,
      ),
    ),
  );
}

/// Drives the "Play with Friends" tile: create-room or join-room, then
/// (for create) waits for a friend to fill the room before launching the
/// board, or (for join) launches immediately — a join always completes the
/// room.
Future<void> startLudoOnlineFriendsFlow(
  BuildContext context, {
  required LudoOnlineClient onlineClient,
  LudoTelemetry? telemetry,

  /// Test seam: overrides the native share-sheet call. `null` (the
  /// default) in production, where it calls `Share.share`. Overridden in
  /// tests (never a real platform channel, which doesn't exist in a
  /// `flutter test` host process).
  Future<void> Function(String inviteLink)? shareInviteLink,

  /// Pre-fills the Join tab with a room code and opens on it directly —
  /// set by a routed invite link (task 26x's `ludo_deep_link_router.dart`).
  /// `null` (the default) opens on the Create tab as before.
  String? initialJoinCode,
}) async {
  final choice = await FriendsSetupSheet.show(
    context,
    initialJoinCode: initialJoinCode,
  );
  if (choice == null || !context.mounted) return;
  switch (choice) {
    case LudoFriendsCreateChoice(:final mode, :final seatTarget):
      final created = await onlineClient.onlineController.createRoom(
        mode: mode,
        seatTarget: seatTarget,
      );
      if (!context.mounted) return;
      final wait = onlineClient.onlineController.awaitRoomFilled(
        roomCode: created.roomCode,
      );
      // Task 26x: the room code is shown on-screen with its own copy/share
      // affordances (`MatchmakingSearchScreen`'s `_RoomCodeChip`) instead
      // of blindly firing the native share sheet the moment the room is
      // created — the player decides whether/how to share it.
      final ready = await MatchmakingSearchScreen.show(
        context,
        wait,
        title: 'Waiting for a friend...',
        roomCode: created.roomCode,
        inviteLink: created.inviteLink,
        shareInviteLink: shareInviteLink,
      );
      if (ready == null || !context.mounted) return;
      await _launchOnlineMatch(
        context,
        onlineClient: onlineClient,
        ready: ready,
        variant: LudoMatchVariant.room,
        telemetry: telemetry,
      );
    case LudoFriendsJoinChoice(:final roomCode):
      final LudoOnlineMatchReadyResult ready;
      try {
        ready = await onlineClient.onlineController.joinRoom(
          roomCode: roomCode,
        );
      } on Object catch (error) {
        if (!context.mounted) return;
        await _showRoomJoinError(context, error);
        return;
      }
      if (!context.mounted) return;
      await _launchOnlineMatch(
        context,
        onlineClient: onlineClient,
        ready: ready,
        variant: LudoMatchVariant.room,
        telemetry: telemetry,
      );
  }
}

/// Surfaces a failed room join (invalid code, expired room, or a
/// network/server error) as a themed [LudoDialogFrame] dialog instead of
/// letting the exception propagate unhandled (task 26x: the documented gap
/// left by task 26, which never wrapped `joinRoom` in a `try`/`catch` at
/// all).
Future<void> _showRoomJoinError(BuildContext context, Object error) async {
  final message = switch (error) {
    LudoApiException(code: 'ludo_room_not_found') =>
      "That room code doesn't exist. Double-check it and try again.",
    LudoApiException(code: 'ludo_room_expired') =>
      'This invite has expired. Ask your friend for a new one.',
    _ => "Couldn't join that room. Check your connection and try again.",
  };
  await showDialog<void>(
    context: context,
    builder: (dialogContext) => Dialog(
      backgroundColor: Colors.transparent,
      child: LudoDialogFrame(
        title: 'Join failed',
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              message,
              style: LudoTextStyles.body,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: LudoThemeTokens.spaceLg),
            SizedBox(
              width: double.infinity,
              child: Ludo3dButton(
                key: const Key('room-join-error-ok-button'),
                semanticLabel: 'OK',
                onPressed: () => Navigator.of(dialogContext).pop(),
                child: const Text('OK'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Drives the "Online" tile: ruleset/player-count pick, then a cancelable
/// matchmaking search, then the board once matched or bot-filled.
Future<void> startLudoOnlineMatchmakingFlow(
  BuildContext context, {
  required LudoOnlineClient onlineClient,
  LudoTelemetry? telemetry,
}) async {
  final choice = await OnlineModeSetupSheet.show(context);
  if (choice == null || !context.mounted) return;
  final wait = onlineClient.onlineController.startMatchmaking(
    mode: choice.mode,
    seatTarget: choice.seatTarget,
  );
  final ready = await MatchmakingSearchScreen.show(context, wait);
  if (ready == null || !context.mounted) return;
  await _launchOnlineMatch(
    context,
    onlineClient: onlineClient,
    ready: ready,
    variant: LudoMatchVariant.online,
    telemetry: telemetry,
  );
}

/// The kind of local match a [LudoResumableMatchSummary] describes.
enum LudoResumableMatchMode {
  /// A match against the local computer/bot opponent(s).
  computer,

  /// A local pass-and-play match (multiple humans sharing one device).
  passAndPlay,
}

/// A summary of an in-progress local match to resume, shown by the home
/// lobby's resume affordance instead of (or alongside) the four entry
/// cards.
///
/// This is only an integration point for task 11's real save/restore
/// mechanism: this task defines the shape and renders it when supplied,
/// but never constructs one itself (the lobby's default is `null`, i.e. no
/// resumable match).
final class LudoResumableMatchSummary {
  const LudoResumableMatchSummary({
    required this.mode,
    required this.description,
  });

  /// Which local mode the in-progress match was started in.
  final LudoResumableMatchMode mode;

  /// A short human-readable summary shown on the resume card, e.g.
  /// "Classic - 2 players - Turn 5".
  final String description;
}

/// The four home lobby entry cards, plus (task 11) a resume affordance for
/// an in-progress local match.
class HomeLobbyScreen extends StatefulWidget {
  const HomeLobbyScreen({
    super.key,
    this.resumableMatch,
    this.onResume,
    this.onPlayComputer,
    this.onPlayPassAndPlay,
    this.localSave,
    this.telemetry,
    this.diceSeed,
    this.profile,
    this.profileStore,
    this.onlineClient,
    this.loadOnlineClient,
    this.onPlayFriends,
    this.onPlayOnline,
    this.shareInviteLink,
  });

  /// Test seam: a summary to show the resume affordance for, bypassing this
  /// screen's own load from [localSave] entirely. `null` (the default) in
  /// production, where the screen loads whatever `ludo_local_save.dart` has
  /// saved (if anything) on init instead.
  final LudoResumableMatchSummary? resumableMatch;

  /// Test seam: overrides tapping the resume affordance. `null` (the
  /// default) in production, where a tap instead pushes [GameBoardScreen]
  /// with the loaded save's state/config/identities.
  final VoidCallback? onResume;

  /// Invoked when the Computer card is tapped. Defaults to a no-op
  /// placeholder push until task 09's mode/setup sheet exists.
  final VoidCallback? onPlayComputer;

  /// Invoked when the Pass N Play card is tapped. Defaults to a no-op
  /// placeholder push until task 09's mode/setup sheet exists.
  final VoidCallback? onPlayPassAndPlay;

  /// Test seam: the save this screen loads a resumable match from when
  /// [resumableMatch] is not explicitly supplied. `null` (the default)
  /// resolves the production save (`LudoLocalSave.production`) lazily.
  final LudoLocalSave? localSave;

  /// Test seam: the telemetry sink `ludo_match_started` records through
  /// (and forwards to the pushed `GameBoardScreen`). `null` (the default)
  /// resolves a fresh production [LudoTelemetry].
  final LudoTelemetry? telemetry;

  /// Test seam: forwarded to `startLudoLocalMatch`'s pushed
  /// `GameBoardScreen` when the Computer/Pass N Play tiles use their
  /// default (non-overridden) navigation. `null` (the default) in
  /// production, where the dice source seeds itself from the current time.
  final int? diceSeed;

  /// Test seam: the profile identity (avatar + name) the lobby header
  /// shows, bypassing this screen's own load from [profileStore] entirely.
  /// `null` (the default) in production, where the screen loads whatever
  /// `ludo_profile_settings.dart` has saved (falling back to the generated
  /// default name/avatar if onboarding was skipped) on init instead.
  final LudoProfileSettings? profile;

  /// Test seam: the store this screen loads [profile] from when it is not
  /// explicitly supplied. `null` (the default) resolves the production
  /// store (`LudoProfileStore.production`) lazily, the same pattern
  /// `splash_screen.dart` uses.
  final LudoProfileStore? profileStore;

  /// Test seam: the resolved online client this screen's Play-with-Friends/
  /// Online tiles use, bypassing this screen's own async
  /// [loadOnlineClient] resolution entirely. `null` (the default) in
  /// production, where the screen calls [loadOnlineClient] on init and
  /// enables the tiles only if it resolves non-null (Firebase init
  /// succeeded and an API base URL is configured) — see
  /// `ludo_online_client.dart`'s doc comment.
  final LudoOnlineClient? onlineClient;

  /// Test seam: the async resolver this screen calls when [onlineClient]
  /// is not explicitly supplied. `null` (the default) resolves the
  /// production client (`createLudoOnlineClientForApp`) lazily.
  final Future<LudoOnlineClient?> Function()? loadOnlineClient;

  /// Test seam: overrides tapping the Play-with-Friends card once online
  /// is available. `null` (the default) in production, where a tap starts
  /// [startLudoOnlineFriendsFlow].
  final VoidCallback? onPlayFriends;

  /// Test seam: overrides tapping the Online card once online is
  /// available. `null` (the default) in production, where a tap starts
  /// [startLudoOnlineMatchmakingFlow].
  final VoidCallback? onPlayOnline;

  /// Test seam forwarded to [startLudoOnlineFriendsFlow]'s own
  /// `shareInviteLink` parameter. `null` (the default) in production.
  final Future<void> Function(String inviteLink)? shareInviteLink;

  @override
  State<HomeLobbyScreen> createState() => _HomeLobbyScreenState();
}

class _HomeLobbyScreenState extends State<HomeLobbyScreen> {
  LudoLocalSave? _resolvedSave;
  LudoLocalMatchSave? _loadedMatch;
  LudoProfileSettings? _loadedProfile;
  LudoOnlineClient? _loadedOnlineClient;

  @override
  void initState() {
    super.initState();
    if (widget.resumableMatch == null) {
      _loadSavedMatch();
    }
    if (widget.profile == null) {
      _loadProfile();
    }
    if (widget.onlineClient == null) {
      _loadOnlineClient();
    }
    // Task 26x: routes a room code from a cold-launch or warm-start invite
    // link (`ludo_deep_link_router.dart`) into the join-by-code flow. This
    // screen is the only registrant; a code routed before it mounts is
    // held and delivered on this call (see the router's own doc comment).
    LudoDeepLinkRouter.instance.register(_handleInviteRoomCode);
  }

  @override
  void dispose() {
    LudoDeepLinkRouter.instance.register(null);
    super.dispose();
  }

  void _handleInviteRoomCode(String roomCode) {
    final client = _onlineClient;
    // No online client yet (still resolving, or never available in this
    // build): silently drop the invite rather than crash — same "coming
    // soon" degradation the disabled tiles already show for a
    // config-absent build.
    if (client == null || !mounted) return;
    unawaited(
      startLudoOnlineFriendsFlow(
        context,
        onlineClient: client,
        telemetry: widget.telemetry,
        initialJoinCode: roomCode,
      ),
    );
  }

  Future<void> _loadOnlineClient() async {
    // Debug-only online preview mode (task 26x): armed via the settings
    // toggle or a long-press on the lobby logo (see below), it replaces
    // the production loader with the fake-transport-backed preview
    // client for the remainder of this app session. `kDebugMode`-guarded
    // so this branch is unreachable in a release build even though
    // `LudoOnlinePreviewMode.isArmed` itself always reads `false` there
    // (nothing ever arms it outside a debug build either).
    if (kDebugMode && LudoOnlinePreviewMode.isArmed) {
      setState(() => _loadedOnlineClient = createLudoPreviewOnlineClient());
      return;
    }
    final loader = widget.loadOnlineClient ?? createLudoOnlineClientForApp;
    final client = await loader();
    if (!mounted) return;
    setState(() => _loadedOnlineClient = client);
  }

  /// Long-press entry point for the debug-only online preview mode (task
  /// 26x), armed the same way the settings-screen toggle does. Compiled
  /// out of a release build by the `kDebugMode` guard on the
  /// `GestureDetector` that calls this (below) — not merely hidden behind
  /// a runtime flag.
  void _armPreviewModeFromLogo() {
    LudoOnlinePreviewMode.arm();
    unawaited(_loadOnlineClient());
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Online preview mode armed')));
  }

  /// The resolved online client, if online play is available. `null`
  /// (the tiles stay disabled) until [_loadOnlineClient] resolves, or
  /// permanently `null` for a config-absent/Firebase-unavailable build.
  LudoOnlineClient? get _onlineClient =>
      widget.onlineClient ?? _loadedOnlineClient;

  /// Whether the Play-with-Friends/Online tiles are enabled — only once an
  /// online client actually resolved (Firebase init succeeded and an API
  /// base URL is configured). A config-absent build's tiles stay disabled
  /// forever, per task 08/24's original "coming soon" state.
  bool get _onlineAvailable => _onlineClient != null;

  Future<void> _loadProfile() async {
    final store =
        widget.profileStore ?? await LudoProfileStore.production(ludoIdentity);
    final settings = LudoProfileSettings();
    await store.load(settings);
    if (!mounted) return;
    setState(() => _loadedProfile = settings);
  }

  /// The profile identity to show in the header, if any is available yet.
  LudoProfileSettings? get _profile => widget.profile ?? _loadedProfile;

  Future<void> _loadSavedMatch() async {
    final save = widget.localSave ?? await LudoLocalSave.production();
    final loaded = await save.load();
    if (!mounted) return;
    setState(() {
      _resolvedSave = save;
      _loadedMatch = loaded;
    });
  }

  /// The summary to show, if any: [widget.resumableMatch] when explicitly
  /// supplied (test seam), otherwise derived from whatever
  /// [_loadSavedMatch] loaded.
  LudoResumableMatchSummary? get _summary {
    if (widget.resumableMatch != null) return widget.resumableMatch;
    final loaded = _loadedMatch;
    if (loaded == null) return null;
    return LudoResumableMatchSummary(
      mode: loaded.config.isComputerMatch
          ? LudoResumableMatchMode.computer
          : LudoResumableMatchMode.passAndPlay,
      description:
          '${loaded.config.ruleset.id} - '
          '${loaded.config.playerCount} players',
    );
  }

  void _handleResume() {
    if (widget.onResume != null) {
      widget.onResume!();
      return;
    }
    final loaded = _loadedMatch;
    final save = _resolvedSave;
    if (loaded == null || save == null) return;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => GameBoardScreen(
          config: loaded.config,
          seatIdentities: loaded.seatIdentities,
          soundSettings: LudoSoundSettings(),
          initialState: loaded.state,
          localSave: save,
          telemetry: widget.telemetry,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final summary = _summary;
    return Scaffold(
      body: _LobbyBackground(
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            // A plain (non-scrolling) fill layout rather than a ListView:
            // the four mode tiles below are wrapped in `Expanded` so they
            // grow to occupy all remaining vertical space down to the
            // bottom of the viewport, instead of sizing to a fixed aspect
            // ratio and leaving the rest of a tall phone screen as bare
            // background. On very small viewports the fixed-height header
            // content above may not leave the tiles their full comfortable
            // size, but every element stays visible and reachable, and
            // typical phone/tablet heights are unaffected.
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.only(
                    bottom: LudoThemeTokens.spaceSm,
                  ),
                  child: Align(
                    alignment: Alignment.center,
                    child: Semantics(
                      label: ludoIdentity.publicTitle,
                      // Task 12h: ~80% of the lobby's content width,
                      // matching `mockup-a.png`/`mockup-b.png`'s scale —
                      // up from the previous fixed 200x54 (a small
                      // top-left header wordmark). `LayoutBuilder` reads
                      // the content column's actual available width so
                      // this stays correct across device sizes rather
                      // than hardcoding a pixel width.
                      child: LayoutBuilder(
                        builder: (context, constraints) {
                          final width = constraints.maxWidth * 0.8;
                          final logo = LudoArtSlot(
                            slot: LudoArtManifest.logoWideSlot,
                            fallbackPainter: LudoArtManifest.logoWide,
                            size: Size(width, width * 54 / 200),
                          );
                          // Debug-only online preview mode entry point
                          // (task 26x), the same shape as the settings
                          // toggle above: `kDebugMode`-guarded here, at
                          // the call site that attaches the gesture, so a
                          // release build never wraps the logo in a
                          // `GestureDetector` at all — not merely a
                          // runtime flag hiding it.
                          if (!kDebugMode) return logo;
                          // `container: true`: a separate SemanticsNode
                          // boundary so this debug-only button's own label
                          // never merges upward into (and so never
                          // overwrites) the enclosing "Ludo Vortex"
                          // wordmark label above.
                          return Semantics(
                            container: true,
                            button: true,
                            label: 'Debug: arm online preview mode',
                            child: GestureDetector(
                              key: const Key('lobby-logo-preview-trigger'),
                              onLongPress: _armPreviewModeFromLogo,
                              child: logo,
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
                _ProfileHeader(profile: _profile),
                const SizedBox(height: LudoThemeTokens.spaceMd),
                if (summary != null) ...[
                  _ResumeCard(summary: summary, onTap: _handleResume),
                  const SizedBox(height: 16),
                ],
                // The four mode tiles fill all remaining vertical
                // space down to the bottom of the viewport (rather
                // than sizing themselves to a fixed aspect ratio and
                // leaving the rest of a tall phone screen as bare
                // background), so the lobby never shows a single
                // dominant empty region below its content.
                Expanded(
                  child: Column(
                    children: [
                      Expanded(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: _LobbyCard(
                                title: 'Computer',
                                subtitle: 'Play locally vs. the bot',
                                glyph: _LobbyGlyph.computer,
                                enabled: true,
                                onTap:
                                    widget.onPlayComputer ??
                                    () => startLudoLocalMatch(
                                      context,
                                      isComputerMatch: true,
                                      telemetry: widget.telemetry,
                                      diceSeed: widget.diceSeed,
                                    ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _LobbyCard(
                                title: 'Pass N Play',
                                subtitle: 'Share this device, take turns',
                                glyph: _LobbyGlyph.passAndPlay,
                                enabled: true,
                                onTap:
                                    widget.onPlayPassAndPlay ??
                                    () => startLudoLocalMatch(
                                      context,
                                      isComputerMatch: false,
                                      telemetry: widget.telemetry,
                                      diceSeed: widget.diceSeed,
                                    ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Expanded(
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Expanded(
                              child: _LobbyCard(
                                title: 'Play with Friends',
                                subtitle: _onlineAvailable
                                    ? 'Create or join a room'
                                    : 'Not available yet',
                                glyph: _LobbyGlyph.friends,
                                enabled: _onlineAvailable,
                                onTap: _onlineAvailable
                                    ? (widget.onPlayFriends ??
                                          () => startLudoOnlineFriendsFlow(
                                            context,
                                            onlineClient: _onlineClient!,
                                            telemetry: widget.telemetry,
                                            shareInviteLink:
                                                widget.shareInviteLink,
                                          ))
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _LobbyCard(
                                title: 'Online',
                                subtitle: _onlineAvailable
                                    ? 'Random matchmaking'
                                    : 'Not available yet',
                                glyph: _LobbyGlyph.online,
                                enabled: _onlineAvailable,
                                onTap: _onlineAvailable
                                    ? (widget.onPlayOnline ??
                                          () => startLudoOnlineMatchmakingFlow(
                                            context,
                                            onlineClient: _onlineClient!,
                                            telemetry: widget.telemetry,
                                          ))
                                    : null,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// The home lobby's full-bleed background (task 12h): the user-approved
/// `bg-b.png` "vortex galaxy" art via the [LudoArtManifest] bitmap-slot
/// mechanism, covering the whole screen behind [child], falling back to
/// the same code-drawn deep-blue/gold look every other screen renders
/// (via `LudoArtManifest.lobbyBackground`) when no bitmap is bundled.
/// Sized from a [LayoutBuilder] (rather than [Size.infinite], which
/// [LudoArtSlot]'s `Image.asset` can't cover with) so [BoxFit.cover] has
/// real dimensions to fill.
class _LobbyBackground extends StatelessWidget {
  const _LobbyBackground({this.child});

  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        return Stack(
          fit: StackFit.expand,
          children: [
            LudoArtSlot(
              slot: LudoArtManifest.lobbyBackgroundSlot,
              fallbackPainter: LudoArtManifest.lobbyBackground,
              size: size,
              fit: BoxFit.cover,
            ),
            ?child,
          ],
        );
      },
    );
  }
}

/// The lobby header: the player's avatar and display name, using the same
/// [LudoAvatarView] the onboarding/results screens already render identity
/// with — no second avatar presentation invented here. Shows nothing
/// (renders as an empty box) until a profile has loaded, so the lobby
/// never flashes a placeholder identity.
class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.profile});

  final LudoProfileSettings? profile;

  @override
  Widget build(BuildContext context) {
    final profile = this.profile;
    if (profile == null) return const SizedBox.shrink();
    return LudoPanel(
      padding: const EdgeInsets.symmetric(
        horizontal: LudoThemeTokens.spaceMd,
        vertical: LudoThemeTokens.spaceSm,
      ),
      child: Row(
        children: [
          LudoAvatarView(avatarId: profile.avatarId, size: 48),
          const SizedBox(width: LudoThemeTokens.spaceMd),
          Expanded(
            child: Text(
              profile.name,
              style: LudoTextStyles.displaySmall,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

/// The resume-in-progress affordance shown above the four entry cards when
/// a [LudoResumableMatchSummary] is supplied.
class _ResumeCard extends StatelessWidget {
  const _ResumeCard({required this.summary, this.onTap});

  final LudoResumableMatchSummary summary;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final modeLabel = switch (summary.mode) {
      LudoResumableMatchMode.computer => 'Computer match',
      LudoResumableMatchMode.passAndPlay => 'Pass N Play match',
    };
    return Semantics(
      button: true,
      label: 'Resume $modeLabel: ${summary.description}',
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minTapTarget),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onTap,
              child: LudoPanel(
                child: Row(
                  children: [
                    const Icon(
                      Icons.play_circle_outline,
                      size: 32,
                      color: LudoThemeTokens.gold,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Resume $modeLabel',
                            style: LudoTextStyles.bodyStrong,
                          ),
                          Text(
                            summary.description,
                            style: LudoTextStyles.caption,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Which code-drawn glyph a [_LobbyCard] paints as its fallback (never a
/// photographic icon, matching task 08's Context/Decisions) — and, per
/// task 12h, which [LudoArtManifest] bitmap slot the card resolves art
/// through first via [LudoArtSlot].
enum _LobbyGlyph { computer, passAndPlay, friends, online }

/// The [LudoArtManifest] bitmap slot name for [_LobbyGlyph]'s tile art
/// (task 12h) — the user-approved "Style A" tile set.
extension on _LobbyGlyph {
  String get manifestSlot => switch (this) {
    _LobbyGlyph.computer => LudoArtManifest.lobbyTileComputerSlot,
    _LobbyGlyph.passAndPlay => LudoArtManifest.lobbyTilePassAndPlaySlot,
    _LobbyGlyph.friends => LudoArtManifest.lobbyTileFriendsSlot,
    _LobbyGlyph.online => LudoArtManifest.lobbyTileOnlineSlot,
  };
}

/// One of the four home lobby entry cards, enabled or disabled.
class _LobbyCard extends StatelessWidget {
  const _LobbyCard({
    required this.title,
    required this.subtitle,
    required this.glyph,
    required this.enabled,
    this.onTap,
  });

  final String title;
  final String subtitle;
  final _LobbyGlyph glyph;
  final bool enabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final semanticsLabel = enabled ? title : '$title, coming soon, unavailable';

    return Semantics(
      button: enabled,
      enabled: enabled,
      label: semanticsLabel,
      excludeSemantics: true,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minWidth: _minTapTarget,
          minHeight: _minTapTarget,
        ),
        child: Opacity(
          opacity: enabled ? 1.0 : 0.5,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(LudoThemeTokens.radiusMd),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                // Disabled tiles get no tap handler at all (not merely a
                // dimmed color) so no navigation can ever be triggered.
                onTap: enabled ? onTap : null,
                child: LudoPanel(
                  padding: const EdgeInsets.all(12),
                  child: LayoutBuilder(
                    builder: (context, panelConstraints) {
                      // The art sizes off this panel's *own* available
                      // width (read here, outside the `FittedBox` below —
                      // `FittedBox` hands its child unbounded constraints
                      // so it can measure a natural size to then scale,
                      // which would make a `LayoutBuilder` nested inside
                      // it read as unbounded too), not a fixed pixel
                      // size: the approved tile mockup (`mockup-a.png`)
                      // shows each hero object filling roughly half the
                      // card's width, a world away from a small corner
                      // glyph — matching that scale here (rather than the
                      // previous fixed 40x40, a leftover from the
                      // pre-art code-drawn-glyph-only layout) is what
                      // this task's device visual-QA pass calls out as a
                      // fidelity gap against the approved art.
                      final artSize = panelConstraints.hasBoundedWidth
                          ? panelConstraints.maxWidth * 0.55
                          : 88.0;
                      return Stack(
                        alignment: Alignment.center,
                        children: [
                          // Task 12h's larger lobby header logo takes
                          // more of the column's vertical space above
                          // these tiles, leaving less room here on a
                          // short viewport (or whenever the
                          // resume-in-progress card is also showing)
                          // than this content's natural size wants.
                          // `FittedBox` scales the icon+title+subtitle
                          // stack down together to fit rather than
                          // overflowing, while still rendering at full
                          // natural size whenever there's room (the
                          // common case).
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                LudoArtSlot(
                                  slot: glyph.manifestSlot,
                                  fallbackPainter: (canvas, rect) =>
                                      _LobbyGlyphPainter(glyph)
                                          .paint(canvas, rect.size),
                                  size: Size.square(artSize),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  title,
                                  textAlign: TextAlign.center,
                                  style: LudoTextStyles.displaySmall,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  subtitle,
                                  textAlign: TextAlign.center,
                                  style: LudoTextStyles.caption,
                                ),
                              ],
                            ),
                          ),
                          if (!enabled)
                            const Positioned(
                              top: 0,
                              right: 0,
                              child: _ComingSoonBadge(),
                            ),
                        ],
                      );
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// The "Coming soon" pill shown on a disabled lobby tile.
class _ComingSoonBadge extends StatelessWidget {
  const _ComingSoonBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: LudoThemeTokens.gold,
        borderRadius: BorderRadius.circular(LudoThemeTokens.radiusPill),
        border: Border.all(color: LudoThemeTokens.goldDeep, width: 1.5),
      ),
      child: Text('Coming soon', style: LudoTextStyles.caption),
    );
  }
}

/// Paints a small, simple, code-drawn geometric glyph for each
/// [_LobbyGlyph] — a monitor+die for Computer, two dice for Pass N Play,
/// two overlapping avatar circles for Friends, and a globe grid for
/// Online. Every mark is plain `Canvas` drawing, never a bitmap/photo.
class _LobbyGlyphPainter extends CustomPainter {
  const _LobbyGlyphPainter(this.glyph);

  final _LobbyGlyph glyph;

  @override
  void paint(Canvas canvas, Size size) {
    final stroke = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = size.shortestSide * 0.08
      ..strokeCap = StrokeCap.round
      ..color = LudoThemeTokens.gold;
    final fill = Paint()..color = LudoThemeTokens.gold;
    final rect = Offset.zero & size;

    switch (glyph) {
      case _LobbyGlyph.computer:
        final screen = Rect.fromLTWH(
          rect.width * 0.1,
          rect.height * 0.08,
          rect.width * 0.8,
          rect.height * 0.55,
        );
        canvas.drawRRect(
          RRect.fromRectAndRadius(screen, const Radius.circular(4)),
          stroke,
        );
        canvas.drawLine(
          Offset(rect.width * 0.5, screen.bottom),
          Offset(rect.width * 0.5, rect.height * 0.82),
          stroke,
        );
        canvas.drawLine(
          Offset(rect.width * 0.3, rect.height * 0.9),
          Offset(rect.width * 0.7, rect.height * 0.9),
          stroke,
        );
        canvas.drawCircle(screen.center, size.shortestSide * 0.08, fill);
      case _LobbyGlyph.passAndPlay:
        for (final dx in [-1.0, 1.0]) {
          final center = rect.center.translate(dx * size.width * 0.2, 0);
          final die = Rect.fromCenter(
            center: center,
            width: size.width * 0.42,
            height: size.width * 0.42,
          );
          canvas.drawRRect(
            RRect.fromRectAndRadius(die, const Radius.circular(6)),
            stroke,
          );
          canvas.drawCircle(center, size.shortestSide * 0.06, fill);
        }
      case _LobbyGlyph.friends:
        for (final dx in [-1.0, 1.0]) {
          final center = rect.center.translate(dx * size.width * 0.16, 0);
          canvas.drawCircle(
            center,
            size.shortestSide * 0.28,
            Paint()
              ..style = PaintingStyle.stroke
              ..strokeWidth = size.shortestSide * 0.07
              ..color = LudoThemeTokens.gold.withValues(
                alpha: dx < 0 ? 1 : 0.7,
              ),
          );
        }
      case _LobbyGlyph.online:
        final center = rect.center;
        final radius = size.shortestSide * 0.38;
        canvas.drawCircle(center, radius, stroke);
        canvas.drawOval(
          Rect.fromCenter(center: center, width: radius * 2, height: radius),
          stroke,
        );
        canvas.drawLine(
          center.translate(0, -radius),
          center.translate(0, radius),
          stroke,
        );
    }
  }

  @override
  bool shouldRepaint(covariant _LobbyGlyphPainter oldDelegate) =>
      oldDelegate.glyph != glyph;
}
