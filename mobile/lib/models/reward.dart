class RewardInfo {
  final int totalPoints;
  final String level;
  final int streakMonths;
  final String? nextLevel;
  final int pointsToNextLevel;
  final List<RewardTransaction> transactions;

  const RewardInfo({
    required this.totalPoints,
    required this.level,
    required this.streakMonths,
    this.nextLevel,
    required this.pointsToNextLevel,
    required this.transactions,
  });

  factory RewardInfo.fromJson(Map<String, dynamic> json) {
    return RewardInfo(
      totalPoints: json['total_points'] as int? ?? 0,
      level: json['level'] as String? ?? 'Bronze',
      streakMonths: json['streak_months'] as int? ?? 0,
      nextLevel: json['next_level'] as String?,
      pointsToNextLevel: json['points_to_next_level'] as int? ?? 0,
      transactions: (json['transactions'] as List? ?? [])
          .whereType<Map<String, dynamic>>()
          .map((j) => RewardTransaction.fromJson(j))
          .toList(),
    );
  }

  double get levelProgress {
    final thresholds = {'Bronze': 500, 'Silver': 1500, 'Gold': 5000, 'Platinum': 999999};
    final currentMin = {'Bronze': 0, 'Silver': 500, 'Gold': 1500, 'Platinum': 5000};
    final max = thresholds[level] ?? 500;
    final min = currentMin[level] ?? 0;
    if (max == min) return 1.0;
    return ((totalPoints - min) / (max - min)).clamp(0.0, 1.0);
  }
}

class RewardTransaction {
  final int id;
  final int points;
  final String type;
  final String? description;
  final DateTime? createdAt;

  const RewardTransaction({
    required this.id,
    required this.points,
    required this.type,
    this.description,
    this.createdAt,
  });

  factory RewardTransaction.fromJson(Map<String, dynamic> json) {
    return RewardTransaction(
      id: json['id'] as int? ?? 0,
      points: json['points'] as int? ?? 0,
      type: json['type'] as String? ?? '',
      description: json['description'] as String?,
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
