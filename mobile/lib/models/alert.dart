class Alert {
  final int id;
  final String type;
  final String severity; // info, warning, critical
  final String? title;
  final String message;
  final String? entityType;
  final int? entityId;
  final bool resolved;
  final DateTime? createdAt;

  const Alert({
    required this.id,
    required this.type,
    required this.severity,
    this.title,
    required this.message,
    this.entityType,
    this.entityId,
    required this.resolved,
    this.createdAt,
  });

  /// Create Alert from JSON
  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      id: json['id'] as int? ?? 0,
      type: json['type'] as String? ?? '',
      severity: json['severity'] as String? ?? 'info',
      title: json['title'] as String?,
      message: json['message'] as String? ?? '',
      entityType: json['entity_type'] as String?,
      entityId: json['entity_id'] as int?,
      resolved: json['resolved'] as bool? ?? false,
      createdAt: _parseDateTime(json['created_at']),
    );
  }

  /// Convert Alert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'severity': severity,
      'title': title,
      'message': message,
      'entity_type': entityType,
      'entity_id': entityId,
      'resolved': resolved,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  /// Create a copy with modified fields
  Alert copyWith({
    int? id,
    String? type,
    String? severity,
    String? title,
    String? message,
    String? entityType,
    int? entityId,
    bool? resolved,
    DateTime? createdAt,
  }) {
    return Alert(
      id: id ?? this.id,
      type: type ?? this.type,
      severity: severity ?? this.severity,
      title: title ?? this.title,
      message: message ?? this.message,
      entityType: entityType ?? this.entityType,
      entityId: entityId ?? this.entityId,
      resolved: resolved ?? this.resolved,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Check if alert is critical
  bool get isCritical => severity.toLowerCase() == 'critical';

  /// Check if alert is warning
  bool get isWarning => severity.toLowerCase() == 'warning';

  /// Check if alert is info
  bool get isInfo => severity.toLowerCase() == 'info';

  /// Get severity level as integer (for sorting)
  int get severityLevel => switch (severity.toLowerCase()) {
        'critical' => 3,
        'warning' => 2,
        'info' => 1,
        _ => 0,
      };

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Alert &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          type == other.type &&
          severity == other.severity;

  @override
  int get hashCode => id.hashCode ^ type.hashCode ^ severity.hashCode;

  @override
  String toString() =>
      'Alert(id: $id, type: $type, severity: $severity, resolved: $resolved)';
}

/// Helper function to parse DateTime from JSON
DateTime? _parseDateTime(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String && value.isNotEmpty) {
    return DateTime.tryParse(value);
  }
  return null;
}
