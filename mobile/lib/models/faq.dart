class FaqItem {
  final int id;
  final String question;
  final String answer;
  final String? category;
  final int sortOrder;

  const FaqItem({
    required this.id,
    required this.question,
    required this.answer,
    this.category,
    required this.sortOrder,
  });

  factory FaqItem.fromJson(Map<String, dynamic> json) {
    return FaqItem(
      id: json['id'] as int? ?? 0,
      question: json['question'] as String? ?? '',
      answer: json['answer'] as String? ?? '',
      category: json['category'] as String?,
      sortOrder: json['sort_order'] as int? ?? 0,
    );
  }
}
