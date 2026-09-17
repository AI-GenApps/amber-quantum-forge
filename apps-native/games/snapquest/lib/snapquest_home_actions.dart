part of 'snapquest_app.dart';

extension on _SnapQuestHomeState {
  List<SnapDeskObject> get _deskObjects => const [
    SnapDeskObject(
      name: 'Red pebble',
      descriptorId: 'red',
      symbol: '●',
      color: SnapDesign.coral,
    ),
    SnapDeskObject(
      name: 'Blue shell',
      descriptorId: 'blue',
      symbol: '◇',
      color: SnapDesign.sky,
    ),
    SnapDeskObject(
      name: 'Golden leaf',
      descriptorId: 'gold',
      symbol: '✦',
      color: SnapDesign.gold,
    ),
  ];

  QuestDefinition? get _nextQuest {
    for (final quest in _rules.catalog.quests) {
      final key = '${quest.id}:${quest.version}';
      if (!_state.completedQuestKeys.contains(key)) return quest;
    }
    return null;
  }

  String get _cameraMessage => _camera is UnavailableCameraCapability
      ? 'No camera here. Desk mode is ready.'
      : 'Desk mode is always ready.';

  Future<void> _restore() async {
    try {
      final envelope = await _saveStore.read(_appContext);
      if (envelope != null) {
        if (envelope.schemaVersion != 1) {
          throw const FormatException('Unsupported SnapQuest save schema');
        }
        _state = _stateFromPayload(envelope.payload);
        _message = 'Your collection is back.';
      }
    } catch (_) {
      _message = 'We could not open that collection. Starting fresh.';
    } finally {
      if (mounted) _update(() => _hydrated = true);
    }
  }

  Future<void> _completeFromDesk(SnapDeskObject object) async {
    if (_busy) return;
    _update(() => _busy = true);
    try {
      final quest = _nextQuest;
      if (quest == null) return;
      final observation = _rules.deskObservation(
        questId: quest.id,
        descriptorId: object.descriptorId,
        observedAt: _observedAt,
      );
      final result = _rules.complete(state: _state, observation: observation);
      if (!result.accepted) {
        _update(
          () => _message =
              '${object.name} missed. Find ${_colorName(quest.descriptorId)}.',
        );
        return;
      }
      _update(() {
        _state = result.state;
        _lastCapture = null;
        _message = '${_creatureName(quest.creatureId)} joined your album!';
      });
      await _persist();
    } finally {
      if (mounted) _update(() => _busy = false);
    }
  }

  Future<void> _tryCamera() async {
    if (_busy) return;
    final quest = _nextQuest;
    if (quest == null) return;
    _update(() => _busy = true);
    try {
      final observation = await _camera.capture(
        CaptureRequest(
          questId: quest.id,
          questVersion: quest.version,
          descriptorIds: _rules.catalog.descriptorIds,
          minimumQuality: quest.minimumQuality,
          observedAt: _observedAt,
        ),
      );
      final result = _rules.complete(state: _state, observation: observation);
      final metadata = _camera is CameraCaptureCapability
          ? _camera.lastCapture
          : null;
      if (!mounted) return;
      if (result.accepted) {
        _update(() {
          _state = result.state;
          _lastCapture = metadata;
          _message = '${_creatureName(quest.creatureId)} joined your album!';
        });
        await _persist();
        return;
      }
      _update(() {
        _lastCapture = metadata;
        _message = _cameraResultMessage(observation.status, metadata);
      });
    } catch (_) {
      if (mounted) {
        _update(() => _message = 'Camera did not start. Try the desk match.');
      }
    } finally {
      if (mounted) _update(() => _busy = false);
    }
  }

  String _cameraResultMessage(
    CaptureStatus status,
    CameraCaptureMetadata? metadata,
  ) => switch (status) {
    CaptureStatus.denied => 'Camera is off. Try the desk match.',
    CaptureStatus.cancelled => 'Scan paused. Try the desk match.',
    CaptureStatus.unavailable => 'No camera here. Try the desk match.',
    CaptureStatus.lowQuality when metadata?.frameCaptured == true =>
      'Desk match next.',
    CaptureStatus.lowQuality => 'Try a clearer peek, or use the desk match.',
    CaptureStatus.failed => 'Camera did not start. Try the desk match.',
    CaptureStatus.accepted => 'That snapshot needs a desk match.',
  };

  Future<void> _confirmReset() async {
    if (_busy || !mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear the local album?'),
        content: const Text('This clears your local collection.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Clear album'),
          ),
        ],
      ),
    );
    if (confirmed == true && mounted) await _reset();
  }

  Future<void> _reset() async {
    if (_busy) return;
    _update(() => _busy = true);
    try {
      await _saveStore.delete(_appContext);
    } catch (_) {
      if (mounted) {
        _update(() => _message = 'We could not clear the collection.');
      }
      return;
    } finally {
      if (mounted) _update(() => _busy = false);
    }
    if (mounted) {
      _update(() {
        _state = const SnapQuestState();
        _lastCapture = null;
        _message = 'New hunt ready.';
      });
    }
  }

  String _colorName(String descriptorId) => switch (descriptorId) {
    'red' => 'red',
    'blue' => 'blue',
    _ => 'that color',
  };

  Color _descriptorColor(String descriptorId) => switch (descriptorId) {
    'red' => SnapDesign.coral,
    'blue' => SnapDesign.sky,
    'gold' => SnapDesign.gold,
    _ => SnapDesign.lime,
  };

  String _symbolFor(String descriptorId) => switch (descriptorId) {
    'red' => '●',
    'blue' => '◇',
    _ => '✦',
  };

  String _creatureName(String creatureId) => switch (creatureId) {
    'emberling' => 'Emberling',
    'azurling' => 'Azurling',
    _ => 'a new Peekling',
  };
}
