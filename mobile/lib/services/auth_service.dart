import 'package:shared_preferences/shared_preferences.dart';
import 'package:dream_abroad/constants/api_constants.dart';
import 'package:dream_abroad/models/user.dart';
import 'package:dream_abroad/services/api_service.dart';
import 'dart:convert';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  final ApiService _apiService = ApiService();

  factory AuthService() {
    return _instance;
  }

  AuthService._internal();

  /// Login with email and password
  Future<User> login({
    required String email,
    required String password,
  }) async {
    try {
      if (email.isEmpty || password.isEmpty) {
        throw ApiException(message: 'Email and password are required');
      }

      final response = await _apiService.post(
        ApiConstants.loginEndpoint,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.containsKey('token') && response['token'] != null) {
        final token = response['token'] as String;
        await _apiService.setToken(token);
      }

      final userData = response['user'] ?? response['data'];
      if (userData == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      final user = User.fromJson(userData as Map<String, dynamic>);
      await _storeUserData(user);
      return user;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Login failed: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Register new user
  Future<User> register({
    required String name,
    required String email,
    required String password,
    required String phone,
    required String nationality,
    required DateTime birthDate,
  }) async {
    try {
      if (name.isEmpty || email.isEmpty || password.isEmpty || phone.isEmpty) {
        throw ApiException(message: 'All fields are required');
      }

      if (password.length < 6) {
        throw ApiException(message: 'Password must be at least 6 characters');
      }

      final response = await _apiService.post(
        ApiConstants.registerEndpoint,
        data: {
          'name': name,
          'email': email,
          'password': password,
          'phone': phone,
          'nationality': nationality,
          'birthDate': birthDate.toIso8601String(),
        },
      );

      if (response.containsKey('token') && response['token'] != null) {
        final token = response['token'] as String;
        await _apiService.setToken(token);
      }

      final userData = response['user'] ?? response['data'];
      if (userData == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      final user = User.fromJson(userData as Map<String, dynamic>);
      await _storeUserData(user);
      return user;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Registration failed: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Social login
  Future<User> socialLogin({
    required String provider,
    required String idToken,
    required String? name,
    required String? email,
  }) async {
    try {
      if (provider.isEmpty || idToken.isEmpty) {
        throw ApiException(message: 'Provider and ID token are required');
      }

      final response = await _apiService.post(
        ApiConstants.socialLoginEndpoint,
        data: {
          'provider': provider.toLowerCase(),
          'idToken': idToken,
          'name': name,
          'email': email,
        },
      );

      if (response.containsKey('token') && response['token'] != null) {
        final token = response['token'] as String;
        await _apiService.setToken(token);
      }

      final userData = response['user'] ?? response['data'];
      if (userData == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      final user = User.fromJson(userData as Map<String, dynamic>);
      await _storeUserData(user);
      return user;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Social login failed: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      await _apiService.clearToken();
      await _clearUserData();
    } catch (e) {
      throw ApiException(
        message: 'Logout failed: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Get stored authentication token
  Future<String?> getStoredToken() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(ApiConstants.tokenStorageKey);
    } catch (e) {
      return null;
    }
  }

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    try {
      final token = await getStoredToken();
      return token != null && token.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Get stored user data
  Future<User?> getStoredUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = prefs.getString(ApiConstants.userStorageKey);
      if (userData == null || userData.isEmpty) {
        return null;
      }
      final json = jsonDecode(userData) as Map<String, dynamic>;
      return User.fromJson(json);
    } catch (e) {
      return null;
    }
  }

  /// Clear stored user data
  Future<void> _clearUserData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(ApiConstants.userStorageKey);
    } catch (e) {
      // Continue even if deletion fails
    }
  }

  /// Store user data
  Future<void> _storeUserData(User user) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userData = jsonEncode(user.toJson());
      await prefs.setString(ApiConstants.userStorageKey, userData);
    } catch (e) {
      // Log error but don't throw
    }
  }
}
