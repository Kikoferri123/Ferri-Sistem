import 'package:dream_abroad/models/payment.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

class PaymentsScreen extends StatefulWidget {
  const PaymentsScreen({Key? key}) : super(key: key);

  @override
  State<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends State<PaymentsScreen> {
  final ClientService _clientService = ClientService();
  final ImagePicker _imagePicker = ImagePicker();

  List<Payment> _payments = [];
  List<Payment> _filteredPayments = [];
  bool _isLoading = false;
  String? _error;
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;

  @override
  void initState() {
    super.initState();
    _loadPayments();
  }

  Future<void> _loadPayments() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final payments = await _clientService.getPayments();
      setState(() {
        _payments = payments;
        _filterPayments();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar pagamentos';
        _isLoading = false;
      });
    }
  }

  void _filterPayments() {
    _filteredPayments = _payments
        .where((p) =>
            p.competenciaMonth == _selectedMonth &&
            p.competenciaYear == _selectedYear)
        .toList();
    _filteredPayments.sort((a, b) => b.date.compareTo(a.date));
  }

  void _onMonthSelected(int month, int year) {
    setState(() {
      _selectedMonth = month;
      _selectedYear = year;
      _filterPayments();
    });
  }

  Future<void> _uploadReceipt() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
      );
      if (image != null) {
        _showUploadDialog(image.path);
      }
    } catch (e) {
      _showError('Erro ao selecionar arquivo');
    }
  }

  void _showUploadDialog(String filePath) {
    showDialog(
      context: context,
      builder: (context) => _UploadReceiptDialog(
        filePath: filePath,
        clientService: _clientService,
        onSuccess: () {
          Navigator.pop(context);
          _showSuccess('Comprovante enviado com sucesso!');
          _loadPayments();
        },
        onError: (error) {
          Navigator.pop(context);
          _showError(error);
        },
      ),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _showSuccess(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
      ),
    );
  }

  double _calculateTotal(List<Payment> payments) {
    return payments.fold(0, (sum, p) => sum + p.amount);
  }

  double _getMonthlyAverage() {
    if (_payments.isEmpty) return 0;
    final totalAmount = _payments.fold(0.0, (sum, p) => sum + p.amount);
    return totalAmount / 12;
  }

  @override
  Widget build(BuildContext context) {
    final total = _calculateTotal(_payments);
    final monthlyAvg = _getMonthlyAverage();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Meus Pagamentos'),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadPayments,
        child: _isLoading && _payments.isEmpty
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
                          onPressed: _loadPayments,
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
                          child: Column(
                            children: [
                              _buildSummaryCard(
                                'Total Este Ano',
                                'EUR ${total.toStringAsFixed(2)}',
                                Colors.blue,
                              ),
                              const SizedBox(height: 12),
                              _buildSummaryCard(
                                'Valor Médio Mensal',
                                'EUR ${monthlyAvg.toStringAsFixed(2)}',
                                Colors.green,
                              ),
                            ],
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildMonthFilter(),
                        ),
                        const SizedBox(height: 16),
                        if (_filteredPayments.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              children: [
                                Icon(
                                  Icons.receipt_long_outlined,
                                  size: 64,
                                  color: AppTheme.greyLight,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Nenhum pagamento neste mês',
                                  style:
                                      Theme.of(context).textTheme.titleLarge,
                                ),
                              ],
                            ),
                          )
                        else
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              children: _filteredPayments
                                  .map((payment) =>
                                      _buildPaymentCard(payment))
                                  .toList(),
                            ),
                          ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _uploadReceipt,
        child: const Icon(Icons.upload_file),
      ),
    );
  }

  Widget _buildSummaryCard(String label, String value, Color color) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: AppTheme.greyMedium,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMonthFilter() {
    final now = DateTime.now();
    final months = List.generate(12, (index) {
      final date = DateTime(now.year, index + 1);
      return date;
    }).reversed.toList();

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: months.map((date) {
          final isSelected = date.month == _selectedMonth &&
              date.year == _selectedYear;
          final monthName = _getMonthName(date.month);

          return GestureDetector(
            onTap: () => _onMonthSelected(date.month, date.year),
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              decoration: BoxDecoration(
                color: isSelected
                    ? AppTheme.primaryColor
                    : AppTheme.greyLighter,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                monthName,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: isSelected ? Colors.white : AppTheme.textPrimary,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPaymentCard(Payment payment) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        payment.description ?? 'Pagamento',
                        style: Theme.of(context).textTheme.titleLarge,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      if (payment.propertyName != null)
                        Text(
                          payment.propertyName!,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                    ],
                  ),
                ),
                Text(
                  'EUR ${payment.amount.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (payment.category != null)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getCategoryColor(payment.category!)
                          .withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      payment.category!,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color:
                            _getCategoryColor(payment.category!),
                      ),
                    ),
                  )
                else
                  const SizedBox.shrink(),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _formatDate(payment.date),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    if (payment.competenciaMonth != null)
                      Text(
                        'Ref: ${payment.competenciaFormatted}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppTheme.greyMedium,
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Color _getCategoryColor(String category) {
    return switch (category.toLowerCase()) {
      'rent' => Colors.blue,
      'deposit' => Colors.green,
      'utilities' => Colors.orange,
      'maintenance' => Colors.red,
      'insurance' => Colors.purple,
      _ => Colors.grey,
    };
  }

  String _getMonthName(int month) {
    const months = [
      'Jan',
      'Fev',
      'Mar',
      'Abr',
      'Mai',
      'Jun',
      'Jul',
      'Ago',
      'Set',
      'Out',
      'Nov',
      'Dez'
    ];
    return months[month - 1];
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

class _UploadReceiptDialog extends StatefulWidget {
  final String filePath;
  final ClientService clientService;
  final Function() onSuccess;
  final Function(String) onError;

  const _UploadReceiptDialog({
    required this.filePath,
    required this.clientService,
    required this.onSuccess,
    required this.onError,
  });

  @override
  State<_UploadReceiptDialog> createState() => _UploadReceiptDialogState();
}

class _UploadReceiptDialogState extends State<_UploadReceiptDialog> {
  bool _isUploading = false;

  Future<void> _upload() async {
    setState(() => _isUploading = true);

    try {
      await widget.clientService.uploadDocument(
        filePath: widget.filePath,
        category: 'payment_receipt',
        documentName: 'Comprovante de Pagamento',
      );
      widget.onSuccess();
    } catch (e) {
      widget.onError('Erro ao enviar comprovante');
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Enviar Comprovante'),
      content: const Text('Confirma o envio deste comprovante de pagamento?'),
      actions: [
        TextButton(
          onPressed: _isUploading ? null : () => Navigator.pop(context),
          child: const Text('Cancelar'),
        ),
        ElevatedButton(
          onPressed: _isUploading ? null : _upload,
          child: _isUploading
              ? const SizedBox(
                  height: 20,
                  width: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                  ),
                )
              : const Text('Enviar'),
        ),
      ],
    );
  }
}
