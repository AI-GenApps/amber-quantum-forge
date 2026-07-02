import 'dart:math';

/// Mirrors `AIMessage.swift`'s `AIRole`.
enum AIRole {
  user,
  assistant;

  String get wireValue => name;

  static AIRole fromWire(String value) => AIRole.values.firstWhere(
    (r) => r.name == value,
    orElse: () => AIRole.user,
  );
}

/// Mirrors `AIMessage.swift`.
class AIMessage {
  AIMessage({
    String? id,
    required this.role,
    required this.content,
    DateTime? createdAt,
  }) : id = id ?? _generateId(),
       createdAt = createdAt ?? DateTime.now();

  final String id;
  final AIRole role;
  final String content;
  final DateTime createdAt;

  AIMessage copyWith({String? content}) => AIMessage(
    id: id,
    role: role,
    content: content ?? this.content,
    createdAt: createdAt,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'role': role.wireValue,
    'content': content,
    'createdAt': createdAt.toIso8601String(),
  };

  static String _generateId() {
    final random = Random();
    return List.generate(16, (_) => random.nextInt(16).toRadixString(16)).join();
  }
}
