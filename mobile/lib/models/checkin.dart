class CheckInOut {
  final int id;
  final String type;
  final String? notes;
  final String? photoUrl;
  final DateTime? createdAt;

  const CheckInOut({
    required this.id,
    required this.type,
    this.notes,
    this.photoUrl,
    this.createdAt,
  });

  factory CheckInOut.fromJson(Map<String, dynamic> json) {
    return CheckInOut(
      id: json['id'] as int? ?? 0,
      type: json['type'] as String? ?? 'checkin',
      notes: json['notes'] as String?,
      photoUrl: json['photo_url'] as String?,
      createdAt: _parseDateTime(json['created_at']),
    );
  }

  bool get isCheckIn => type == 'checkin';
}

DateTime? _parseDateTime(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
  return null;
}
