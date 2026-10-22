import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:platform_core/platform_core.dart';

import 'telemetry/merge_relay_outbox_store.dart';

Future<MergeRelayOutboxStore> createMergeRelayOutboxStore() async {
  final directory = await getApplicationDocumentsDirectory();
  return FileMergeRelayOutboxStore(
    File('${directory.path}/merge_relay_event_outbox.json'),
  );
}

Future<SaveStore> createMergeRelaySaveStore() async {
  final directory = await getApplicationDocumentsDirectory();
  return JsonFileSaveStore(root: Directory(directory.path));
}
