import 'package:flutter/material.dart';

import 'src/app.dart';

void main() {
  // Guarded, optional bootstrap: nothing here depends on Firebase or any
  // network/config service. The app must boot straight to local/offline
  // modes even when no Firebase config (e.g. google-services.json) is
  // present. Task 24 adds a guarded Firebase init point; it must not remove
  // this guarantee.
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const LudoApp());
}
