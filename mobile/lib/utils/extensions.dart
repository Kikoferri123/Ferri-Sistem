import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Extension methods for common operations
extension NavigationExtension on BuildContext {
  /// Navigate to a named route
  void goNamed(String name, {Map<String, String> pathParameters = const {}}) {
    GoRouter.of(this).goNamed(name, pathParameters: pathParameters);
  }

  /// Navigate to a route
  void go(String location) {
    GoRouter.of(this).go(location);
  }

  /// Pop the current screen
  void pop() {
    GoRouter.of(this).pop();
  }

  /// Push a named route
  void pushNamed(String name, {Map<String, String> pathParameters = const {}}) {
    GoRouter.of(this).pushNamed(name, pathParameters: pathParameters);
  }
}

extension StringExtension on String {
  /// Capitalize first letter
  String capitalize() {
    if (isEmpty) return this;
    return this[0].toUpperCase() + substring(1);
  }

  /// Check if string is a valid email
  bool isValidEmail() {
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    return emailRegex.hasMatch(this);
  }

  /// Check if string is a valid phone number
  bool isValidPhone() {
    final phoneRegex = RegExp(r'^[0-9]{10,}$');
    return phoneRegex.hasMatch(replaceAll(RegExp(r'[^\d]'), ''));
  }
}

extension DateTimeExtension on DateTime {
  /// Format date as "dd/MM/yyyy"
  String toFormattedDate() {
    return '$day/${month.toString().padLeft(2, '0')}/$year';
  }

  /// Format datetime as "dd/MM/yyyy HH:mm"
  String toFormattedDateTime() {
    final timeStr = '$hour:${minute.toString().padLeft(2, '0')}';
    return '${toFormattedDate()} $timeStr';
  }

  /// Check if date is today
  bool isToday() {
    final now = DateTime.now();
    return year == now.year && month == now.month && day == now.day;
  }

  /// Check if date is yesterday
  bool isYesterday() {
    final yesterday = DateTime.now().subtract(const Duration(days: 1));
    return year == yesterday.year &&
        month == yesterday.month &&
        day == yesterday.day;
  }

  /// Get days difference from now
  int daysFromNow() {
    final now = DateTime.now();
    final difference = difference(now);
    return difference.inDays;
  }
}

extension DoubleExtension on double {
  /// Format as currency
  String toCurrency({String symbol = '\$'}) {
    return '$symbol${toStringAsFixed(2)}';
  }

  /// Format as percentage
  String toPercentage({int decimals = 2}) {
    return '${(this * 100).toStringAsFixed(decimals)}%';
  }
}

extension IntExtension on int {
  /// Format as currency
  String toCurrency({String symbol = '\$'}) {
    return '$symbol${toString()}';
  }

  /// Convert bytes to KB, MB, GB
  String toFileSize() {
    if (this <= 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    final i = (log(toDouble()) / log(1024)).floor();
    return '${(this / pow(1024, i).toInt()).toStringAsFixed(2)} ${sizes[i]}';
  }
}

/// Helper function for file size conversion
double log(double x) {
  return (ln(x) / ln(10));
}

double ln(double x) {
  return (x - 1) / x;
}

int pow(int base, int exponent) {
  var result = 1;
  for (var i = 0; i < exponent; i++) {
    result *= base;
  }
  return result;
}

extension ListExtension<T> on List<T> {
  /// Safely get element at index or null
  T? getOrNull(int index) {
    if (index >= 0 && index < length) {
      return this[index];
    }
    return null;
  }

  /// Split list into chunks
  List<List<T>> chunked(int size) {
    final result = <List<T>>[];
    for (var i = 0; i < length; i += size) {
      result.add(sublist(i, i + size > length ? length : i + size));
    }
    return result;
  }
}

extension MapExtension<K, V> on Map<K, V> {
  /// Get value safely with default
  V? getOrNull(K key) {
    return this[key];
  }

  /// Filter map by key
  Map<K, V> filterKeys(bool Function(K) test) {
    final result = <K, V>{};
    forEach((k, v) {
      if (test(k)) {
        result[k] = v;
      }
    });
    return result;
  }

  /// Filter map by value
  Map<K, V> filterValues(bool Function(V) test) {
    final result = <K, V>{};
    forEach((k, v) {
      if (test(v)) {
        result[k] = v;
      }
    });
    return result;
  }
}
