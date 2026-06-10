import 'package:dream_abroad/models/alert.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AlertsScreen extends StatefulWidget {
  const AlertsScreen({Key? key}) : super(key: key);

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  final ClientService _clientService = ClientService();
  List<Alert> _alerts = [];
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadAlerts();
  }

  Future<void> _loadAlerts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final alerts = await _clientService.getAlerts();
      setState(() {
        _alerts = alerts;
        _alerts.sort(
            (a, b) => (b.createdAt ?? DateTime.now())
                .compareTo(a.createdAt ?? DateTime.now()));
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar alertas';
        _isLoading = false;
      });
    }
  }

  Future<void> _markAllAsRead() async {
    for (final alert in _alerts) {
      if (!alert.resolved) {
        try {
          await _clientService.markAlertAsRead(alert.id);
        } catch (e) {
          // Continue marking others as read
        }
      }
    }
    _loadAlerts();
  }

  Future<void> _toggleAlert(Alert alert) async {
    if (!alert.resolved) {
      try {
        await _clientService.markAlertAsRead(alert.id);
        _loadAlerts();
      } catch (e) {
        _showError('Erro ao marcar alerta como lido');
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  Color _getSeverityColor(String severity) {
    return switch (severity.toLowerCase()) {
      'critical' => Colors.red,
      'warning' => Colors.orange,
      'info' => Colors.blue,
      _ => Colors.grey,
    };
  }

  IconData _getSeverityIcon(String severity) {
    return switch (severity.toLowerCase()) {
      'critical' => Icons.priority_high,
      'warning' => Icons.warning_outlined,
      'info' => Icons.info_outlined,
      _ => Icons.notifications_outlined,
    };
  }

  String _formatTime(DateTime? dateTime) {
    if (dateTime == null) return 'Agora';

    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inSeconds < 60) {
      return 'Agora';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m atrás';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h atrás';
    } else if (difference.inDays == 1) {
      return 'Ontem';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d atrás';
    } else {
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount =
        _alerts.where((alert) => !alert.resolved).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Alertas'),
        elevation: 0,
        actions: [
          if (unreadCount > 0)
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: TextButton(
                  onPressed: _markAllAsRead,
                  child: const Text(
                    'Marcar tudo como lido',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadAlerts,
        child: _isLoading && _alerts.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 64,
                          color: AppTheme.greyLight,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          _error!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _loadAlerts,
                          child: const Text('Tentar Novamente'),
                        ),
                      ],
                    ),
                  )
                : _alerts.isEmpty
                    ? SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.notifications_none_outlined,
                                  size: 64,
                                  color: AppTheme.greyLight,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Nenhum alerta',
                                  style:
                                      Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Você está em dia com todas as notificações',
                                  style:
                                      Theme.of(context).textTheme.bodySmall,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    : SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            children: _alerts
                                .map((alert) => _buildAlertCard(alert))
                                .toList(),
                          ),
                        ),
                      ),
      ),
    );
  }

  Widget _buildAlertCard(Alert alert) {
    final severityColor = _getSeverityColor(alert.severity);
    final severityIcon = _getSeverityIcon(alert.severity);
    final timeAgo = _formatTime(alert.createdAt);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _toggleAlert(alert),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 4,
                height: 60,
                decoration: BoxDecoration(
                  color: severityColor,
                  borderRadius: const BorderRadius.only(
                    topLeft: Radius.circular(4),
                    bottomLeft: Radius.circular(4),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Icon(
                severityIcon,
                color: severityColor,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      alert.message,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            fontWeight:
                                !alert.resolved ? FontWeight.w600 : FontWeight.w400,
                            color: !alert.resolved
                                ? AppTheme.textPrimary
                                : AppTheme.textSecondary,
                          ),
                      maxLines: 3,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      timeAgo,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.greyMedium,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              if (!alert.resolved)
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor,
                    shape: BoxShape.circle,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
