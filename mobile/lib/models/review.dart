class Review {
  final int id;
  final int rating;
  final String? comment;
  final String? response;
  final DateTime? createdAt;

  const Review({
    required this.id,
    required this.rating,
    this.comment,
    this.response,
    this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'] as int? ?? 0,
      rating: json['rating'] as int? ?? 0,
      comment: json['comment'] as String?,
      response: json['response'] as String?,
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
