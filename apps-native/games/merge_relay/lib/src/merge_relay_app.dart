import 'dart:async';

import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

import 'merge_relay_content.dart';
import 'merge_relay_game.dart';
import 'merge_relay_relay_controller.dart';
import 'merge_relay_theme.dart';
import 'merge_relay_ui.dart';
import 'platform/merge_relay_challenge_links.dart';
import 'platform/merge_relay_pgs_account.dart';
import 'platform/merge_relay_play_games.dart';

export 'merge_relay_game.dart';

final mergeRelayIdentity = appIdentityFor(
  'merge_relay',
  subtitle: 'Merge tiles. Light the board',
);

final class MergeRelayApp extends StatefulWidget {
  const MergeRelayApp({
    this.content,
    this.contentError,
    this.saveStore,
    this.relayController,
    this.challengeLinks,
    this.pgsAccount,
    this.playGames,
    super.key,
  });

  final MergeRelayContentCatalog? content;
  final String? contentError;
  final SaveStore? saveStore;
  final MergeRelayRelayController? relayController;
  final MergeRelayChallengeLinkSource? challengeLinks;
  final MergeRelayPgsAccountController? pgsAccount;
  final MergeRelayPlayGamesProvider? playGames;

  @override
  State<MergeRelayApp> createState() => _MergeRelayAppState();
}

final class _MergeRelayAppState extends State<MergeRelayApp>
    with WidgetsBindingObserver {
  late final MergeRelayGame game;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    game = MergeRelayGame(
      context: runtimeAppContext(identity: mergeRelayIdentity),
      saveStore: widget.saveStore ?? MemorySaveStore(),
      content: widget.content,
      relayController: widget.relayController,
      pgsAccount: widget.pgsAccount,
      playGames: widget.playGames,
    );
    if (widget.contentError != null) return;
    game.hydrated.addListener(_onRestoreStateChanged);
    game.restoreFailed.addListener(_onRestoreStateChanged);
    final restore = game.restore();
    _restoreReady = restore;
    if (widget.relayController == null) {
      unawaited(restore);
    } else {
      _challengeLinks =
          widget.challengeLinks ?? MethodChannelMergeRelayChallengeLinkSource();
      _linkSubscription = _challengeLinks!.links.listen(
        (link) => unawaited(_enqueueIncomingLink(link)),
      );
      unawaited(_initializeIncomingLinks(restore));
    }
  }

  MergeRelayChallengeLinkSource? _challengeLinks;
  StreamSubscription<String>? _linkSubscription;
  late Future<void> _restoreReady;
  Future<void> _incomingTail = Future<void>.value();
  final List<String> _pendingIncomingLinks = [];
  bool _disposed = false;

  Future<void> _initializeIncomingLinks(Future<void> restore) async {
    List<String> pending;
    try {
      pending = await _challengeLinks!.initialize();
    } on Object {
      return;
    }
    _pendingIncomingLinks.addAll(pending);
    await restore;
    await _drainIncomingLinks();
  }

  Future<void> _enqueueIncomingLink(String link) {
    _pendingIncomingLinks.add(link);
    return _drainIncomingLinks();
  }

  Future<void> _drainIncomingLinks() {
    final prior = _incomingTail.catchError((_) {});
    _incomingTail = prior.then<void>((_) async {
      await _restoreReady;
      while (_pendingIncomingLinks.isNotEmpty &&
          !_disposed &&
          game.hydrated.value &&
          !game.restoreFailed.value) {
        final link = _pendingIncomingLinks.first;
        await _openIncomingLink(link);
        if (_disposed || !game.hydrated.value || game.restoreFailed.value) {
          return;
        }
        _pendingIncomingLinks.removeAt(0);
      }
    });
    return _incomingTail;
  }

  void _onRestoreStateChanged() {
    if (game.hydrated.value && !game.restoreFailed.value) {
      unawaited(_drainIncomingLinks());
    }
  }

  Future<void> _openIncomingLink(String link) async {
    if (_disposed || widget.relayController == null) return;
    if (!game.hydrated.value || game.restoreFailed.value) return;
    game.openRelay();
    await widget.relayController!.bootstrap();
    if (!_disposed) await widget.relayController!.openLink(link);
  }

  @override
  void dispose() {
    _disposed = true;
    game.hydrated.removeListener(_onRestoreStateChanged);
    game.restoreFailed.removeListener(_onRestoreStateChanged);
    _linkSubscription?.cancel();
    _challengeLinks?.dispose();
    WidgetsBinding.instance.removeObserver(this);
    game.dispose();
    widget.relayController?.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    game.handleLifecycleState(state);
    if (state != AppLifecycleState.resumed) {
      widget.relayController?.pauseReplay();
    }
    if (state == AppLifecycleState.resumed &&
        widget.relayController != null &&
        game.hydrated.value &&
        !game.restoreFailed.value) {
      unawaited(widget.relayController!.retry());
    }
    if (state == AppLifecycleState.resumed) {
      unawaited(game.refreshPgsAccount());
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.contentError != null) {
      return MaterialApp(
        title: mergeRelayIdentity.publicTitle,
        debugShowCheckedModeBanner: false,
        theme: materialThemeFor(signalRelayTheme),
        home: _MergeRelayContentFailure(message: widget.contentError!),
      );
    }
    return ListenableBuilder(
      listenable: game.preferences,
      builder: (context, _) {
        final relayTheme = relayThemeFor(game.preferences.value.themeId);
        return MaterialApp(
          title: mergeRelayIdentity.publicTitle,
          debugShowCheckedModeBanner: false,
          theme: materialThemeFor(relayTheme),
          home: MergeRelayScreen(game: game),
        );
      },
    );
  }
}

final class _MergeRelayContentFailure extends StatelessWidget {
  const _MergeRelayContentFailure({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(28),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.cloud_off_rounded, size: 48),
                const SizedBox(height: 18),
                Text(
                  'Merge Relay needs a fresh start.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
                const SizedBox(height: 10),
                const Text(
                  'Game content could not be loaded. Close and reopen the app to try again.',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 18),
                SelectableText(
                  'Diagnostic: content_load_failed\n$message',
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
