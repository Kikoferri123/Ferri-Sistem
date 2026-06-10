import 'package:dream_abroad/models/maintenance_request.dart';
import 'package:dream_abroad/utils/theme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class RequestsDetailSheet extends StatelessWidget {
  final MaintenanceRequest request;

  const RequestsDetailSheet({
    Key? key,
    required this.request,
  }) : super(key: key);

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

  String _formatDate(DateTime? date) {
    if (date == null) return 'N/A';
    return '${date.day}/${date.month}/${date.year} às ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final priorityColor = _getPriorityColor(request.priority);
    final priorityLabel = _getPriorityLabel(request.priority);
    final statusLabel = _getStatusLabel(request.status);

    return DraggableScrollableSheet(
      expand: false,
      builder: (context, scrollController) {
        return SingleChildScrollView(
          controller: scrollController,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        request.title,
                        style: Theme.of(context).textTheme.headlineSmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: priorityColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: priorityColor.withOpacity(0.3),
                        ),
                      ),
                      child: Text(
                        'Prioridade: $priorityLabel',
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: priorityColor,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryColor.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: AppTheme.primaryColor.withOpacity(0.3),
                        ),
                      ),
                      child: Text(
                        statusLabel,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppTheme.primaryColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                if (request.description != null && request.description!.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Descrição',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.backgroundColor,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: AppTheme.greyLight,
                          ),
                        ),
                        child: Text(
                          request.description!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                _buildDetailRow(
                  'ID da Requisição',
                  '#${request.id}',
                  context,
                ),
                _buildDetailRow(
                  'Propriedade',
                  request.propertyName ?? 'Não especificada',
                  context,
                ),
                _buildDetailRow(
                  'Data de Criação',
                  _formatDate(request.createdAt),
                  context,
                ),
                if (request.updatedAt != null)
                  _buildDetailRow(
                    'Última Atualização',
                    _formatDate(request.updatedAt),
                    context,
                  ),
                if (request.resolvedAt != null)
                  _buildDetailRow(
                    'Data de Resolução',
                    _formatDate(request.resolvedAt),
                    context,
                  ),
                if (request.cost != null && request.cost! > 0)
                  _buildDetailRow(
                    'Custo Estimado',
                    'EUR ${request.cost!.toStringAsFixed(2)}',
                    context,
                  ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Fechar'),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(
    String label,
    String value,
    BuildContext context,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.end,
            ),
          ),
        ],
      ),
    );
  }
}
