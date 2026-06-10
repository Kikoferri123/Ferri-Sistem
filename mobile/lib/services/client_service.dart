import 'package:dream_abroad/constants/api_constants.dart';
import 'package:dream_abroad/models/alert.dart';
import 'package:dream_abroad/models/client_profile.dart';
import 'package:dream_abroad/models/contract.dart';
import 'package:dream_abroad/models/document.dart';
import 'package:dream_abroad/models/maintenance_request.dart';
import 'package:dream_abroad/models/payment.dart';
import 'package:dream_abroad/models/property_detail.dart';
import 'package:dream_abroad/services/api_service.dart';
import 'package:dream_abroad/models/message.dart';
import 'package:dream_abroad/models/news.dart';
import 'package:dream_abroad/models/reward.dart';
import 'package:dream_abroad/models/checkin.dart';
import 'package:dream_abroad/models/review.dart';
import 'package:dream_abroad/models/faq.dart';
import 'package:dream_abroad/models/referral.dart';

class ClientService {
  static final ClientService _instance = ClientService._internal();
  final ApiService _apiService = ApiService();

  factory ClientService() {
    return _instance;
  }

  ClientService._internal();

  /// Get client profile
  /// Returns ClientProfile object
  /// Throws ApiException on failure
  Future<ClientProfile> getProfile() async {
    try {
      print('[ClientService] Fetching profile from ${ApiConstants.clientProfileEndpoint}');
      final response = await _apiService.get(
        ApiConstants.clientProfileEndpoint,
      );

      print('[ClientService] Response type: ${response.runtimeType}');
      print('[ClientService] Response: $response');

      if (response == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      // Handle different response shapes
      Map<String, dynamic> jsonData;
      if (response is Map<String, dynamic>) {
        jsonData = response;
      } else if (response is Map) {
        jsonData = Map<String, dynamic>.from(response);
      } else {
        throw ApiException(message: 'Unexpected response type: ${response.runtimeType}');
      }

      print('[ClientService] Parsing profile from JSON...');
      final profile = ClientProfile.fromJson(jsonData);
      print('[ClientService] Profile loaded: ${profile.name}');
      return profile;
    } on ApiException {
      rethrow;
    } catch (e, stackTrace) {
      print('[ClientService] ERROR loading profile: $e');
      print('[ClientService] Stack trace: $stackTrace');
      throw ApiException(
        message: 'Failed to load profile: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Update client profile
  /// Returns updated ClientProfile object
  /// Throws ApiException on failure
  Future<ClientProfile> updateProfile(Map<String, dynamic> data) async {
    try {
      if (data.isEmpty) {
        throw ApiException(message: 'No data to update');
      }

      final response = await _apiService.put(
        ApiConstants.clientProfileEndpoint,
        data: data,
      );

      if (response == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      return ClientProfile.fromJson(response as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to update profile: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Get list of contracts
  /// Returns list of Contract objects
  /// Throws ApiException on failure
  Future<List<Contract>> getContracts({
    String? status,
    int? page,
    int? pageSize,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (status != null) 'status': status,
        if (page != null) 'page': page,
        if (pageSize != null) 'pageSize': pageSize,
      };

      final response = await _apiService.get(
        ApiConstants.contractsEndpoint,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final contractList = response is List ? response : [];

      return (contractList as List)
          .whereType<Map<String, dynamic>>()
          .map((json) => Contract.fromJson(json))
          .toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to load contracts: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Get contract details
  /// Returns Contract object
  /// Throws ApiException on failure
  Future<Contract> getContractDetail(int id) async {
    try {
      if (id <= 0) {
        throw ApiException(message: 'Invalid contract ID');
      }

      final response = await _apiService.get(
        '${ApiConstants.contractDetailEndpoint}/$id',
      );

      if (response == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      return Contract.fromJson(response as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to load contract: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Sign contract with signature
  /// Returns updated Contract object
  /// Throws ApiException on failure
  Future<Contract> signContract({
    required int contractId,
    required String signatureBase64,
  }) async {
    try {
      if (contractId <= 0) {
        throw ApiException(message: 'Invalid contract ID');
      }

      if (signatureBase64.isEmpty) {
        throw ApiException(message: 'Signature is required');
      }

      final response = await _apiService.post(
        '${ApiConstants.signContractEndpoint}/$contractId/sign',
        data: {
          'signature': signatureBase64,
        },
      );

      if (response == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      return Contract.fromJson(response as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to sign contract: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Get maintenance requests
  /// Returns list of MaintenanceRequest objects
  /// Throws ApiException on failure
  Future<List<MaintenanceRequest>> getRequests({
    String? status,
    String? priority,
    int? page,
    int? pageSize,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (status != null) 'status': status,
        if (priority != null) 'priority': priority,
        if (page != null) 'page': page,
        if (pageSize != null) 'pageSize': pageSize,
      };

      final response = await _apiService.get(
        ApiConstants.maintenanceRequestsEndpoint,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final requestList = response is List ? response : [];

      return (requestList as List)
          .whereType<Map<String, dynamic>>()
          .map((json) => MaintenanceRequest.fromJson(json))
          .toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to load maintenance requests: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Create new maintenance request
  /// Returns created MaintenanceRequest object
  /// Throws ApiException on failure
  Future<MaintenanceRequest> createRequest({
    required String title,
    required String? description,
    required String priority,
    List<String>? photoFilePaths,
  }) async {
    try {
      if (title.isEmpty) {
        throw ApiException(message: 'Title is required');
      }

      if (priority.isEmpty) {
        throw ApiException(message: 'Priority is required');
      }

      dynamic response;

      // If photos are provided, use multipart upload
      if (photoFilePaths != null && photoFilePaths.isNotEmpty) {
        response = await _apiService.uploadFiles(
          endpoint: ApiConstants.maintenanceRequestsEndpoint,
          filePaths: photoFilePaths,
          fileFieldName: 'photos',
          additionalData: {
            'title': title,
            'description': description ?? '',
            'priority': priority,
          },
        );
      } else {
        response = await _apiService.post(
          ApiConstants.maintenanceRequestsEndpoint,
          data: {
            'title': title,
            'description': description ?? '',
            'priority': priority,
          },
        );
      }

      if (response == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      return MaintenanceRequest.fromJson(response as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to create maintenance request: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Get alerts
  /// Returns list of Alert objects
  /// Throws ApiException on failure
  Future<List<Alert>> getAlerts({
    bool? unreadOnly,
    String? type,
    String? severity,
    int? page,
    int? pageSize,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (unreadOnly != null) 'unreadOnly': unreadOnly,
        if (type != null) 'type': type,
        if (severity != null) 'severity': severity,
        if (page != null) 'page': page,
        if (pageSize != null) 'pageSize': pageSize,
      };

      final response = await _apiService.get(
        ApiConstants.alertsEndpoint,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final alertList = response is List ? response : [];

      return (alertList as List)
          .whereType<Map<String, dynamic>>()
          .map((json) => Alert.fromJson(json))
          .toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to load alerts: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Get documents
  /// Returns list of Document objects
  /// Throws ApiException on failure
  Future<List<Document>> getDocuments({
    String? category,
    int? page,
    int? pageSize,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (category != null) 'category': category,
        if (page != null) 'page': page,
        if (pageSize != null) 'pageSize': pageSize,
      };

      final response = await _apiService.get(
        ApiConstants.documentsEndpoint,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final documentList = response is List ? response : [];

      return (documentList as List)
          .whereType<Map<String, dynamic>>()
          .map((json) => Document.fromJson(json))
          .toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to load documents: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Upload document
  /// Returns created Document object
  /// Throws ApiException on failure
  Future<Document> uploadDocument({
    required String filePath,
    required String category,
    String? documentName,
  }) async {
    try {
      if (filePath.isEmpty) {
        throw ApiException(message: 'File path is required');
      }

      if (category.isEmpty) {
        throw ApiException(message: 'Category is required');
      }

      final response = await _apiService.uploadFile(
        endpoint: ApiConstants.documentsEndpoint,
        filePath: filePath,
        fileFieldName: 'file',
        additionalData: {
          'category': category,
          if (documentName != null && documentName.isNotEmpty)
            'name': documentName,
        },
      );

      if (response == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      return Document.fromJson(response as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to upload document: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Get payments
  /// Returns list of Payment objects
  /// Throws ApiException on failure
  Future<List<Payment>> getPayments({
    int? page,
    int? pageSize,
    String? sortBy,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        if (page != null) 'page': page,
        if (pageSize != null) 'pageSize': pageSize,
        if (sortBy != null) 'sortBy': sortBy,
      };

      final response = await _apiService.get(
        ApiConstants.paymentsEndpoint,
        queryParameters: queryParams.isNotEmpty ? queryParams : null,
      );

      final paymentList = response is List ? response : [];

      return (paymentList as List)
          .whereType<Map<String, dynamic>>()
          .map((json) => Payment.fromJson(json))
          .toList();
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to load payments: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Get property details
  /// Returns PropertyDetail object
  /// Throws ApiException on failure
  Future<PropertyDetail> getProperty() async {
    try {
      final response = await _apiService.get(
        ApiConstants.propertyEndpoint,
      );

      if (response == null) {
        throw ApiException(message: 'Invalid response from server');
      }

      return PropertyDetail.fromJson(response as Map<String, dynamic>);
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to load property: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Mark alert as read
  /// Returns true on success
  /// Throws ApiException on failure
  Future<bool> markAlertAsRead(int alertId) async {
    try {
      if (alertId <= 0) {
        throw ApiException(message: 'Invalid alert ID');
      }

      await _apiService.put(
        '${ApiConstants.alertsEndpoint}/$alertId/read',
        data: {},
      );

      return true;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to mark alert as read: ${e.toString()}',
        originalError: e,
      );
    }
  }

  /// Delete document
  /// Returns true on success
  /// Throws ApiException on failure
  Future<bool> deleteDocument(int documentId) async {
    try {
      if (documentId <= 0) {
        throw ApiException(message: 'Invalid document ID');
      }

      await _apiService.delete(
        '${ApiConstants.documentsEndpoint}/$documentId',
      );

      return true;
    } on ApiException {
      rethrow;
    } catch (e) {
      throw ApiException(
        message: 'Failed to delete document: ${e.toString()}',
        originalError: e,
      );
    }
  }

  // ── Messages ──
  Future<List<Message>> getMessages() async {
    try {
      final response = await _apiService.get(ApiConstants.messagesEndpoint);
      final list = response is List ? response : [];
      return (list as List).whereType<Map<String, dynamic>>().map((j) => Message.fromJson(j)).toList();
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to load messages: ${e.toString()}', originalError: e);
    }
  }

  Future<Message> sendMessage({required String body, String? subject}) async {
    try {
      final response = await _apiService.post(
        ApiConstants.messagesEndpoint,
        data: {'body': body, if (subject != null) 'subject': subject},
      );
      if (response == null) throw ApiException(message: 'Invalid response');
      return Message.fromJson(response as Map<String, dynamic>);
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to send message: ${e.toString()}', originalError: e);
    }
  }

  Future<void> markMessageRead(int messageId) async {
    try {
      await _apiService.put('${ApiConstants.messagesEndpoint}/$messageId/read', data: {});
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to mark message as read: ${e.toString()}', originalError: e);
    }
  }

  // ── News ──
  Future<List<NewsItem>> getNews({String? category}) async {
    try {
      final params = <String, dynamic>{if (category != null) 'category': category};
      final response = await _apiService.get(ApiConstants.newsEndpoint, queryParameters: params.isNotEmpty ? params : null);
      final list = response is List ? response : [];
      return (list as List).whereType<Map<String, dynamic>>().map((j) => NewsItem.fromJson(j)).toList();
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to load news: ${e.toString()}', originalError: e);
    }
  }

  // ── Rewards ──
  Future<RewardInfo> getRewards() async {
    try {
      final response = await _apiService.get(ApiConstants.rewardsEndpoint);
      if (response == null) throw ApiException(message: 'Invalid response');
      return RewardInfo.fromJson(response as Map<String, dynamic>);
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to load rewards: ${e.toString()}', originalError: e);
    }
  }

  // ── Check-in/Check-out ──
  Future<Map<String, dynamic>> doCheckIn({required String type, String? notes}) async {
    try {
      final response = await _apiService.post(
        ApiConstants.checkinEndpoint,
        data: {'type': type, if (notes != null) 'notes': notes},
      );
      return response as Map<String, dynamic>? ?? {};
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to check in: ${e.toString()}', originalError: e);
    }
  }

  Future<List<CheckInOut>> getCheckInHistory() async {
    try {
      final response = await _apiService.get('${ApiConstants.checkinEndpoint}/history');
      final list = response is List ? response : [];
      return (list as List).whereType<Map<String, dynamic>>().map((j) => CheckInOut.fromJson(j)).toList();
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to load check-in history: ${e.toString()}', originalError: e);
    }
  }

  // ── Reviews ──
  Future<Map<String, dynamic>> submitReview({required int rating, String? comment}) async {
    try {
      final response = await _apiService.post(
        ApiConstants.reviewsEndpoint,
        data: {'rating': rating, if (comment != null) 'comment': comment},
      );
      return response as Map<String, dynamic>? ?? {};
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to submit review: ${e.toString()}', originalError: e);
    }
  }

  Future<List<Review>> getReviews() async {
    try {
      final response = await _apiService.get(ApiConstants.reviewsEndpoint);
      final list = response is List ? response : [];
      return (list as List).whereType<Map<String, dynamic>>().map((j) => Review.fromJson(j)).toList();
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to load reviews: ${e.toString()}', originalError: e);
    }
  }

  // ── FAQ ──
  Future<List<FaqItem>> getFaq() async {
    try {
      final response = await _apiService.get(ApiConstants.faqEndpoint);
      final list = response is List ? response : [];
      return (list as List).whereType<Map<String, dynamic>>().map((j) => FaqItem.fromJson(j)).toList();
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to load FAQ: ${e.toString()}', originalError: e);
    }
  }

  // ── Referrals ──
  Future<Map<String, dynamic>> createReferral({required String friendName, required String friendEmail, String? friendPhone}) async {
    try {
      final response = await _apiService.post(
        ApiConstants.referralsEndpoint,
        data: {'friend_name': friendName, 'friend_email': friendEmail, if (friendPhone != null) 'friend_phone': friendPhone},
      );
      return response as Map<String, dynamic>? ?? {};
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to create referral: ${e.toString()}', originalError: e);
    }
  }

  Future<List<Referral>> getReferrals() async {
    try {
      final response = await _apiService.get(ApiConstants.referralsEndpoint);
      final list = response is List ? response : [];
      return (list as List).whereType<Map<String, dynamic>>().map((j) => Referral.fromJson(j)).toList();
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to load referrals: ${e.toString()}', originalError: e);
    }
  }

  // ── Invoice ──
  Future<Map<String, dynamic>> getInvoice(int paymentId) async {
    try {
      final response = await _apiService.get('${ApiConstants.paymentsEndpoint}/$paymentId/invoice');
      return response as Map<String, dynamic>? ?? {};
    } on ApiException { rethrow; } catch (e) {
      throw ApiException(message: 'Failed to load invoice: ${e.toString()}', originalError: e);
    }
  }
}
