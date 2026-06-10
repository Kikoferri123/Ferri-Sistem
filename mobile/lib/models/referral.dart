class Referral {
  final int id;
  final String friendName;
  final String friendEmail;
  final String? friendPhone;
  final String status;
  final int pointsAwarded;
  final DateTime? createdAt;

  const Referral({
    required this.id,
    required this.friendName,
    required this.friendEmail,
    this.friendPhone,
    required this.status,
    required this.pointsAwarded,
    this.createdAt,
  });

  factory Referral.fromJson(Map<String, dynamic> json) {
    return Referral(
      id: json['id'] as int? ?? 0,
      friendName: json['friend_name'] as String? ?? '',
      friendEmail: json['friend_email'] as String? ?? '',
      friendPhone: json['friend_phone'] as String?,
      status: json['status'] as String? ?? 'pending',
      pointsAwarded: json['points_awarded'] as int? ?? 0,
      createdAt: _parseDateTime(json['created_at']),
    );
  }
}

DateTime? _parseDateTime(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
  return null;
}
