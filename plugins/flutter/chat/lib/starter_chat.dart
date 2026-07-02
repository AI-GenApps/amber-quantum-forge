/// Chat UI, local persistence, and sync for the Flutter app.
///
/// Mirrors `plugins/ios/chat-module` (StarterChat). Depends on
/// `starter_auth` (authenticated requests) and `starter_ai` (streaming).
library starter_chat;

export 'src/models/chat_message.dart';
export 'src/models/chat_session.dart';
export 'src/store/chat_store.dart';
export 'src/sync/sync_client.dart';
export 'src/sync/sync_models.dart';
export 'src/view_models/chat_view_model.dart';
export 'src/views/chat_input.dart';
export 'src/views/chat_view.dart';
export 'src/views/message_bubble.dart';
export 'src/views/typing_indicator.dart';
