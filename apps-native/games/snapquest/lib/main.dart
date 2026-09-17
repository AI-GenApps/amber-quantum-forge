import 'package:flutter/material.dart';

import 'capabilities/camera_capture_capability.dart';
import 'capabilities/camera_package_frame_source.dart';
import 'save_adapter.dart';
import 'snapquest_app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final saveStore = await createSnapQuestSaveStore();
  runApp(
    SnapQuestApp(
      saveStore: saveStore,
      cameraFactory: () =>
          CameraCaptureCapability(source: CameraPackageFrameSource()),
    ),
  );
}
