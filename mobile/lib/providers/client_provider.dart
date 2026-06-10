import 'package:flutter/material.dart';
import '../services/client_service.dart';
import '../services/api_service.dart';

class ClientProvider extends ChangeNotifier {
  final ClientService _clientService = ClientService();

  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
