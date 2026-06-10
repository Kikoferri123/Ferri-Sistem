class Document {
  final int id;
  final String name;
  final String? type;
  final String? category;
  final String? fileUrl;
  final int? fileSize;
  final int? propertyId;
  final String? propertyName;
  final int? clientId;
  final String? clientName;
  final DateTime? uploadedAt;
  final DateTime? createdAt;

  const Document({
    required this.id,
    required this.name,
    this.type,
    this.category,
    this.fileUrl,
    this.fileSize,
    this.propertyId,
    this.propertyName,
    this.clientId,
    this.clientName,
    this.uploadedAt,
    this.createdAt,
  });

  /// Create Document from JSON
  factory Document.fromJson(Map<String, dynamic> json) {
    return Document(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      type: json['type'] as String?,
      category: json['category'] as String?,
      fileUrl: json['file_url'] as String?,
      fileSize: json['file_size'] as int?,
      propertyId: json['property_id'] as int?,
      propertyName: json['property_name'] as String?,
      clientId: json['client_id'] as int?,
      clientName: json['client_name'] as String?,
      uploadedAt: _parseDateTime(json['uploaded_at']),
      createdAt: _parseDateTime(json['created_at']),
    );
  }

  /// Convert Document to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type,
      'category': category,
      'file_url': fileUrl,
      'file_size': fileSize,
      'property_id': propertyId,
      'property_name': propertyName,
      'client_id': clientId,
      'client_name': clientName,
      'uploaded_at': uploadedAt?.toIso8601String(),
      'created_at': createdAt?.toIso8601String(),
    };
  }

  /// Create a copy with modified fields
  Document copyWith({
    int? id,
    String? name,
    String? type,
    String? category,
    String? fileUrl,
    int? fileSize,
    int? propertyId,
    String? propertyName,
    int? clientId,
    String? clientName,
    DateTime? uploadedAt,
    DateTime? createdAt,
  }) {
    return Document(
      id: id ?? this.id,
      name: name ?? this.name,
      type: type ?? this.type,
      category: category ?? this.category,
      fileUrl: fileUrl ?? this.fileUrl,
      fileSize: fileSize ?? this.fileSize,
      propertyId: propertyId ?? this.propertyId,
      propertyName: propertyName ?? this.propertyName,
      clientId: clientId ?? this.clientId,
      clientName: clientName ?? this.clientName,
      uploadedAt: uploadedAt ?? this.uploadedAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  /// Get file extension from name
  String get fileExtension {
    if (name.isEmpty) return '';
    final parts = name.split('.');
    if (parts.length > 1) {
      return parts.last.toLowerCase();
    }
    return '';
  }

  /// Check if document is a PDF
  bool get isPdf => fileExtension == 'pdf';

  /// Check if document is an image
  bool get isImage =>
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(fileExtension);

  /// Check if document is a text file
  bool get isText => ['txt', 'doc', 'docx'].contains(fileExtension);

  /// Get human-readable file size
  String get fileSizeFormatted {
    if (fileSize == null) return 'Unknown';
    final bytes = fileSize!;
    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(2)} KB';
    } else if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / (1024 * 1024)).toStringAsFixed(2)} MB';
    } else {
      return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(2)} GB';
    }
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Document &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          category == other.category;

  @override
  int get hashCode => id.hashCode ^ name.hashCode ^ category.hashCode;

  @override
  String toString() =>
      'Document(id: $id, name: $name, category: $category, type: $type)';
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
