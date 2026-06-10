class User {
  final int id;
  final String name;
  final String email;
  final String role;
  final bool active;

  const User({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.active,
  });

  /// Create User from JSON
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as int? ?? 0,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'client',
      active: json['active'] as bool? ?? true,
    );
  }

  /// Convert User to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'active': active,
    };
  }

  /// Create a copy with modified fields
  User copyWith({
    int? id,
    String? name,
    String? email,
    String? role,
    bool? active,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      active: active ?? this.active,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is User &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          email == other.email &&
          role == other.role &&
          active == other.active;

  @override
  int get hashCode => id.hashCode ^ name.hashCode ^ email.hashCode ^ role.hashCode ^ active.hashCode;

  @override
  String toString() => 'User(id: $id, name: $name, email: $email, role: $role, active: $active)';
}
