class Payment {
  final int id;
  final DateTime date;
  final String? description;
  final String? method;
  final double amount;
  final String? category;
  final int? propertyId;
  final String? propertyName;
  final int? clientId;
  final String? clientName;
  final int? roomId;
  final String? roomName;
  final int? bedId;
  final String? bedName;
  final int? competenciaMonth;
  final int? competenciaYear;
  final String? invoice;
  final String? lodgement;
  final DateTime? createdAt;

  const Payment({
    required this.id,
    required this.date,
    this.description,
    this.method,
    required this.amount,
    this.category,
    this.propertyId,
    this.propertyName,
    this.clientId,
    this.clientName,
    this.roomId,
    this.roomName,
    this.bedId,
    this.bedName,
    this.competenciaMonth,
    this.competenciaYear,
    this.invoice,
    this.lodgement,
    this.createdAt,
  });

  /// Create Payment from JSON
  factory Payment.fromJson(Map<String, dynamic> json) {
    return Payment(
      id: json['id'] as int? ?? 0,
      date: _parseDateTime(json['date']) ?? DateTime.now(),
      description: json['description'] as String?,
      method: json['method'] as String?,
      amount: _parseDouble(json['amount']) ?? 0.0,
      category: json['category'] as String?,
      propertyId: json['property_id'] as int?,
      propertyName: json['property_name'] as String?,
      clientId: json['client_id'] as int?,
      clientName: json['client_name'] as String?,
      roomId: json['room_id'] as int?,
      roomName: json['room_name'] as String?,
      bedId: json['bed_id'] as int?,
      bedName: json['bed_name'] as String?,
      competenciaMonth: json['competencia_month'] as int?,
      competenciaYear: json['competencia_year'] as int?,
      invoice: json['invoice'] as String?,
      lodgement: json['lodgement'] as String?,
      createdAt: _parseDateTime(json['created_at']),
    );
  }

  /// Convert Payment to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'date': date.toIso8601String(),
      'description': description,
      'method': method,
      'amount': amount,
      'category': category,
      'property_id': propertyId,
      'property_name': propertyName,
      'client_id': clientId,
      'client_name': clientName,
      'room_id': roomId,
      'room_name': roomName,
      'bed_id': bedId,
      'bed_name': bedName,
      'competencia_month': competenciaMonth,
      'competencia_year': competenciaYear,
      'invoice': invoice,
      'lodgement': lodgement,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  /// Create a copy with modified fields
  Payment copyWith({
    int? id,
    DateTime? date,
    String? description,
    String? method,
    double? amount,
    String? category,
    int? propertyId,
    String? propertyName,
    int? clientId,
    String? clientName,
    int? roomId,
    String? roomName,
    int? bedId,
    String? bedName,
    int? competenciaMonth,
    int? competenciaYear,
    String? invoice,
    String? lodgement,
    DateTime? createdAt,
  }) {
    return Payment(
      id: id ?? this.id,
      date: date ?? this.date,
      description: description ?? this.description,
      method: method ?? this.method,
      amount: amount ?? this.amount,
      category: category ?? this.category,
      propertyId: propertyId ?? this.propertyId,
      propertyName: propertyName ?? this.propertyName,
      clientId: clientId ?? this.clientId,
      clientName: clientName ?? this.clientName,
      roomId: roomId ?? this.roomId,
      roomName: roomName ?? this.roomName,
      bedId: bedId ?? this.bedId,
      bedName: bedName ?? this.bedName,
      competenciaMonth: competenciaMonth ?? this.competenciaMonth,
      competenciaYear: competenciaYear ?? this.competenciaYear,
      invoice: invoice ?? this.invoice,
      lodgement: lodgement ?? this.lodgement,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Get competencia as formatted string (month/year)
  String get competenciaFormatted {
    if (competenciaMonth == null || competenciaYear == null) {
      return 'N/A';
    }
    return '${competenciaMonth.toString().padLeft(2, '0')}/${competenciaYear.toString()}';
  }

  /// Format amount as currency
  String get amountFormatted {
    return '\$${amount.toStringAsFixed(2)}';
  }

  /// Get payment status based on date
  String get status {
    final now = DateTime.now();
    if (date.isBefore(now)) {
      return 'paid';
    } else if (date.difference(now).inDays <= 7) {
      return 'due_soon';
    } else {
      return 'pending';
    }
  }

  /// Check if payment is overdue
  bool get isOverdue {
    final now = DateTime.now();
    return date.isBefore(now);
  }

  /// Check if payment is due soon (within 7 days)
  bool get isDueSoon {
    final now = DateTime.now();
    final daysUntilDue = date.difference(now).inDays;
    return daysUntilDue <= 7 && daysUntilDue >= 0;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Payment &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          date == other.date &&
          amount == other.amount;

  @override
  int get hashCode => id.hashCode ^ date.hashCode ^ amount.hashCode;

  @override
  String toString() =>
      'Payment(id: $id, date: $date, amount: $amount, category: $category)';
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
