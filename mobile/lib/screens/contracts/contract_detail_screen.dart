import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dream_abroad/models/contract.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';
import 'dart:convert';
import 'dart:ui' as ui;

class ContractDetailScreen extends StatefulWidget {
  final int contractId;

  const ContractDetailScreen({
    Key? key,
    required this.contractId,
  }) : super(key: key);

  @override
  State<ContractDetailScreen> createState() => _ContractDetailScreenState();
}

class _ContractDetailScreenState extends State<ContractDetailScreen> {
  late ClientService _clientService;
  late Future<Contract> _contractFuture;
  List<Offset> _signaturePoints = [];
  final GlobalKey<_SignaturePadState> _signaturePadKey = GlobalKey();
  bool _showSignaturePad = false;
  bool _isSigning = false;

  @override
  void initState() {
    super.initState();
    _clientService = ClientService();
    _contractFuture = _clientService.getContractDetail(widget.contractId);
  }

  Future<void> _handleSign(Contract contract) async {
    if (!contract.canBeSigned) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Este contrato não pode ser assinado')),
      );
      return;
    }

    setState(() {
      _showSignaturePad = true;
    });
  }

  Future<void> _submitSignature(Contract contract) async {
    final signatureImage = await _signaturePadKey.currentState?.getSignatureImage();
    if (signatureImage == null || signatureImage.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, assine o contrato')),
      );
      return;
    }

    setState(() {
      _isSigning = true;
    });

    try {
      await _clientService.signContract(
        contractId: contract.id,
        signatureBase64: signatureImage,
      );

      if (mounted) {
        setState(() {
          _showSignaturePad = false;
          _isSigning = false;
          _contractFuture = _clientService.getContractDetail(widget.contractId);
        });

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Contrato assinado com sucesso!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSigning = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao assinar: $e')),
        );
      }
    }
  }

  void _clearSignature() {
    _signaturePadKey.currentState?.clear();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Detalhes do Contrato'),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: FutureBuilder<Contract>(
        future: _contractFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const _LoadingState();
          }

          if (snapshot.hasError) {
            return _ErrorDetailState(
              error: snapshot.error.toString(),
              onRetry: () {
                setState(() {
                  _contractFuture =
                      _clientService.getContractDetail(widget.contractId);
                });
              },
            );
          }

          final contract = snapshot.data;
          if (contract == null) {
            return const Center(child: Text('Contrato não encontrado'));
          }

          if (_showSignaturePad) {
            return _SignaturePadWidget(
              contract: contract,
              signaturePadKey: _signaturePadKey,
              isSigning: _isSigning,
              onSubmit: () => _submitSignature(contract),
              onCancel: () => setState(() => _showSignaturePad = false),
              onClear: _clearSignature,
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ContractStatusBadge(contract: contract),
                const SizedBox(height: 20),
                _ContractInfoCard(contract: contract),
                const SizedBox(height: 16),
                _SignaturesSection(contract: contract),
                const SizedBox(height: 16),
                if (contract.canBeSigned) ...[
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () => _handleSign(contract),
                      icon: const Icon(Icons.edit_outlined),
                      label: const Text('Assinar Contrato'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('PDF será aberto em breve')),
                      );
                    },
                    icon: const Icon(Icons.picture_as_pdf_outlined),
                    label: const Text('Ver PDF'),
                  ),
                ),
                if (contract.notes != null && contract.notes!.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  _NotesSection(notes: contract.notes!),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ContractStatusBadge extends StatelessWidget {
  final Contract contract;

  const _ContractStatusBadge({required this.contract});

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
        return 'Pendente de Assinatura';
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

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(contract.status);
    final statusLabel = _getStatusLabel(contract.status);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: statusColor.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Status do Contrato',
            style: GoogleFonts.inter(
              fontSize: 12,
              color: AppTheme.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: statusColor,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                statusLabel,
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: statusColor,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ContractInfoCard extends StatelessWidget {
  final Contract contract;

  const _ContractInfoCard({required this.contract});

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
  }

  int _daysRemaining(DateTime? endDate) {
    if (endDate == null) return 0;
    return endDate.difference(DateTime.now()).inDays;
  }

  @override
  Widget build(BuildContext context) {
    final daysRemaining = _daysRemaining(contract.endDate);

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
              'Informações do Contrato',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _InfoRow(
              label: 'Tipo',
              value: contract.type,
              icon: Icons.description_outlined,
            ),
            const SizedBox(height: 12),
            _InfoRow(
              label: 'Propriedade',
              value: contract.propertyName ?? 'N/A',
              icon: Icons.home_outlined,
            ),
            const SizedBox(height: 12),
            _InfoRow(
              label: 'Período',
              value: '${_formatDate(contract.startDate)} até ${_formatDate(contract.endDate)}',
              icon: Icons.date_range_outlined,
            ),
            const SizedBox(height: 12),
            _InfoRow(
              label: 'Dias Restantes',
              value: daysRemaining > 0 ? '$daysRemaining dias' : 'Expirado',
              icon: Icons.timer_outlined,
              valueColor:
                  daysRemaining > 0 ? AppTheme.successColor : AppTheme.errorColor,
            ),
            const SizedBox(height: 12),
            _InfoRow(
              label: 'Valor Mensal',
              value: '\$${contract.value?.toStringAsFixed(2) ?? 'N/A'}',
              icon: Icons.attach_money_outlined,
              valueColor: AppTheme.accentColor,
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? valueColor;

  const _InfoRow({
    required this.label,
    required this.value,
    required this.icon,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.greyMedium),
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

class _SignaturesSection extends StatelessWidget {
  final Contract contract;

  const _SignaturesSection({required this.contract});

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
              'Assinaturas',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 16),
            _SignatureRow(
              label: 'Locatário',
              isSigned: contract.hasSignatureLicensee,
            ),
            const SizedBox(height: 16),
            _SignatureRow(
              label: 'Locador',
              isSigned: contract.hasSignatureLicensor,
            ),
          ],
        ),
      ),
    );
  }
}

class _SignatureRow extends StatelessWidget {
  final String label;
  final bool isSigned;

  const _SignatureRow({
    required this.label,
    required this.isSigned,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                isSigned ? 'Assinado' : 'Pendente',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: isSigned ? AppTheme.successColor : AppTheme.warningColor,
                ),
              ),
            ],
          ),
        ),
        Icon(
          isSigned ? Icons.check_circle : Icons.schedule,
          color: isSigned ? AppTheme.successColor : AppTheme.warningColor,
          size: 24,
        ),
      ],
    );
  }
}

class _NotesSection extends StatelessWidget {
  final String notes;

  const _NotesSection({required this.notes});

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
              'Anotações',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              notes,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SignaturePadWidget extends StatefulWidget {
  final Contract contract;
  final GlobalKey<_SignaturePadState> signaturePadKey;
  final bool isSigning;
  final VoidCallback onSubmit;
  final VoidCallback onCancel;
  final VoidCallback onClear;

  const _SignaturePadWidget({
    required this.contract,
    required this.signaturePadKey,
    required this.isSigning,
    required this.onSubmit,
    required this.onCancel,
    required this.onClear,
  });

  @override
  State<_SignaturePadWidget> createState() => _SignaturePadWidgetState();
}

class _SignaturePadWidgetState extends State<_SignaturePadWidget> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Assinar Contrato'),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: widget.onCancel,
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Assine no espaço abaixo',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: const BorderSide(
                          color: AppTheme.primaryColor,
                          width: 2,
                        ),
                      ),
                      child: _SignaturePad(key: widget.signaturePadKey),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: widget.isSigning ? null : widget.onSubmit,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: AppTheme.primaryColor,
                      disabledBackgroundColor: AppTheme.greyLight,
                    ),
                    child: widget.isSigning
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Confirmar Assinatura'),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: widget.onClear,
                        child: const Text('Limpar'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: widget.onCancel,
                        child: const Text('Cancelar'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SignaturePad extends StatefulWidget {
  const _SignaturePad({Key? key}) : super(key: key);

  @override
  State<_SignaturePad> createState() => _SignaturePadState();
}

class _SignaturePadState extends State<_SignaturePad> {
  List<Offset?> _signaturePoints = [];

  Future<String> getSignatureImage() async {
    final RenderBox box = context.findRenderObject() as RenderBox;
    final ui.PictureRecorder recorder = ui.PictureRecorder();
    final Canvas canvas = Canvas(
      recorder,
      Rect.fromLTWH(0, 0, box.size.width, box.size.height),
    );

    canvas.drawRect(
      Rect.fromLTWH(0, 0, box.size.width, box.size.height),
      Paint()..color = Colors.white,
    );

    final paint = Paint()
      ..color = AppTheme.primaryColor
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    for (int i = 0; i < _signaturePoints.length - 1; i++) {
      if (_signaturePoints[i] != null && _signaturePoints[i + 1] != null) {
        canvas.drawLine(_signaturePoints[i]!, _signaturePoints[i + 1]!, paint);
      } else if (_signaturePoints[i] != null) {
        canvas.drawPoints(
          ui.PointMode.points,
          [_signaturePoints[i]!],
          paint,
        );
      }
    }

    final image = await recorder.endRecording().toImage(
          box.size.width.toInt(),
          box.size.height.toInt(),
        );
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    return base64Encode(bytes!.buffer.asUint8List());
  }

  void clear() {
    setState(() {
      _signaturePoints.clear();
    });
  }

  void _onPanUpdate(DragUpdateDetails details) {
    setState(() {
      RenderBox box = context.findRenderObject() as RenderBox;
      var localPosition = box.globalToLocal(details.globalPosition);
      _signaturePoints.add(localPosition);
    });
  }

  void _onPanEnd(DragEndDetails details) {
    _signaturePoints.add(null);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanUpdate: _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: CustomPaint(
        painter: _SignaturePainter(_signaturePoints),
        size: Size.infinite,
      ),
    );
  }
}

class _SignaturePainter extends CustomPainter {
  final List<Offset?> points;

  _SignaturePainter(this.points);

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.primaryColor
      ..strokeWidth = 2.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      } else if (points[i] != null) {
        canvas.drawPoints(ui.PointMode.points, [points[i]!], paint);
      }
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) => true;
}

class _LoadingState extends StatelessWidget {
  const _LoadingState();

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
            'Carregando contrato...',
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

class _ErrorDetailState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorDetailState({
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
            'Erro ao carregar contrato',
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
