import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:dream_abroad/models/client_profile.dart';
import 'package:dream_abroad/models/reward.dart';
import 'package:dream_abroad/providers/auth_provider.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';
import 'edit_profile_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  late ClientService _clientService;
  late Future<ClientProfile> _profileFuture;
  late Future<RewardInfo?> _rewardsFuture;

  @override
  void initState() {
    super.initState();
    _clientService = ClientService();
    _profileFuture = _clientService.getProfile();
    _rewardsFuture = _loadRewards();
  }

  Future<RewardInfo?> _loadRewards() async {
    try {
      return await _clientService.getRewards();
    } catch (e) {
      print('[ProfileScreen] Failed to load rewards: $e');
      return null;
    }
  }

  Future<void> _refresh() async {
    setState(() {
      _profileFuture = _clientService.getProfile();
      _rewardsFuture = _loadRewards();
    });
  }

  void _handleLogout() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Confirmar saída'),
        content: const Text('Tem certeza que deseja sair da sua conta?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await context.read<AuthProvider>().logout();
              if (mounted) context.go('/login');
            },
            child: const Text(
              'Sair',
              style: TextStyle(color: AppTheme.errorColor),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Meu Perfil'),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: AppTheme.primaryColor,
        child: FutureBuilder<ClientProfile>(
          future: _profileFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const _LoadingProfileState();
            }

            if (snapshot.hasError) {
              return _ErrorProfileState(
                error: snapshot.error.toString(),
                onRetry: _refresh,
              );
            }

            final profile = snapshot.data;
            if (profile == null) {
              return const Center(child: Text('Perfil não encontrado'));
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              child: Column(
                children: [
                  _ProfileHeader(profile: profile),
                  const SizedBox(height: 24),
                  _PersonalInfoCard(profile: profile),
                  const SizedBox(height: 16),
                  _PropertyInfoCard(profile: profile),
                  const SizedBox(height: 16),
                  FutureBuilder<RewardInfo?>(
                    future: _rewardsFuture,
                    builder: (context, rewardSnap) {
                      if (rewardSnap.connectionState == ConnectionState.waiting) {
                        return const SizedBox.shrink();
                      }
                      final rewards = rewardSnap.data;
                      if (rewards == null) return const SizedBox.shrink();
                      return _RewardsCard(rewards: rewards);
                    },
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (context) => EditProfileScreen(
                              profile: profile,
                              onSaved: _refresh,
                            ),
                          ),
                        );
                      },
                      child: const Text('Editar Perfil'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton(
                      onPressed: () => context.push('/documents'),
                      child: const Text('Meus Documentos'),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleLogout,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.errorColor,
                      ),
                      child: const Text('Sair'),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  final ClientProfile profile;

  const _ProfileHeader({required this.profile});

  String _getInitials() {
    final names = profile.name.split(' ');
    if (names.isEmpty) return 'U';
    if (names.length == 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  String _getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'ativo':
      case 'active':
        return 'Ativo';
      case 'inativo':
      case 'inactive':
        return 'Inativo';
      case 'suspenso':
      case 'suspended':
        return 'Suspenso';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'ativo':
      case 'active':
        return AppTheme.successColor;
      case 'inativo':
      case 'inactive':
        return AppTheme.greyMedium;
      case 'suspenso':
      case 'suspended':
        return AppTheme.errorColor;
      default:
        return AppTheme.infoColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 100,
          height: 100,
          decoration: BoxDecoration(
            color: AppTheme.primaryColor,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              _getInitials(),
              style: GoogleFonts.poppins(
                fontSize: 40,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          profile.name,
          style: GoogleFonts.poppins(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          profile.email ?? 'Email não informado',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: AppTheme.textSecondary,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: _getStatusColor(profile.status).withOpacity(0.15),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            _getStatusLabel(profile.status),
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: _getStatusColor(profile.status),
            ),
          ),
        ),
      ],
    );
  }
}

class _PersonalInfoCard extends StatelessWidget {
  final ClientProfile profile;

  const _PersonalInfoCard({required this.profile});

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.surfaceColor,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Informações Pessoais',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _InfoItem(
              icon: Icons.phone_outlined,
              label: 'Telefone',
              value: profile.phone ?? 'Não informado',
            ),
            const SizedBox(height: 12),
            _InfoItem(
              icon: Icons.public_outlined,
              label: 'Nacionalidade',
              value: profile.nationality ?? 'Não informado',
            ),
            const SizedBox(height: 12),
            _InfoItem(
              icon: Icons.cake_outlined,
              label: 'Data de Nascimento',
              value: _formatDate(profile.birthDate),
            ),
            const SizedBox(height: 12),
            _InfoItem(
              icon: Icons.badge_outlined,
              label: 'Documento',
              value: profile.documentId ?? 'Não informado',
            ),
          ],
        ),
      ),
    );
  }
}

class _PropertyInfoCard extends StatelessWidget {
  final ClientProfile profile;

  const _PropertyInfoCard({required this.profile});

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  String _formatCurrency(double? value) {
    if (value == null) return 'N/A';
    return '€${value.toStringAsFixed(2)}';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.surfaceColor,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Meu Alojamento',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _InfoItem(
              icon: Icons.home_outlined,
              label: 'Propriedade',
              value: profile.propertyName ?? 'Não atribuído',
            ),
            const SizedBox(height: 12),
            _InfoItem(
              icon: Icons.door_front_door_outlined,
              label: 'Quarto',
              value: profile.myRoomName ?? profile.roomName ?? 'Não atribuído',
            ),
            const SizedBox(height: 12),
            _InfoItem(
              icon: Icons.bed_outlined,
              label: 'Cama',
              value: profile.myBedName ?? profile.bedName ?? 'Não atribuído',
            ),
            const SizedBox(height: 12),
            _InfoItem(
              icon: Icons.attach_money_outlined,
              label: 'Valor Mensal',
              value: _formatCurrency(profile.myBedValue ?? profile.myRoomValue ?? profile.monthlyValue),
              valueColor: AppTheme.accentColor,
            ),
            if (profile.contractEndDate != null) ...[
              const SizedBox(height: 12),
              _InfoItem(
                icon: Icons.event_outlined,
                label: 'Vencimento do Contrato',
                value: _formatDate(profile.contractEndDate),
              ),
            ],
            if (profile.paymentMethod != null) ...[
              const SizedBox(height: 12),
              _InfoItem(
                icon: Icons.payment_outlined,
                label: 'Método de Pagamento',
                value: profile.paymentMethod!,
              ),
            ],
            if (profile.contractSigned != null) ...[
              const SizedBox(height: 12),
              _InfoItem(
                icon: Icons.description_outlined,
                label: 'Contrato',
                value: profile.contractSigned == true ? 'Assinado' : 'Pendente de assinatura',
                valueColor: profile.contractSigned == true ? AppTheme.successColor : AppTheme.warningColor,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FinancialInfoCard extends StatelessWidget {
  final ClientProfile profile;

  const _FinancialInfoCard({required this.profile});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.surfaceColor,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Informações Financeiras',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _InfoItem(
              icon: Icons.attach_money_outlined,
              label: 'Valor Mensal',
              value: profile.monthlyValue != null
                  ? '\$${profile.monthlyValue!.toStringAsFixed(2)}'
                  : 'N/A',
              valueColor: AppTheme.accentColor,
            ),
            const SizedBox(height: 12),
            _InfoItem(
              icon: Icons.payment_outlined,
              label: 'Método de Pagamento',
              value: profile.paymentMethod ?? 'Não informado',
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoItem({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: AppTheme.greyMedium,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: valueColor ?? AppTheme.textPrimary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RewardsCard extends StatelessWidget {
  final RewardInfo rewards;

  const _RewardsCard({required this.rewards});

  String _formatDate(DateTime? date) {
    if (date == null) return '';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.surfaceColor,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Recompensas',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.accentColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    rewards.level,
                    style: GoogleFonts.poppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.accentColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Points display
            Row(
              children: [
                Icon(Icons.star_rounded, size: 28, color: AppTheme.accentColor),
                const SizedBox(width: 8),
                Text(
                  '${rewards.totalPoints}',
                  style: GoogleFonts.poppins(
                    fontSize: 28,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  'pontos',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Progress bar
            if (rewards.nextLevel != null) ...[
              Row(
                children: [
                  Expanded(
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: rewards.levelProgress,
                        backgroundColor: AppTheme.greyMedium.withOpacity(0.2),
                        color: AppTheme.accentColor,
                        minHeight: 6,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    rewards.nextLevel!,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Faltam ${rewards.pointsToNextLevel} pontos para ${rewards.nextLevel}',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
            if (rewards.streakMonths > 0) ...[
              const SizedBox(height: 12),
              _InfoItem(
                icon: Icons.local_fire_department_rounded,
                label: 'Sequencia',
                value: '${rewards.streakMonths} ${rewards.streakMonths == 1 ? "mes" : "meses"} consecutivos',
                valueColor: Colors.deepOrange,
              ),
            ],
            // Recent transactions
            if (rewards.transactions.isNotEmpty) ...[
              const SizedBox(height: 16),
              const Divider(),
              const SizedBox(height: 8),
              Text(
                'Historico recente',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 8),
              ...rewards.transactions.take(5).map((tx) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Icon(
                      tx.points >= 0 ? Icons.add_circle_outline : Icons.remove_circle_outline,
                      size: 18,
                      color: tx.points >= 0 ? AppTheme.successColor : AppTheme.errorColor,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        tx.description ?? tx.type,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: AppTheme.textPrimary,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Text(
                      '${tx.points >= 0 ? "+" : ""}${tx.points}',
                      style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: tx.points >= 0 ? AppTheme.successColor : AppTheme.errorColor,
                      ),
                    ),
                    if (tx.createdAt != null) ...[
                      const SizedBox(width: 8),
                      Text(
                        _formatDate(tx.createdAt),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppTheme.textSecondary,
                        ),
                      ),
                    ],
                  ],
                ),
              )),
            ],
          ],
        ),
      ),
    );
  }
}

class _LoadingProfileState extends StatelessWidget {
  const _LoadingProfileState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(
            color: AppTheme.primaryColor,
          ),
          const SizedBox(height: 16),
          Text(
            'Carregando perfil...',
            style: GoogleFonts.poppins(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: AppTheme.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorProfileState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorProfileState({
    required this.error,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const SizedBox(height: 40),
            Icon(
              Icons.error_outline,
              size: 80,
              color: AppTheme.errorColor,
            ),
            const SizedBox(height: 16),
            Text(
              'Erro ao carregar perfil',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.errorColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.errorColor.withOpacity(0.3)),
              ),
              child: SelectableText(
                error,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textPrimary,
                  height: 1.5,
                ),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Tentar novamente'),
            ),
          ],
        ),
      ),
    );
  }
}
