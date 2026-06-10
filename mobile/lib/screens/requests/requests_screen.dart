import 'package:dream_abroad/models/maintenance_request.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'requests_detail_sheet.dart';

class RequestsScreen extends StatefulWidget {
  const RequestsScreen({Key? key}) : super(key: key);

  @override
  State<RequestsScreen> createState() => _RequestsScreenState();
}

class _RequestsScreenState extends State<RequestsScreen> {
  final ClientService _clientService = ClientService();
  List<MaintenanceRequest> _requests = [];
  List<MaintenanceRequest> _filteredRequests = [];
  String _selectedStatus = 'todos';
  bool _isLoading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadRequests();
  }

  Future<void> _loadRequests() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final requests = await _clientService.getRequests();
      setState(() {
        _requests = requests;
        _filterRequests();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar requisições';
        _isLoading = false;
      });
    }
  }

  void _filterRequests() {
    if (_selectedStatus == 'todos') {
      _filteredRequests = _requests;
    } else {
      _filteredRequests = _requests
          .where((r) => r.status.toLowerCase() == _selectedStatus)
          .toList();
    }
    // Sort by priority (high to low) then by date
    _filteredRequests.sort((a, b) {
      final priorityCompare = b.priorityLevel.compareTo(a.priorityLevel);
      if (priorityCompare != 0) return priorityCompare;
      return (b.createdAt ?? DateTime.now())
          .compareTo(a.createdAt ?? DateTime.now());
    });
  }

  void _onStatusFilterChanged(String status) {
    setState(() {
      _selectedStatus = status;
      _filterRequests();
    });
  }

  void _showRequestDetail(MaintenanceRequest request) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => RequestsDetailSheet(request: request),
    );
  }

  Color _getPriorityColor(String priority) {
    return switch (priority.toLowerCase()) {
      'urgente' => Colors.red,
      'alta' => Colors.orange,
      'media' => Colors.amber,
      'baixa' => Colors.blue,
      _ => Colors.grey,
    };
  }

  String _getPriorityLabel(String priority) {
    return switch (priority.toLowerCase()) {
      'urgente' => 'Urgente',
      'alta' => 'Alta',
      'media' => 'Média',
      'baixa' => 'Baixa',
      _ => 'Indefinida',
    };
  }

  String _getStatusLabel(String status) {
    return switch (status.toLowerCase()) {
      'aberto' => 'Aberto',
      'em_andamento' => 'Em Andamento',
      'concluido' => 'Concluído',
      'cancelado' => 'Cancelado',
      _ => 'Desconhecido',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Minhas Requisições'),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadRequests,
        child: _isLoading && _requests.isEmpty
            ? const Center(
                child: CircularProgressIndicator(),
              )
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
                          textAlign: TextAlign.center,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _loadRequests,
                          child: const Text('Tentar Novamente'),
                        ),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _buildFilterChip('todos', 'Todos'),
                                const SizedBox(width: 8),
                                _buildFilterChip('aberto', 'Aberto'),
                                const SizedBox(width: 8),
                                _buildFilterChip(
                                    'em_andamento', 'Em Andamento'),
                                const SizedBox(width: 8),
                                _buildFilterChip('concluido', 'Concluído'),
                              ],
                            ),
                          ),
                        ),
                        if (_filteredRequests.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              children: [
                                Icon(
                                  Icons.assignment_outlined,
                                  size: 64,
                                  color: AppTheme.greyLight,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Nenhuma requisição ainda',
                                  style:
                                      Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Crie uma nova requisição de manutenção',
                                  style:
                                      Theme.of(context).textTheme.bodySmall,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          )
                        else
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              children: _filteredRequests
                                  .map((request) =>
                                      _buildRequestCard(request))
                                  .toList(),
                            ),
                          ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.of(context).pushNamed('/requests/new').then((result) {
            if (result == true) {
              _loadRequests();
            }
          });
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildFilterChip(String status, String label) {
    final isSelected = _selectedStatus == status;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) => _onStatusFilterChanged(status),
      backgroundColor: AppTheme.greyLighter,
      selectedColor: AppTheme.primaryColor,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textPrimary,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _buildRequestCard(MaintenanceRequest request) {
    final priorityColor = _getPriorityColor(request.priority);
    final priorityLabel = _getPriorityLabel(request.priority);
    final statusLabel = _getStatusLabel(request.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _showRequestDetail(request),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          request.title,
                          style: Theme.of(context).textTheme.titleLarge,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        if (request.description != null)
                          Text(
                            request.description!,
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: priorityColor.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: priorityColor.withOpacity(0.3),
                      ),
                    ),
                    child: Text(
                      priorityLabel,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: priorityColor,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      statusLabel,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                  if (request.createdAt != null)
                    Text(
                      _formatDate(request.createdAt!),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return '${difference.inMinutes}m atrás';
      }
      return '${difference.inHours}h atrás';
    } else if (difference.inDays == 1) {
      return 'Ontem';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d atrás';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }
}
