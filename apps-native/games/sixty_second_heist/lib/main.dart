import 'package:flutter/material.dart';

import 'src/heist_ui.dart';
import 'src/save_adapter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saveStore = await createSixtySecondHeistSaveStore();
  runApp(SixtySecondHeistApp(saveStore: saveStore));
}
