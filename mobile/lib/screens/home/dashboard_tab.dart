import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../utils/theme.dart';
import '../../services/client_service.dart';
import '../../services/api_service.dart';
import '../../models/property_detail.dart';
import '../../models/alert.dart' as alert_model;

class DashboardTab extends StatefulWidget {
  const DashboardTab({Key? key}) : super(key: key);

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab> {
  final ClientService _clientService = ClientService();
  Map<String, dynamic>? _propertyData;
  List<dynamic> _alerts = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() { _isLoading = true; _error = null; });
    try {
      final property = await _clientService.getProperty();
      List<alert_model.Alert> alerts = [];
      try { alerts = await _clientService.getAlerts(); } catch (_) {}

      setState(() {
        _propertyData = {
          'name': property.name,
          'address': property.address,
          'type': property.type,
          'monthlyRent': property.monthlyRent,
          'rooms': property.rooms.length,
        };
        _alerts = alerts;
        _isLoading = false;
      });
    } on ApiException catch (e) {
      setState(() { _error = e.message; _isLoading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 48, color: AppTheme.errorColor),
              const SizedBox(height: 16),
              Text(_error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              ElevatedButton(onPressed: _loadData, child: const Text('Tentar novamente')),
            ],
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome
            Text('Bem-vindo!', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),

            // Property Card
            if (_propertyData != null) ...[
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(12),
                    gradient: LinearGradient(
                      colors: [AppTheme.primaryColor, AppTheme.primaryColor.withOpacity(0.8)],
                    ),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.home, color: Colors.white, size: 32),
                      const SizedBox(height: 12),
                      Text(
                        _propertyData!['name'] ?? 'Minha Propriedade',
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _propertyData!['address'] ?? '',
                        style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 14),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Renda: €${_propertyData!['monthlyRent'] ?? 0}/mês',
                        style: TextStyle(color: Colors.white.withOpacity(0.9), fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],

            // Quick Actions
            Text('Ações Rápidas', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 3,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.0,
              children: [
                _buildQuickAction(context, Icons.description, 'Contratos', '/contracts'),
                _buildQuickAction(context, Icons.build, 'Pedidos', '/requests'),
                _buildQuickAction(context, Icons.receipt_long, 'Pagamentos', '/payments'),
                _buildQuickAction(context, Icons.mail_outline, 'Mensagens', '/messages'),
                _buildQuickAction(context, Icons.newspaper, 'Notícias', '/news'),
                _buildQuickAction(context, Icons.star_outline, 'Recompensas', '/rewards'),
                _buildQuickAction(context, Icons.login, 'Check-in', '/checkin'),
                _buildQuickAction(context, Icons.rate_review_outlined, 'Avaliações', '/reviews'),
                _buildQuickAction(context, Icons.help_outline, 'FAQ', '/faq'),
                _buildQuickAction(context, Icons.people_outline, 'Indicações', '/referrals'),
                _buildQuickAction(context, Icons.folder, 'Documentos', '/documents'),
                _buildQuickAction(context, Icons.home_outlined, 'Propriedade', '/property'),
              ],
            ),
            const SizedBox(height: 20),

            // Alerts
            if (_alerts.isNotEmpty) ...[
              Text('Alertas Recentes', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              ...(_alerts.take(3).map((alert) {
                final a = alert as alert_model.Alert;
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(Icons.info_outline, color: AppTheme.primaryColor),
                    title: Text(a.type),
                    subtitle: Text(a.message, maxLines: 2, overflow: TextOverflow.ellipsis),
                  ),
                );
              })),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildQuickAction(BuildContext context, IconData icon, String label, String route) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.go(route),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: AppTheme.primaryColor),
            const SizedBox(height: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
