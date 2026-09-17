import 'package:flutter/material.dart';

import 'src/merge_relay_app.dart';
import 'src/save_adapter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saveStore = await createMergeRelaySaveStore();
  runApp(MergeRelayApp(saveStore: saveStore));
}
