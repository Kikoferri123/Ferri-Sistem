class ClientProfile {
  final int id;
  final String code;
  final String name;
  final String? email;
  final String? phone;
  final String? nationality;
  final DateTime? birthDate;
  final String? documentId;
  final String status;
  final int? propertyId;
  final String? propertyName;
  final int? roomId;
  final String? roomName;
  final int? bedId;
  final String? bedName;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final double? monthlyValue;
  final String? paymentMethod;
  final String? notes;
  final DateTime? createdAt;
  // Contract info
  final int? contractId;
  final String? contractType;
  final DateTime? contractStartDate;
  final DateTime? contractEndDate;
  final double? contractValue;
  final String? contractStatus;
  final bool? contractSigned;
  final String? contractFileUrl;
  // My room/bed (specific to this client)
  final String? myRoomName;
  final String? myRoomType;
  final double? myRoomValue;
  final String? myBedName;
  final double? myBedValue;

  const ClientProfile({
    required this.id,
    required this.code,
    required this.name,
    this.email,
    this.phone,
    this.nationality,
    this.birthDate,
    this.documentId,
    required this.status,
    this.propertyId,
    this.propertyName,
    this.roomId,
    this.roomName,
    this.bedId,
    this.bedName,
    this.checkIn,
    this.checkOut,
    this.monthlyValue,
    this.paymentMethod,
    this.notes,
    this.createdAt,
    this.contractId,
    this.contractType,
    this.contractStartDate,
    this.contractEndDate,
    this.contractValue,
    this.contractStatus,
    this.contractSigned,
    this.contractFileUrl,
    this.myRoomName,
    this.myRoomType,
    this.myRoomValue,
    this.myBedName,
    this.myBedValue,
  });

  /// Create ClientProfile from JSON
  factory ClientProfile.fromJson(Map<String, dynamic> json) {
    // Parse nested property info if available
    Map<String, dynamic>? prop;
    try {
      prop = json['property'] is Map ? Map<String, dynamic>.from(json['property'] as Map) : null;
    } catch (_) {
      prop = null;
    }

    return ClientProfile(
      id: _parseInt(json['id']) ?? 0,
      code: json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      nationality: json['nationality']?.toString(),
      birthDate: _parseDateTime(json['birth_date'] ?? json['birthDate']),
      documentId: json['document_id']?.toString() ?? json['documentId']?.toString(),
      status: json['status']?.toString() ?? 'ativo',
      propertyId: _parseInt(json['property_id']) ?? _parseInt(json['propertyId']) ?? _parseInt(prop?['id']),
      propertyName: json['property_name']?.toString() ?? json['propertyName']?.toString() ?? prop?['name']?.toString(),
      roomId: _parseInt(json['room_id']) ?? _parseInt(json['roomId']),
      roomName: json['room_name']?.toString() ?? json['roomName']?.toString(),
      bedId: _parseInt(json['bed_id']) ?? _parseInt(json['bedId']),
      bedName: json['bed_name']?.toString() ?? json['bedName']?.toString(),
      checkIn: _parseDateTime(json['check_in'] ?? json['checkIn']),
      checkOut: _parseDateTime(json['check_out'] ?? json['checkOut']),
      monthlyValue: _parseDouble(json['monthly_value'] ?? json['monthlyValue']),
      paymentMethod: json['payment_method']?.toString() ?? json['paymentMethod']?.toString(),
      notes: json['notes']?.toString(),
      createdAt: _parseDateTime(json['created_at'] ?? json['createdAt']),
      // Contract info
      contractId: _parseInt(_safeMap(json['contract'])?['id']),
      contractType: _safeMap(json['contract'])?['type']?.toString(),
      contractStartDate: _parseDateTime(_safeMap(json['contract'])?['start_date']),
      contractEndDate: _parseDateTime(_safeMap(json['contract'])?['end_date']),
      contractValue: _parseDouble(_safeMap(json['contract'])?['value']),
      contractStatus: _safeMap(json['contract'])?['status']?.toString(),
      contractSigned: _safeMap(json['contract'])?['signed'] as bool?,
      contractFileUrl: _safeMap(json['contract'])?['file_url']?.toString(),
      // My room/bed
      myRoomName: _safeMap(json['my_room'])?['name']?.toString(),
      myRoomType: _safeMap(json['my_room'])?['type']?.toString(),
      myRoomValue: _parseDouble(_safeMap(json['my_room'])?['monthly_value']),
      myBedName: _safeMap(json['my_bed'])?['name']?.toString(),
      myBedValue: _parseDouble(_safeMap(json['my_bed'])?['monthly_value']),
    );
  }

  /// Convert ClientProfile to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'email': email,
      'phone': phone,
      'nationality': nationality,
      'birthDate': birthDate?.toIso8601String(),
      'documentId': documentId,
      'status': status,
      'propertyId': propertyId,
      'propertyName': propertyName,
      'roomId': roomId,
      'roomName': roomName,
      'bedId': bedId,
      'bedName': bedName,
      'checkIn': checkIn?.toIso8601String(),
      'checkOut': checkOut?.toIso8601String(),
      'monthlyValue': monthlyValue,
      'paymentMethod': paymentMethod,
      'notes': notes,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  /// Create a copy with modified fields
  ClientProfile copyWith({
    int? id,
    String? code,
    String? name,
    String? email,
    String? phone,
    String? nationality,
    DateTime? birthDate,
    String? documentId,
    String? status,
    int? propertyId,
    String? propertyName,
    int? roomId,
    String? roomName,
    int? bedId,
    String? bedName,
    DateTime? checkIn,
    DateTime? checkOut,
    double? monthlyValue,
    String? paymentMethod,
    String? notes,
    DateTime? createdAt,
  }) {
    return ClientProfile(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      nationality: nationality ?? this.nationality,
      birthDate: birthDate ?? this.birthDate,
      documentId: documentId ?? this.documentId,
      status: status ?? this.status,
      propertyId: propertyId ?? this.propertyId,
      propertyName: propertyName ?? this.propertyName,
      roomId: roomId ?? this.roomId,
      roomName: roomName ?? this.roomName,
      bedId: bedId ?? this.bedId,
      bedName: bedName ?? this.bedName,
      checkIn: checkIn ?? this.checkIn,
      checkOut: checkOut ?? this.checkOut,
      monthlyValue: monthlyValue ?? this.monthlyValue,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      notes: notes ?? this.notes,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ClientProfile &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          code == other.code &&
          name == other.name;

  @override
  int get hashCode => id.hashCode ^ code.hashCode ^ name.hashCode;

  @override
  String toString() =>
      'ClientProfile(id: $id, code: $code, name: $name, status: $status)';
}

/// Helper to safely cast to Map<String, dynamic>
Map<String, dynamic>? _safeMap(dynamic value) {
  if (value == null) return null;
  if (value is Map<String, dynamic>) return value;
  if (value is Map) return Map<String, dynamic>.from(value);
  return null;
}

/// Helper function to parse int from JSON
int? _parseInt(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String && value.isNotEmpty) return int.tryParse(value);
  return null;
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
