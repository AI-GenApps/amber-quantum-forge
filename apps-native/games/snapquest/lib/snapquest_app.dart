import 'dart:async';

import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';
import 'package:snapquest_rules/snapquest_rules.dart';

import 'capabilities/camera_capture_models.dart';
import 'capabilities/camera_capture_capability.dart';
import 'capabilities/unavailable_camera_capability.dart';
import 'snapquest_cards.dart';
import 'snapquest_theme.dart';

part 'snapquest_home_actions.dart';
part 'snapquest_save_actions.dart';

typedef CameraCapabilityFactory = CaptureCapability Function();

final snapQuestIdentity = appIdentityFor(
  'snapquest',
  subtitle: 'Find objects. Meet creatures',
);

final class SnapQuestApp extends StatelessWidget {
  const SnapQuestApp({super.key, this.cameraFactory, this.saveStore});

  final CameraCapabilityFactory? cameraFactory;
  final SaveStore? saveStore;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: snapQuestIdentity.publicTitle,
      debugShowCheckedModeBanner: false,
      theme: SnapDesign.theme(),
      home: SnapQuestHome(
        key: key,
        cameraFactory: cameraFactory,
        saveStore: saveStore,
      ),
    );
  }
}

final class SnapQuestHome extends StatefulWidget {
  const SnapQuestHome({super.key, this.cameraFactory, this.saveStore});

  final CameraCapabilityFactory? cameraFactory;
  final SaveStore? saveStore;

  @override
  State<SnapQuestHome> createState() => _SnapQuestHomeState();
}

final class _SnapQuestHomeState extends State<SnapQuestHome>
    with WidgetsBindingObserver {
  late final AppContext _appContext = runtimeAppContext(
    identity: snapQuestIdentity,
  );
  late final SaveStore _saveStore = widget.saveStore ?? MemorySaveStore();
  late final CaptureCapability _camera =
      widget.cameraFactory?.call() ?? UnavailableCameraCapability();
  late final SnapQuestRules _rules = SnapQuestRules(
    QuestCatalog(
      version: 3,
      descriptorIds: const {'red', 'blue'},
      creatureIds: const {'emberling', 'azurling'},
      quests: const [
        QuestDefinition(
          id: 'daily-red',
          version: 3,
          descriptorId: 'red',
          creatureId: 'emberling',
          rewardId: 'sticker-ember',
        ),
        QuestDefinition(
          id: 'daily-blue',
          version: 3,
          descriptorId: 'blue',
          creatureId: 'azurling',
          rewardId: 'sticker-azure',
        ),
      ],
    ),
  );
  final DateTime _observedAt = DateTime.utc(2026, 1, 1);
  SnapQuestState _state = const SnapQuestState();
  CameraCaptureMetadata? _lastCapture;
  String _message = 'Pick a target.';
  bool _hydrated = false;
  bool _busy = false;

  void _update(VoidCallback update) => setState(update);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_restore());
  }

  @override
  Widget build(BuildContext context) {
    if (!_hydrated) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final quest = _nextQuest;
    final content = <Widget>[
      SnapHeader(
        completedCount: _state.completedQuestKeys.length,
        albumCount: _state.album.length,
      ),
      const SizedBox(height: 18),
      SnapPanel(
        color: Colors.white,
        child: Text(_message, style: Theme.of(context).textTheme.bodyMedium),
      ),
      const SizedBox(height: 12),
      if (quest != null) ...[
        SnapTargetCard(
          colorName: _colorName(quest.descriptorId),
          targetColor: _descriptorColor(quest.descriptorId),
          symbol: _symbolFor(quest.descriptorId),
          creatureName: _creatureName(quest.creatureId),
          creatureId: quest.creatureId,
        ),
        const SizedBox(height: 12),
        SnapDeskPanel(
          objects: _deskObjects,
          targetDescriptor: quest.descriptorId,
          enabled: !_busy,
          onSelect: _completeFromDesk,
        ),
        const SizedBox(height: 12),
        SnapCameraPanel(
          message: _cameraMessage,
          metadata: _lastCapture,
          busy: _busy,
          onTry: () => unawaited(_tryCamera()),
        ),
      ] else
        SnapPanel(
          color: SnapDesign.lime,
          child: Text(
            'All hunts complete! Your Peeklings are growing.',
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
      if (_state.album.isNotEmpty) ...[
        const SizedBox(height: 12),
        SnapAlbumPanel(
          entries: _state.album.values.toList(),
          creatureName: _creatureName,
        ),
      ],
    ];
    return Scaffold(
      appBar: AppBar(
        leading: const Icon(Icons.visibility_rounded),
        title: const Text('Peeklings'),
        actions: [
          IconButton(
            tooltip: 'Clear local album',
            onPressed: _busy ? null : () => unawaited(_confirmReset()),
            icon: const Icon(Icons.restart_alt_rounded),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 32),
        children: content,
      ),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    final camera = _camera;
    if (camera is! LifecycleAwareCaptureCapability) return;
    final lifecycle = state == AppLifecycleState.resumed
        ? CameraLifecycleState.foreground
        : CameraLifecycleState.background;
    final lifecycleAware = camera as LifecycleAwareCaptureCapability;
    unawaited(lifecycleAware.onLifecycleChanged(lifecycle));
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _camera.dispose();
    super.dispose();
  }
}
