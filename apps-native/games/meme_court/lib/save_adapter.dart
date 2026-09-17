import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:platform_core/platform_core.dart';

import 'meme_court_app.dart';

Future<SaveStore> createMemeCourtSaveStore() async {
  final context = runtimeAppContext(identity: memeCourtIdentity);
  final directory = await getApplicationDocumentsDirectory();
  final destination = JsonFileSaveStore(root: Directory(directory.path));
  final source = JsonFileSaveStore(
    root: Directory('${Directory.systemTemp.path}/w3dev-meme-court'),
  );
  final migration = await migrateSaveIfAbsent(
    context: context,
    destination: destination,
    source: source,
  );
  return migration.store;
}
