import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dream_abroad/models/contract.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';
import 'contract_detail_screen.dart';

class ContractsScreen extends StatefulWidget {
  const ContractsScreen({Key? key}) : super(key: key);

  @override
  State<ContractsScreen> createState() => _ContractsScreenState();
}

class _ContractsScreenState extends State<ContractsScreen> {
  late ClientService _clientService;
  late Future<List<Contract>> _contractsFuture;
  String _selectedStatus = 'todos';

  @override
  void initState() {
    super.initState();
    _clientService = ClientService();
    _contractsFuture = _getContracts();
  }

  Future<List<Contract>> _getContracts() {
    final status = _selectedStatus == 'todos' ? null : _selectedStatus;
    return _clientService.getContracts(status: status);
  }

  Future<void> _refresh() async {
    setState(() {
      _contractsFuture = _getContracts();
    });
  }

  void _onStatusFilterChanged(String status) {
    setState(() {
      _selectedStatus = status;
      _contractsFuture = _getContracts();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Meus Contratos'),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: AppTheme.primaryColor,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Row(
                  children: [
                    _FilterChip(
                      label: 'Todos',
                      isSelected: _selectedStatus == 'todos',
                      onTap: () => _onStatusFilterChanged('todos'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Vigente',
                      isSelected: _selectedStatus == 'vigente',
                      onTap: () => _onStatusFilterChanged('vigente'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Pendente',
                      isSelected: _selectedStatus == 'pendente',
                      onTap: () => _onStatusFilterChanged('pendente'),
                    ),
                    const SizedBox(width: 8),
                    _FilterChip(
                      label: 'Expirado',
                      isSelected: _selectedStatus == 'expirado',
                      onTap: () => _onStatusFilterChanged('expirado'),
                    ),
                  ],
                ),
              ),
            ),
            FutureBuilder<List<Contract>>(
              future: _contractsFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: List.generate(
                          3,
                          (index) => Padding(
                            padding: const EdgeInsets.only(bottom: 12),
                            child: const _ContractCardShimmer(),
                          ),
                        ),
                      ),
                    ),
                  );
                }

                if (snapshot.hasError) {
                  return SliverFillRemaining(
                    child: _ErrorState(
                      error: snapshot.error.toString(),
                      onRetry: _refresh,
                    ),
                  );
                }

                final contracts = snapshot.data ?? [];

                if (contracts.isEmpty) {
                  return const SliverFillRemaining(
                    child: _EmptyState(),
                  );
                }

                return SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, index) {
                        final contract = contracts[index];
                        return _ContractCard(
                          contract: contract,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => ContractDetailScreen(
                                  contractId: contract.id,
                                ),
                              ),
                            );
                          },
                        );
                      },
                      childCount: contracts.length,
                    ),
                  ),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => onTap(),
      selectedColor: AppTheme.primaryColor,
      backgroundColor: AppTheme.greyLighter,
      labelStyle: GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w500,
        color: isSelected ? Colors.white : AppTheme.textPrimary,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.primaryColor : AppTheme.greyLight,
        width: 1,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
    );
  }
}

class _ContractCard extends StatelessWidget {
  final Contract contract;
  final VoidCallback onTap;

  const _ContractCard({
    required this.contract,
    required this.onTap,
  });

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'vigente':
      case 'active':
      case 'signed':
        return AppTheme.successColor;
      case 'pendente':
      case 'pending':
        return AppTheme.warningColor;
      case 'expirado':
      case 'expired':
        return const Color(0xFF9E9E9E);
      case 'cancelado':
      case 'cancelled':
        return const Color(0xFF757575);
      default:
        return AppTheme.infoColor;
    }
  }

  String _getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'vigente':
      case 'active':
      case 'signed':
        return 'Vigente';
      case 'pendente':
      case 'pending':
        return 'Pendente';
      case 'expirado':
      case 'expired':
        return 'Expirado';
      case 'cancelado':
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  }

  IconData _getTypeIcon() {
    final type = contract.type.toLowerCase();
    if (type.contains('lease') || type.contains('aluguel')) {
      return Icons.home_outlined;
    } else if (type.contains('maintenance') || type.contains('manutencao')) {
      return Icons.build_outlined;
    } else if (type.contains('service') || type.contains('servico')) {
      return Icons.handshake_outlined;
    }
    return Icons.description_outlined;
  }

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  String _formatCurrency(double? value) {
    if (value == null) return 'N/A';
    return '\$${value.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Card(
        margin: const EdgeInsets.only(bottom: 12),
        color: AppTheme.surfaceColor,
        elevation: 1,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getTypeIcon(),
                      color: AppTheme.primaryColor,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          contract.type,
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w500,
                            color: AppTheme.greyMedium,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          contract.propertyName ?? 'Propriedade',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(contract.status).withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      _getStatusLabel(contract.status),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: _getStatusColor(contract.status),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Divider(
                color: AppTheme.greyLighter,
                height: 1,
                thickness: 1,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.date_range_outlined,
                    size: 16,
                    color: AppTheme.greyMedium,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '${_formatDate(contract.startDate)} até ${_formatDate(contract.endDate)}',
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(
                    Icons.attach_money_outlined,
                    size: 16,
                    color: AppTheme.accentColor,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '${_formatCurrency(contract.value)}/mês',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.accentColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ContractCardShimmer extends StatelessWidget {
  const _ContractCardShimmer();

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: AppTheme.surfaceColor,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.greyLighter,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 12,
                        width: 80,
                        decoration: BoxDecoration(
                          color: AppTheme.greyLighter,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        height: 16,
                        width: 150,
                        decoration: BoxDecoration(
                          color: AppTheme.greyLighter,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 70,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppTheme.greyLighter,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              height: 1,
              color: AppTheme.greyLighter,
            ),
            const SizedBox(height: 12),
            Container(
              height: 14,
              width: 200,
              decoration: BoxDecoration(
                color: AppTheme.greyLighter,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
            const SizedBox(height: 8),
            Container(
              height: 14,
              width: 120,
              decoration: BoxDecoration(
                color: AppTheme.greyLighter,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.description_outlined,
            size: 80,
            color: AppTheme.greyLight,
          ),
          const SizedBox(height: 16),
          Text(
            'Nenhum contrato encontrado',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Seus contratos aparecerão aqui',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorState({
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.error_outline,
            size: 80,
            color: AppTheme.errorColor,
          ),
          const SizedBox(height: 16),
          Text(
            'Erro ao carregar contratos',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32),
            child: Text(
              error,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: AppTheme.textSecondary,
              ),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: onRetry,
            child: const Text('Tentar novamente'),
          ),
        ],
      ),
    );
  }
}
