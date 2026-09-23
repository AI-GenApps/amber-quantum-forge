import 'package:flutter/material.dart';
import 'package:platform_core/platform_core.dart';

import 'src/merge_relay_app.dart';
import 'src/merge_relay_client.dart';
import 'src/merge_relay_content.dart';
import 'src/save_adapter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saveStore = await createMergeRelaySaveStore();
  MergeRelayContentCatalog? content;
  String? contentError;
  try {
    content = await MergeRelayContentCatalog.load();
  } on MergeRelayContentLoadException catch (error) {
    contentError = error.toString();
  }
  final context = runtimeAppContext(identity: mergeRelayIdentity);
  final relayClient = contentError == null
      ? createMergeRelayClient(context: context, saveStore: saveStore)
      : null;
  runApp(
    MergeRelayApp(
      content: content,
      contentError: contentError,
      saveStore: relayClient?.saveStore ?? saveStore,
      relayController: relayClient?.controller,
    ),
  );
}
