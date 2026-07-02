import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart' show launchUrl;

import '../../core/config/app_config.dart';
import '../../core/config/app_metadata.dart';
import '../../core/network/api_client.dart';

/// Fetches `GET /api/config/app-metadata` on launch and blocks the app
/// with a force-update screen when `version_config.updateType ==
/// mandatory`. Mirrors the config/force-update gating described in the
/// plan for the (not-yet-built) iOS `AppConfigService`.
///
/// Wrap the app's root widget with this gate, below the onboarding /
/// home routing decision:
/// ```dart
/// ForceUpdateGate(child: HomeScreen())
/// ```
class ForceUpdateGate extends StatefulWidget {
  const ForceUpdateGate({super.key, required this.child});

  final Widget child;

  @override
  State<ForceUpdateGate> createState() => _ForceUpdateGateState();
}

class _ForceUpdateGateState extends State<ForceUpdateGate> {
  late final ApiClient _client = ApiClient(baseUrl: AppConfig.apiBaseUrl);
  AppMetadata? _metadata;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final metadata = await _client.request<AppMetadata>(
        const Endpoint(path: '/api/config/app-metadata', requiresAuth: false),
        decode: (json) => AppMetadata.fromJson(json as Map<String, dynamic>),
      );
      if (!mounted) return;
      setState(() {
        _metadata = metadata;
        _loading = false;
      });
    } catch (_) {
      // Fail open: if config can't be fetched, don't block the app.
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _client.close();
    super.dispose();
  }

  bool get _isMandatoryUpdate =>
      _metadata?.versionConfig?.updateType == UpdateType.mandatory;

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_isMandatoryUpdate) {
      return _ForceUpdateScreen(
        message: _metadata?.versionConfig?.forceUpdateMessage ??
            'A required update is available. Please update to continue.',
        storeUrls: _metadata?.storeUrls,
      );
    }
    return widget.child;
  }
}

class _ForceUpdateScreen extends StatelessWidget {
  const _ForceUpdateScreen({required this.message, this.storeUrls});

  final String message;
  final StoreUrls? storeUrls;

  Future<void> _openStore() async {
    final url = _storeUrlForPlatform();
    if (url == null || url.isEmpty) return;
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri);
    }
  }

  String? _storeUrlForPlatform() {
    // Platform-specific store URL selection lives in the app shell;
    // callers on iOS/Android should prefer their own store link.
    return storeUrls?.ios.isNotEmpty == true
        ? storeUrls!.ios
        : storeUrls?.android;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.system_update, size: 64),
              const SizedBox(height: 16),
              Text('Update Required', style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 8),
              Text(message, textAlign: TextAlign.center),
              const SizedBox(height: 24),
              FilledButton(onPressed: _openStore, child: const Text('Update Now')),
            ],
          ),
        ),
      ),
    );
  }
}
