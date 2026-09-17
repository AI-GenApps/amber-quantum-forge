import 'package:flutter/material.dart';

import 'src/pocket_biome_app.dart';
import 'src/save_adapter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saveStore = await createPocketBiomeSaveStore();
  runApp(PocketBiomeApp(saveStore: saveStore));
}
