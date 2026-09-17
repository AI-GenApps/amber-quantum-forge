import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:platform_core/platform_core.dart';

import 'snapquest_app.dart';

Future<SaveStore> createSnapQuestSaveStore() async {
  final context = runtimeAppContext(identity: snapQuestIdentity);
  final directory = await getApplicationDocumentsDirectory();
  final destination = JsonFileSaveStore(root: Directory(directory.path));
  final source = JsonFileSaveStore(
    root: Directory('${Directory.systemTemp.path}/w3dev-snapquest'),
  );
  final migration = await migrateSaveIfAbsent(
    context: context,
    destination: destination,
    source: source,
  );
  return migration.store;
}
