import 'package:flutter/material.dart';

import 'meme_court_app.dart';
import 'save_adapter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saveStore = await createMemeCourtSaveStore();
  runApp(MemeCourtApp(saveStore: saveStore));
}
