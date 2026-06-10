class NewsItem {
  final int id;
  final String title;
  final String body;
  final String? category;
  final String? imageUrl;
  final DateTime? createdAt;

  const NewsItem({
    required this.id,
    required this.title,
    required this.body,
    this.category,
    this.imageUrl,
    this.createdAt,
  });

  factory NewsItem.fromJson(Map<String, dynamic> json) {
    return NewsItem(
      id: json['id'] as int? ?? 0,
      title: json['title'] as String? ?? '',
      body: json['body'] as String? ?? '',
      category: json['category'] as String?,
      imageUrl: json['image_url'] as String?,
      createdAt: _parseDateTime(json['created_at']),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'body': body,
    'category': category,
    'image_url': imageUrl,
    'created_at': createdAt?.toIso8601String(),
  };
}

DateTime? _parseDateTime(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
  return null;
}
