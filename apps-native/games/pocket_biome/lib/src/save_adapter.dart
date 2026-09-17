import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:platform_core/platform_core.dart';

Future<SaveStore> createPocketBiomeSaveStore() async {
  final directory = await getApplicationDocumentsDirectory();
  return JsonFileSaveStore(root: Directory(directory.path));
}
