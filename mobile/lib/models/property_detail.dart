class PropertyDetail {
  final int id;
  final String code;
  final String name;
  final String? address;
  final String? type;
  final double? monthlyRent;
  final String? ownerName;
  final String status;
  final List<RoomDetail> rooms;

  const PropertyDetail({
    required this.id,
    required this.code,
    required this.name,
    this.address,
    this.type,
    this.monthlyRent,
    this.ownerName,
    required this.status,
    required this.rooms,
  });

  /// Create PropertyDetail from JSON
  factory PropertyDetail.fromJson(Map<String, dynamic> json) {
    final roomsList = json['rooms'] as List? ?? [];
    final rooms = roomsList
        .whereType<Map<String, dynamic>>()
        .map((room) => RoomDetail.fromJson(room))
        .toList();

    return PropertyDetail(
      id: json['id'] as int? ?? 0,
      code: json['code'] as String? ?? '',
      name: json['name'] as String? ?? '',
      address: json['address'] as String?,
      type: json['type'] as String?,
      monthlyRent: _parseDouble(json['monthly_rent']),
      ownerName: json['owner_name'] as String?,
      status: json['status'] as String? ?? 'active',
      rooms: rooms,
    );
  }

  /// Convert PropertyDetail to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'code': code,
      'name': name,
      'address': address,
      'type': type,
      'monthly_rent': monthlyRent,
      'owner_name': ownerName,
      'status': status,
      'rooms': rooms.map((r) => r.toJson()).toList(),
    };
  }

  /// Create a copy with modified fields
  PropertyDetail copyWith({
    int? id,
    String? code,
    String? name,
    String? address,
    String? type,
    double? monthlyRent,
    String? ownerName,
    String? status,
    List<RoomDetail>? rooms,
  }) {
    return PropertyDetail(
      id: id ?? this.id,
      code: code ?? this.code,
      name: name ?? this.name,
      address: address ?? this.address,
      type: type ?? this.type,
      monthlyRent: monthlyRent ?? this.monthlyRent,
      ownerName: ownerName ?? this.ownerName,
      status: status ?? this.status,
      rooms: rooms ?? this.rooms,
    );
  }

  /// Get total number of beds
  int get totalBeds {
    int count = 0;
    for (final room in rooms) {
      count += room.beds.length;
    }
    return count;
  }

  /// Get number of occupied beds
  int get occupiedBeds {
    int count = 0;
    for (final room in rooms) {
      for (final bed in room.beds) {
        if (bed.occupantName != null && bed.occupantName!.isNotEmpty) {
          count++;
        }
      }
    }
    return count;
  }

  /// Get number of available beds
  int get availableBeds => totalBeds - occupiedBeds;

  /// Get occupancy percentage
  double get occupancyPercentage {
    if (totalBeds == 0) return 0;
    return (occupiedBeds / totalBeds) * 100;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PropertyDetail &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          code == other.code &&
          name == other.name;

  @override
  int get hashCode => id.hashCode ^ code.hashCode ^ name.hashCode;

  @override
  String toString() =>
      'PropertyDetail(id: $id, code: $code, name: $name, rooms: ${rooms.length})';
}

class RoomDetail {
  final int id;
  final String name;
  final String? roomType;
  final int numBeds;
  final double? monthlyValue;
  final List<BedDetail> beds;

  const RoomDetail({
    required this.id,
    required this.name,
    this.roomType,
    required this.numBeds,
    this.monthlyValue,
    required this.beds,
  });

  /// Create RoomDetail from JSON
  factory RoomDetail.fromJson(Map<String, dynamic> json) {
    final bedsList = json['beds'] as List? ?? [];
    final beds = bedsList
        .whereType<Map<String, dynamic>>()
        .map((bed) => BedDetail.fromJson(bed))
        .toList();

    return RoomDetail(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      roomType: json['type'] as String?,
      numBeds: json['num_beds'] as int? ?? beds.length,
      monthlyValue: _parseDouble(json['monthly_value']),
      beds: beds,
    );
  }

  /// Convert RoomDetail to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': roomType,
      'num_beds': numBeds,
      'monthly_value': monthlyValue,
      'beds': beds.map((b) => b.toJson()).toList(),
    };
  }

  /// Create a copy with modified fields
  RoomDetail copyWith({
    int? id,
    String? name,
    String? roomType,
    int? numBeds,
    double? monthlyValue,
    List<BedDetail>? beds,
  }) {
    return RoomDetail(
      id: id ?? this.id,
      name: name ?? this.name,
      roomType: roomType ?? this.roomType,
      numBeds: numBeds ?? this.numBeds,
      monthlyValue: monthlyValue ?? this.monthlyValue,
      beds: beds ?? this.beds,
    );
  }

  /// Get number of occupied beds in this room
  int get occupiedBeds {
    int count = 0;
    for (final bed in beds) {
      if (bed.occupantName != null && bed.occupantName!.isNotEmpty) {
        count++;
      }
    }
    return count;
  }

  /// Get number of available beds in this room
  int get availableBeds => beds.length - occupiedBeds;

  /// Get occupancy percentage
  double get occupancyPercentage {
    if (beds.isEmpty) return 0;
    return (occupiedBeds / beds.length) * 100;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is RoomDetail &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name;

  @override
  int get hashCode => id.hashCode ^ name.hashCode;

  @override
  String toString() =>
      'RoomDetail(id: $id, name: $name, beds: ${beds.length})';
}

class BedDetail {
  final int id;
  final String name;
  final double? monthlyValue;
  final String? occupantName;

  const BedDetail({
    required this.id,
    required this.name,
    this.monthlyValue,
    this.occupantName,
  });

  /// Create BedDetail from JSON
  factory BedDetail.fromJson(Map<String, dynamic> json) {
    return BedDetail(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      monthlyValue: _parseDouble(json['monthlyValue']),
      occupantName: json['occupantName'] as String?,
    );
  }

  /// Convert BedDetail to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'monthlyValue': monthlyValue,
      'occupantName': occupantName,
    };
  }

  /// Create a copy with modified fields
  BedDetail copyWith({
    int? id,
    String? name,
    double? monthlyValue,
    String? occupantName,
  }) {
    return BedDetail(
      id: id ?? this.id,
      name: name ?? this.name,
      monthlyValue: monthlyValue ?? this.monthlyValue,
      occupantName: occupantName ?? this.occupantName,
    );
  }

  /// Check if bed is occupied
  bool get isOccupied => occupantName != null && occupantName!.isNotEmpty;

  /// Check if bed is available
  bool get isAvailable => !isOccupied;

  /// Format monthly value as currency
  String get monthlyValueFormatted {
    if (monthlyValue == null) return 'N/A';
    return '\$${monthlyValue!.toStringAsFixed(2)}';
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is BedDetail &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name;

  @override
  int get hashCode => id.hashCode ^ name.hashCode;

  @override
  String toString() =>
      'BedDetail(id: $id, name: $name, occupied: $isOccupied)';
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
