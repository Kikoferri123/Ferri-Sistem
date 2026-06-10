import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dream_abroad/models/reward.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';

class RewardsScreen extends StatefulWidget {
  const RewardsScreen({Key? key}) : super(key: key);

  @override
  State<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends State<RewardsScreen> {
  late ClientService _clientService;
  late Future<RewardInfo> _rewardFuture;

  @override
  void initState() {
    super.initState();
    _clientService = ClientService();
    _rewardFuture = _clientService.getRewards();
  }

  Future<void> _refreshRewards() async {
    setState(() {
      _rewardFuture = _clientService.getRewards();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Recompensas',
          style: GoogleFonts.poppins(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        backgroundColor: const Color(0xFF1B4D3E),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _refreshRewards,
        color: const Color(0xFFE8B931),
        child: FutureBuilder<RewardInfo>(
          future: _rewardFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(
                  valueColor:
                      AlwaysStoppedAnimation<Color>(Color(0xFFE8B931)),
                ),
              );
            }

            if (snapshot.hasError) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.error_outline,
                      size: 64,
                      color: Colors.grey[400],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Erro ao carregar recompensas',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: _refreshRewards,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFE8B931),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 12,
                        ),
                      ),
                      child: Text(
                        'Tentar novamente',
                        style: GoogleFonts.poppins(
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }

            if (!snapshot.hasData) {
              return Center(
                child: Text(
                  'Nenhum dado disponível',
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    color: Colors.grey[600],
                  ),
                ),
              );
            }

            final rewardInfo = snapshot.data!;

            return SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                children: [
                  // Hero Section - Level and Points
                  _buildHeroSection(rewardInfo),

                  // Streak Section
                  _buildStreakSection(rewardInfo),

                  // Benefits Section
                  _buildBenefitsSection(rewardInfo),

                  // Transaction History
                  _buildTransactionHistory(rewardInfo),

                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildHeroSection(RewardInfo rewardInfo) {
    final levelColor = _getLevelColor(rewardInfo.level);
    final levelIcon = _getLevelIcon(rewardInfo.level);

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFF1B4D3E),
            const Color(0xFF2D6B5F),
          ],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            // Level Badge
            Container(
              width: 160,
              height: 160,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: _getLevelGradient(rewardInfo.level),
                ),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: levelColor.withOpacity(0.5),
                    blurRadius: 20,
                    spreadRadius: 5,
                  ),
                ],
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      levelIcon,
                      size: 64,
                      color: Colors.white,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      rewardInfo.level,
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Total Points
            Column(
              children: [
                Text(
                  'Pontos Totais',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.white70,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${rewardInfo.totalPoints}',
                  style: GoogleFonts.poppins(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFFE8B931),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Progress Bar
            Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Progresso para ${rewardInfo.nextLevel}',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Colors.white70,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      '${rewardInfo.pointsToNextLevel} pontos',
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: const Color(0xFFE8B931),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: LinearProgressIndicator(
                    value: rewardInfo.levelProgress,
                    minHeight: 12,
                    backgroundColor: Colors.white24,
                    valueColor: const AlwaysStoppedAnimation<Color>(
                      Color(0xFFE8B931),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStreakSection(RewardInfo rewardInfo) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.amber[100]!,
            Colors.orange[100]!,
          ],
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.orange.withOpacity(0.3),
            blurRadius: 12,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text(
            '🔥',
            style: TextStyle(fontSize: 36),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${rewardInfo.streakMonths} meses consecutivos',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.orange[900],
                ),
              ),
              Text(
                'Mantenha sua sequência!',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: Colors.orange[700],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBenefitsSection(RewardInfo rewardInfo) {
    final benefits = {
      'Bronze': [
        'Acesso básico à plataforma',
        'Recebe 1 ponto por interação',
      ],
      'Silver': [
        'Tudo do Bronze',
        'Recebe 1.5 pontos por interação',
        'Desconto de 5% em serviços',
      ],
      'Gold': [
        'Tudo da Silver',
        'Recebe 2 pontos por interação',
        'Desconto de 10% em serviços',
        'Acesso a conteúdo exclusivo',
      ],
      'Platinum': [
        'Tudo da Gold',
        'Recebe 3 pontos por interação',
        'Desconto de 15% em serviços',
        'Suporte prioritário 24/7',
        'Bônus de 500 pontos mensais',
      ],
    };

    final currentBenefits = benefits[rewardInfo.level] ?? [];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Benefícios de ${rewardInfo.level}',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1B4D3E),
            ),
          ),
          const SizedBox(height: 16),
          ...currentBenefits.map(
            (benefit) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                children: [
                  Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: const Color(0xFFE8B931).withOpacity(0.2),
                    ),
                    child: const Icon(
                      Icons.check,
                      size: 14,
                      color: Color(0xFFE8B931),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      benefit,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: Colors.grey[800],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionHistory(RewardInfo rewardInfo) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Histórico de Transações',
            style: GoogleFonts.poppins(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF1B4D3E),
            ),
          ),
          const SizedBox(height: 12),
          if (rewardInfo.transactions.isEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  'Nenhuma transação registrada',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: rewardInfo.transactions.length,
              separatorBuilder: (context, index) => const Divider(
                height: 1,
                color: Color(0xFFF0F0F0),
              ),
              itemBuilder: (context, index) {
                final transaction = rewardInfo.transactions[index];
                final isEarning = transaction.type == 'earning';

                return Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: index == 0
                        ? const BorderRadius.only(
                            topLeft: Radius.circular(12),
                            topRight: Radius.circular(12),
                          )
                        : index == rewardInfo.transactions.length - 1
                            ? const BorderRadius.only(
                                bottomLeft: Radius.circular(12),
                                bottomRight: Radius.circular(12),
                              )
                            : BorderRadius.zero,
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              transaction.description ?? '',
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF1B4D3E),
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              _formatDate(transaction.createdAt ?? DateTime.now()),
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                color: Colors.grey[500],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: isEarning
                              ? const Color(0xFFE8B931).withOpacity(0.2)
                              : Colors.red.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${isEarning ? '+' : '-'}${transaction.points}',
                          style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: isEarning
                                ? const Color(0xFFE8B931)
                                : Colors.red,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Color _getLevelColor(String level) {
    switch (level) {
      case 'Bronze':
        return const Color(0xFFCD7F32);
      case 'Silver':
        return const Color(0xFFC0C0C0);
      case 'Gold':
        return const Color(0xFFFFD700);
      case 'Platinum':
        return const Color(0xFF8B5CF6);
      default:
        return const Color(0xFFCD7F32);
    }
  }

  List<Color> _getLevelGradient(String level) {
    switch (level) {
      case 'Bronze':
        return [
          const Color(0xFFCD7F32),
          const Color(0xFF8B5A2B),
        ];
      case 'Silver':
        return [
          const Color(0xFFC0C0C0),
          const Color(0xFF808080),
        ];
      case 'Gold':
        return [
          const Color(0xFFFFD700),
          const Color(0xFFFFA500),
        ];
      case 'Platinum':
        return [
          const Color(0xFF8B5CF6),
          const Color(0xFF6D28D9),
        ];
      default:
        return [
          const Color(0xFFCD7F32),
          const Color(0xFF8B5A2B),
        ];
    }
  }

  IconData _getLevelIcon(String level) {
    switch (level) {
      case 'Bronze':
        return Icons.shield;
      case 'Silver':
        return Icons.shield_outlined;
      case 'Gold':
        return Icons.star;
      case 'Platinum':
        return Icons.diamond;
      default:
        return Icons.shield;
    }
  }

  String _formatDate(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        return 'Há ${difference.inMinutes} minuto${difference.inMinutes != 1 ? 's' : ''}';
      }
      return 'Há ${difference.inHours} hora${difference.inHours != 1 ? 's' : ''}';
    }

    if (difference.inDays == 1) {
      return 'Ontem';
    }

    if (difference.inDays < 7) {
      return 'Há ${difference.inDays} dia${difference.inDays != 1 ? 's' : ''}';
    }

    return '${dateTime.day}/${dateTime.month}/${dateTime.year}';
  }
}
