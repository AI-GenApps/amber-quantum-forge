import 'package:flutter/material.dart';

import 'merge_relay_gateway.dart';
import 'merge_relay_service_outcome.dart';
import 'merge_relay_theme.dart';

enum MergeRelayGateState { checking, switchedOff, notInThisBuild, unknown }

final class MergeRelayGateStatus {
  const MergeRelayGateStatus({
    required this.id,
    required this.label,
    required this.state,
    required this.detail,
  });

  final String id;
  final String label;
  final MergeRelayGateState state;
  final String detail;
}

const _noBuild = 'This build has no support for it. Nothing is granted.';

List<MergeRelayGateStatus> mergeRelayGateStatuses(
  MergeRelayConfigRevision? config, {
  bool checking = false,
}) {
  MergeRelayGateStatus row(String id, String label, bool? flag, String on) {
    if (checking) {
      return MergeRelayGateStatus(
        id: id,
        label: label,
        state: MergeRelayGateState.checking,
        detail: 'Checking the service.',
      );
    }
    if (flag == null) {
      return MergeRelayGateStatus(
        id: id,
        label: label,
        state: MergeRelayGateState.unknown,
        detail: 'Could not reach the service. Unavailable for now.',
      );
    }
    return MergeRelayGateStatus(
      id: id,
      label: label,
      state: flag
          ? MergeRelayGateState.notInThisBuild
          : MergeRelayGateState.switchedOff,
      detail: flag ? on : 'Switched off by the service.',
    );
  }

  final features = config?.features;
  final rewards = features == null
      ? null
      : features.rewardedAds || features.cosmetics;
  return [
    row('rewards', 'Rewards', rewards, _noBuild),
    row('ads', 'Ads', features?.rewardedAds, _noBuild),
    row('cosmetics', 'Themes and purchases', features?.cosmetics, _noBuild),
    row(
      'tuning',
      'Remote tuning',
      config?.active,
      'The service has a tuning revision, but this build plays with its '
          'built-in rules.',
    ),
  ];
}

final class MergeRelayFeatureGatePanel extends StatefulWidget {
  const MergeRelayFeatureGatePanel({
    required this.gateway,
    required this.theme,
    super.key,
  });

  final MergeRelayGateway gateway;
  final MergeRelayTheme theme;

  @override
  State<MergeRelayFeatureGatePanel> createState() => _GatePanelState();
}

final class _GatePanelState extends State<MergeRelayFeatureGatePanel> {
  MergeRelayConfigRevision? _config;
  String? _error;
  var _checking = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _checking = true;
      _error = null;
    });
    MergeRelayConfigRevision? config;
    String? error;
    try {
      config = await widget.gateway.getConfig();
    } on Object catch (cause) {
      error = mergeRelayOutcomeFor(cause).title;
    }
    if (!mounted) return;
    setState(() {
      _config = config;
      _error = error;
      _checking = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = widget.theme;
    final rows = mergeRelayGateStatuses(_config, checking: _checking);
    return Column(
      key: const ValueKey('mr-feature-gates'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Extras',
          style: TextStyle(
            color: theme.ink,
            fontSize: 16,
            fontWeight: FontWeight.w900,
          ),
        ),
        for (final status in rows)
          Semantics(
            label:
                '${status.label}. ${_stateLabel(status.state)}. '
                '${status.detail}',
            excludeSemantics: true,
            child: Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.lock_outline_rounded,
                    size: 18,
                    color: theme.muted,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '${status.label} · ${_stateLabel(status.state)}',
                          style: TextStyle(
                            color: theme.ink,
                            fontWeight: FontWeight.w800,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          status.detail,
                          style: TextStyle(color: theme.muted, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        if (_error != null)
          TextButton(onPressed: _load, child: const Text('Check again')),
      ],
    );
  }

  static String _stateLabel(MergeRelayGateState state) => switch (state) {
    MergeRelayGateState.checking => 'Checking',
    MergeRelayGateState.switchedOff => 'Off',
    MergeRelayGateState.notInThisBuild => 'Not available yet',
    MergeRelayGateState.unknown => 'Unavailable',
  };
}
