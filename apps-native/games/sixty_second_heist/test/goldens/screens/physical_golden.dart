import 'dart:ui' as ui;

import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

/// Captures [finder]'s nearest [RepaintBoundary] ancestor at the test
/// view's device pixel ratio, so the resulting golden PNG is exactly
/// `tester.view.physicalSize` pixels.
///
/// `matchesGoldenFile(Finder)` on its own does not do this: `MaterialApp`'s
/// `Navigator`/`ModalRoute` machinery wraps every route's content in its
/// own `RepaintBoundary`, and `captureImage()` (what `matchesGoldenFile`
/// uses for a `Finder`) always calls `toImage()` on the *nearest* boundary
/// with the default `pixelRatio: 1.0` — i.e. one output pixel per
/// *logical* pixel of that boundary, ignoring `tester.view.devicePixelRatio`
/// entirely. The result is a PNG sized `physicalSize / devicePixelRatio`
/// (e.g. 360x800 instead of the requested 1080x2400).
///
/// This walks up to that same boundary but calls `toImage(pixelRatio:
/// tester.view.devicePixelRatio)` explicitly, which rasterizes at
/// `logicalSize * devicePixelRatio` — the requested physical size.
Future<ui.Image> capturePhysicalGolden(WidgetTester tester, Finder finder) {
  final element = finder.evaluate().single;
  var renderObject = element.renderObject!;
  while (!renderObject.isRepaintBoundary) {
    renderObject = renderObject.parent!;
  }
  final boundary = renderObject as RenderRepaintBoundary;
  return boundary.toImage(pixelRatio: tester.view.devicePixelRatio);
}
