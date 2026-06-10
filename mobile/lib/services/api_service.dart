import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dream_abroad/constants/api_constants.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  late final Dio _dio;
  String? _cachedToken; // In-memory token cache for fast access

  factory ApiService() {
    return _instance;
  }

  ApiService._internal() {
    _initializeDio();
  }

  void _initializeDio() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.apiBaseUrl,
        connectTimeout: Duration(seconds: ApiConstants.connectTimeout),
        receiveTimeout: Duration(seconds: ApiConstants.receiveTimeout),
        contentType: ApiConstants.jsonContentType,
        responseType: ResponseType.json,
      ),
    );

    // Add auth token interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          try {
            final token = await _getToken();
            if (token != null && token.isNotEmpty) {
              options.headers[ApiConstants.authorizationHeader] = 'Bearer $token';
            }
          } catch (e) {
            // Continue without token if retrieval fails
          }
          return handler.next(options);
        },
        onError: (DioException error, handler) async {
          if (error.response?.statusCode == 401) {
            // Clear token and trigger logout
            await clearToken();
            // Note: Redirect to login should be handled by app's auth state management
            // Not done here to avoid circular dependencies
          }
          return handler.next(error);
        },
      ),
    );
  }

  // GET request
  Future<dynamic> get(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      print('[ApiService] GET $endpoint | token cached: ${_cachedToken != null}');
      final response = await _dio.get<dynamic>(
        endpoint,
        queryParameters: queryParameters,
      );
      print('[ApiService] GET $endpoint → ${response.statusCode}');
      return response.data;
    } on DioException catch (e) {
      print('[ApiService] GET $endpoint DioError: ${e.type} | ${e.message} | status: ${e.response?.statusCode} | data: ${e.response?.data}');
      throw _handleError(e);
    } catch (e) {
      print('[ApiService] GET $endpoint Error: $e');
      throw ApiException(
        message: 'An unexpected error occurred: $e',
        originalError: e,
      );
    }
  }

  // POST request
  Future<dynamic> post(
    String endpoint, {
    required Map<String, dynamic> data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.post<dynamic>(
        endpoint,
        data: data,
        queryParameters: queryParameters,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    } catch (e) {
      throw ApiException(
        message: 'An unexpected error occurred',
        originalError: e,
      );
    }
  }

  // PUT request
  Future<dynamic> put(
    String endpoint, {
    required Map<String, dynamic> data,
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.put<dynamic>(
        endpoint,
        data: data,
        queryParameters: queryParameters,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    } catch (e) {
      throw ApiException(
        message: 'An unexpected error occurred',
        originalError: e,
      );
    }
  }

  // DELETE request
  Future<dynamic> delete(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
  }) async {
    try {
      final response = await _dio.delete<dynamic>(
        endpoint,
        queryParameters: queryParameters,
      );
      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    } catch (e) {
      throw ApiException(
        message: 'An unexpected error occurred',
        originalError: e,
      );
    }
  }

  // Upload file with multipart form data
  Future<dynamic> uploadFile({
    required String endpoint,
    required String filePath,
    required String fileFieldName,
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      final file = await MultipartFile.fromFile(filePath);
      final formData = FormData.fromMap({
        fileFieldName: file,
        if (additionalData != null) ...additionalData,
      });

      final response = await _dio.post<dynamic>(
        endpoint,
        data: formData,
      );

      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    } catch (e) {
      throw ApiException(
        message: 'Failed to upload file',
        originalError: e,
      );
    }
  }

  // Upload multiple files
  Future<dynamic> uploadFiles({
    required String endpoint,
    required List<String> filePaths,
    required String fileFieldName,
    Map<String, dynamic>? additionalData,
  }) async {
    try {
      final files = <MultipartFile>[];
      for (final filePath in filePaths) {
        final file = await MultipartFile.fromFile(filePath);
        files.add(file);
      }

      final formData = FormData.fromMap({
        fileFieldName: files,
        if (additionalData != null) ...additionalData,
      });

      final response = await _dio.post<dynamic>(
        endpoint,
        data: formData,
      );

      return response.data;
    } on DioException catch (e) {
      throw _handleError(e);
    } catch (e) {
      throw ApiException(
        message: 'Failed to upload files',
        originalError: e,
      );
    }
  }


  // Handle errors
  ApiException _handleError(DioException error) {
    late String message;
    int? statusCode;

    switch (error.type) {
      case DioExceptionType.connectionTimeout:
        message = 'Connection timeout. Please check your internet connection.';
        break;
      case DioExceptionType.sendTimeout:
        message = 'Request timeout. Please try again.';
        break;
      case DioExceptionType.receiveTimeout:
        message = 'Response timeout. Please try again.';
        break;
      case DioExceptionType.badResponse:
        statusCode = error.response?.statusCode;
        message = _getErrorMessage(
          error.response?.statusCode,
          error.response?.data,
        );
        break;
      case DioExceptionType.badCertificate:
        message = 'Certificate error. Please try again later.';
        break;
      case DioExceptionType.connectionError:
        message = 'Network error. Please check your internet connection.';
        break;
      case DioExceptionType.unknown:
        message = error.message ?? 'An unknown error occurred';
        break;
      default:
        message = 'An unexpected error occurred';
    }

    return ApiException(
      message: message,
      statusCode: statusCode,
      originalError: error,
    );
  }

  // Get error message from response
  String _getErrorMessage(int? statusCode, dynamic responseData) {
    if (responseData is Map<String, dynamic>) {
      // Try to get error message from response
      if (responseData.containsKey('detail')) {
        final detail = responseData['detail'];
        if (detail is String) return detail;
      }
      if (responseData.containsKey('message')) {
        return responseData['message'] as String;
      }
      if (responseData.containsKey('error')) {
        final error = responseData['error'];
        if (error is String) {
          return error;
        } else if (error is Map && error.containsKey('message')) {
          return error['message'] as String;
        }
      }
    }

    return switch (statusCode) {
      400 => 'Bad request. Please check your input.',
      401 => 'Unauthorized. Please log in again.',
      403 => 'Forbidden. You do not have permission to access this resource.',
      404 => 'Resource not found.',
      409 => 'Conflict. The resource already exists.',
      422 => 'Invalid input. Please check your data.',
      429 => 'Too many requests. Please try again later.',
      500 => 'Server error. Please try again later.',
      502 => 'Service unavailable. Please try again later.',
      503 => 'Service maintenance. Please try again later.',
      _ => 'An error occurred. Please try again.',
    };
  }

  // Token management using SharedPreferences
  Future<String?> _getToken() async {
    if (_cachedToken != null) return _cachedToken;
    try {
      final prefs = await SharedPreferences.getInstance();
      _cachedToken = prefs.getString(ApiConstants.tokenStorageKey);
      return _cachedToken;
    } catch (e) {
      return null;
    }
  }

  Future<void> setToken(String token) async {
    _cachedToken = token;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(ApiConstants.tokenStorageKey, token);
    } catch (e) {
      // Token is still cached in memory even if persistence fails
    }
  }

  Future<void> clearToken() async {
    _cachedToken = null;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(ApiConstants.tokenStorageKey);
    } catch (e) {
      // Token is already cleared from memory
    }
  }

  // Getters
  Dio get dio => _dio;
  Future<bool> get hasToken async {
    final token = await _getToken();
    return token != null && token.isNotEmpty;
  }
}

/// Custom exception for API errors
class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic originalError;

  ApiException({
    required this.message,
    this.statusCode,
    this.originalError,
  });

  @override
  String toString() => message;
}
