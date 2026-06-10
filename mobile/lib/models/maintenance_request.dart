class MaintenanceRequest {
  final int id;
  final int propertyId;
  final String? propertyName;
  final String title;
  final String? description;
  final String status; // aberto, em_andamento, concluido, cancelado
  final String priority; // baixa, media, alta, urgente
  final double? cost;
  final String? createdBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? resolvedAt;

  const MaintenanceRequest({
    required this.id,
    required this.propertyId,
    this.propertyName,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    this.cost,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
    this.resolvedAt,
  });

  /// Create MaintenanceRequest from JSON
  factory MaintenanceRequest.fromJson(Map<String, dynamic> json) {
    return MaintenanceRequest(
      id: json['id'] as int? ?? 0,
      propertyId: json['property_id'] as int? ?? 0,
      propertyName: json['property_name'] as String?,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'aberto',
      priority: json['priority'] as String? ?? 'media',
      cost: _parseDouble(json['cost']),
      createdBy: json['created_by'] as String?,
      createdAt: _parseDateTime(json['created_at']),
      updatedAt: _parseDateTime(json['updated_at']),
      resolvedAt: _parseDateTime(json['resolved_at']),
    );
  }

  /// Convert MaintenanceRequest to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'property_id': propertyId,
      'property_name': propertyName,
      'title': title,
      'description': description,
      'status': status,
      'priority': priority,
      'cost': cost,
      'created_by': createdBy,
      'created_at': createdAt?.toIso8601String(),
      'updated_at': updatedAt?.toIso8601String(),
      'resolved_at': resolvedAt?.toIso8601String(),
    };
  }

  /// Create a copy with modified fields
  MaintenanceRequest copyWith({
    int? id,
    int? propertyId,
    String? propertyName,
    String? title,
    String? description,
    String? status,
    String? priority,
    double? cost,
    String? createdBy,
    DateTime? createdAt,
    DateTime? updatedAt,
    DateTime? resolvedAt,
  }) {
    return MaintenanceRequest(
      id: id ?? this.id,
      propertyId: propertyId ?? this.propertyId,
      propertyName: propertyName ?? this.propertyName,
      title: title ?? this.title,
      description: description ?? this.description,
      status: status ?? this.status,
      priority: priority ?? this.priority,
      cost: cost ?? this.cost,
      createdBy: createdBy ?? this.createdBy,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      resolvedAt: resolvedAt ?? this.resolvedAt,
    );
  }

  /// Get priority level as integer (for sorting)
  int get priorityLevel => switch (priority.toLowerCase()) {
        'urgente' => 4,
        'alta' => 3,
        'media' => 2,
        'baixa' => 1,
        _ => 0,
      };

  /// Check if request is open
  bool get isOpen => status.toLowerCase() == 'aberto';

  /// Check if request is in progress
  bool get isInProgress => status.toLowerCase() == 'em_andamento';

  /// Check if request is completed
  bool get isCompleted => status.toLowerCase() == 'concluido';

  /// Check if request is cancelled
  bool get isCancelled => status.toLowerCase() == 'cancelado';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MaintenanceRequest &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          propertyId == other.propertyId &&
          title == other.title;

  @override
  int get hashCode => id.hashCode ^ propertyId.hashCode ^ title.hashCode;

  @override
  String toString() =>
      'MaintenanceRequest(id: $id, title: $title, status: $status, priority: $priority)';
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

/// Helper function to parse double from JSON
double? _parseDouble(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String && value.isNotEmpty) {
    return double.tryParse(value);
  }
  return null;
}
