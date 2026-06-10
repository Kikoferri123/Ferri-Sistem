class Contract {
  final int id;
  final String type;
  final int? clientId;
  final String? clientName;
  final int? propertyId;
  final String? propertyName;
  final DateTime? startDate;
  final DateTime? endDate;
  final double? value;
  final String status;
  final String? fileUrl;
  final bool signed;
  final String? signToken;
  final bool hasSignatureLicensee;
  final bool hasSignatureLicensor;
  final String? notes;
  final DateTime? createdAt;

  const Contract({
    required this.id,
    required this.type,
    this.clientId,
    this.clientName,
    this.propertyId,
    this.propertyName,
    this.startDate,
    this.endDate,
    this.value,
    required this.status,
    this.fileUrl,
    required this.signed,
    this.signToken,
    required this.hasSignatureLicensee,
    required this.hasSignatureLicensor,
    this.notes,
    this.createdAt,
  });

  /// Create Contract from JSON
  factory Contract.fromJson(Map<String, dynamic> json) {
    return Contract(
      id: json['id'] as int? ?? 0,
      type: json['type'] as String? ?? '',
      clientId: json['client_id'] as int?,
      clientName: json['client_name'] as String?,
      propertyId: json['property_id'] as int?,
      propertyName: json['property_name'] as String?,
      startDate: _parseDateTime(json['start_date']),
      endDate: _parseDateTime(json['end_date']),
      value: _parseDouble(json['value']),
      status: json['status'] as String? ?? 'pending',
      fileUrl: json['file_url'] as String?,
      signed: json['signed'] as bool? ?? false,
      signToken: json['sign_token'] as String?,
      hasSignatureLicensee: json['signature_licensee'] != null,
      hasSignatureLicensor: json['signature_licensor'] != null,
      notes: json['notes'] as String?,
      createdAt: _parseDateTime(json['created_at']),
    );
  }

  /// Convert Contract to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'client_id': clientId,
      'client_name': clientName,
      'property_id': propertyId,
      'property_name': propertyName,
      'start_date': startDate?.toIso8601String(),
      'end_date': endDate?.toIso8601String(),
      'value': value,
      'status': status,
      'file_url': fileUrl,
      'signed': signed,
      'sign_token': signToken,
      'signature_licensee': hasSignatureLicensee,
      'signature_licensor': hasSignatureLicensor,
      'notes': notes,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  /// Create a copy with modified fields
  Contract copyWith({
    int? id,
    String? type,
    int? clientId,
    String? clientName,
    int? propertyId,
    String? propertyName,
    DateTime? startDate,
    DateTime? endDate,
    double? value,
    String? status,
    String? fileUrl,
    bool? signed,
    String? signToken,
    bool? hasSignatureLicensee,
    bool? hasSignatureLicensor,
    String? notes,
    DateTime? createdAt,
  }) {
    return Contract(
      id: id ?? this.id,
      type: type ?? this.type,
      clientId: clientId ?? this.clientId,
      clientName: clientName ?? this.clientName,
      propertyId: propertyId ?? this.propertyId,
      propertyName: propertyName ?? this.propertyName,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
      value: value ?? this.value,
      status: status ?? this.status,
      fileUrl: fileUrl ?? this.fileUrl,
      signed: signed ?? this.signed,
      signToken: signToken ?? this.signToken,
      hasSignatureLicensee: hasSignatureLicensee ?? this.hasSignatureLicensee,
      hasSignatureLicensor: hasSignatureLicensor ?? this.hasSignatureLicensor,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Check if contract is active
  bool get isActive {
    final now = DateTime.now();
    if (startDate != null && now.isBefore(startDate!)) return false;
    if (endDate != null && now.isAfter(endDate!)) return false;
    return status == 'active' || status == 'signed';
  }

  /// Check if contract can be signed
  bool get canBeSigned => !signed && signToken != null && signToken!.isNotEmpty;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Contract &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          type == other.type &&
          status == other.status;

  @override
  int get hashCode => id.hashCode ^ type.hashCode ^ status.hashCode;

  @override
  String toString() =>
      'Contract(id: $id, type: $type, status: $status, signed: $signed)';
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
