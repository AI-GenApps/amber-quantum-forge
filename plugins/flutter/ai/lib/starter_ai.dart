/// Streaming AI chat client for the Flutter app.
///
/// Mirrors `plugins/ios/ai` (StarterAI): a `POST /api/ai/chat` SSE-ish
/// stream parsed with a Dart port of `VercelDataStreamParser`.
library starter_ai;

export 'src/ai_error.dart';
export 'src/ai_message.dart';
export 'src/ai_session.dart';
export 'src/networking/ai_network_client.dart';
export 'src/on_device_ai_session.dart';
export 'src/parsing/vercel_data_stream_parser.dart';
export 'src/remote_ai_session.dart';
