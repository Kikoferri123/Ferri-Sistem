class Message {
  final int id;
  final String senderType;
  final String senderName;
  final String? subject;
  final String body;
  final bool read;
  final DateTime? createdAt;

  const Message({
    required this.id,
    required this.senderType,
    required this.senderName,
    this.subject,
    required this.body,
    required this.read,
    this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as int? ?? 0,
      senderType: json['sender_type'] as String? ?? 'client',
      senderName: json['sender_name'] as String? ?? '',
      subject: json['subject'] as String?,
      body: json['body'] as String? ?? '',
      read: json['read'] as bool? ?? false,
      createdAt: _parseDateTime(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'sender_type': senderType,
    'sender_name': senderName,
    'subject': subject,
    'body': body,
    'read': read,
    'created_at': createdAt?.toIso8601String(),
  };

  bool get isFromCompany => senderType == 'company';
}

DateTime? _parseDateTime(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
  return null;
}
