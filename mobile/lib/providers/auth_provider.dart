import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  String? _token;
  Map<String, dynamic>? _userData;
  bool _isLoading = false;
  String? _error;
  bool _initialized = false;

  AuthProvider() {
    _initializeAuth();
  }

  // Getters
  String? get token => _token;
  Map<String, dynamic>? get userData => _userData;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get initialized => _initialized;
  bool get isAuthenticated => _token != null && _token!.isNotEmpty;
  String get userName => _userData?['name'] ?? 'Usuário';
  String get userEmail => _userData?['email'] ?? '';

  // Initialize authentication state
  Future<void> _initializeAuth() async {
    _isLoading = true;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      debugPrint('[AuthProvider] Init - token found: ${token != null && token.isNotEmpty}');
      if (token != null && token.isNotEmpty) {
        _token = token;
        debugPrint('[AuthProvider] Token length: ${token.length}');
        final userJson = prefs.getString('user_data');
        if (userJson != null) {
          _userData = jsonDecode(userJson);
          debugPrint('[AuthProvider] User data loaded: ${_userData?['name']}');
        }
        // Set token on API service
        final api = ApiService();
        await api.setToken(token);
        debugPrint('[AuthProvider] Token set on ApiService');
      }
    } catch (e) {
      debugPrint('[AuthProvider] Init error: $e');
      _token = null;
      _userData = null;
    }

    _isLoading = false;
    _initialized = true;
    notifyListeners();
  }

  // Login
  Future<bool> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final api = ApiService();
      final response = await api.post(
        '/login',
        data: {'email': email, 'password': password},
      );

      _token = response['access_token'];
      _userData = response['user'] is Map<String, dynamic>
          ? response['user']
          : {'email': email, 'name': email};

      await _saveAuth();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Register
  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? nationality,
    String? birthDate,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final api = ApiService();
      final response = await api.post(
        '/register',
        data: {
          'name': name,
          'email': email,
          'password': password,
          if (phone != null) 'phone': phone,
          if (nationality != null) 'nationality': nationality,
          if (birthDate != null) 'birth_date': birthDate,
        },
      );

      _token = response['access_token'];
      _userData = response['user'] is Map<String, dynamic>
          ? response['user']
          : {'email': email, 'name': name};

      await _saveAuth();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Social login
  Future<bool> socialLogin({
    required String provider,
    required String idToken,
    String? name,
    String? email,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final api = ApiService();
      final response = await api.post(
        '/login/social',
        data: {
          'provider': provider,
          'id_token': idToken,
          if (name != null) 'name': name,
          if (email != null) 'email': email,
        },
      );

      _token = response['access_token'];
      _userData = response['user'] is Map<String, dynamic>
          ? response['user']
          : {'email': email ?? '', 'name': name ?? ''};

      await _saveAuth();
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Logout
  Future<void> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('auth_token');
      await prefs.remove('user_data');
      _token = null;
      _userData = null;
      _error = null;
      notifyListeners();
    } catch (e) {
      _token = null;
      _userData = null;
      _error = 'Logout failed: $e';
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Save auth data
  Future<void> _saveAuth() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_token != null) {
        await prefs.setString('auth_token', _token!);
        final api = ApiService();
        await api.setToken(_token!);
      }
      if (_userData != null) {
        await prefs.setString('user_data', jsonEncode(_userData!));
      }
    } catch (e) {
      debugPrint('Save auth error: $e');
    }
  }
}
