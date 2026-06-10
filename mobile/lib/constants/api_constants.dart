class ApiConstants {
  // Base URLs
  static const String baseUrl =
      'https://dream-abroad-management-system-production.up.railway.app';
  static const String mobileEndpoint = '/mobile';
  static const String apiBaseUrl = baseUrl + mobileEndpoint;

  // Auth endpoints (relative to apiBaseUrl)
  static const String loginEndpoint = '/login';
  static const String registerEndpoint = '/register';
  static const String socialLoginEndpoint = '/login/social';

  // Client endpoints (relative to apiBaseUrl)
  static const String clientProfileEndpoint = '/profile';
  static const String contractsEndpoint = '/contracts';
  static const String contractDetailEndpoint = '/contracts';
  static const String signContractEndpoint = '/contracts';
  static const String maintenanceRequestsEndpoint = '/requests';
  static const String alertsEndpoint = '/alerts';
  static const String documentsEndpoint = '/documents';
  static const String documentsUploadEndpoint = '/documents/upload';
  static const String paymentsEndpoint = '/payments';
  static const String propertyEndpoint = '/property';

  // New feature endpoints
  static const String messagesEndpoint = '/messages';
  static const String newsEndpoint = '/news';
  static const String rewardsEndpoint = '/rewards';
  static const String checkinEndpoint = '/checkin';
  static const String reviewsEndpoint = '/reviews';
  static const String faqEndpoint = '/faq';
  static const String referralsEndpoint = '/referrals';

  // Timeouts (in seconds)
  static const int connectTimeout = 30;
  static const int receiveTimeout = 60;

  // Headers
  static const String authorizationHeader = 'Authorization';
  static const String contentTypeHeader = 'Content-Type';
  static const String jsonContentType = 'application/json';
  static const String multipartContentType = 'multipart/form-data';

  // Secure storage keys
  static const String tokenStorageKey = 'auth_token';
  static const String userStorageKey = 'user_data';
  static const String refreshTokenStorageKey = 'refresh_token';
}
