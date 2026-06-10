import 'package:dream_abroad/models/document.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

class DocumentsScreen extends StatefulWidget {
  const DocumentsScreen({Key? key}) : super(key: key);

  @override
  State<DocumentsScreen> createState() => _DocumentsScreenState();
}

class _DocumentsScreenState extends State<DocumentsScreen> {
  final ClientService _clientService = ClientService();
  final ImagePicker _imagePicker = ImagePicker();

  List<Document> _documents = [];
  List<Document> _filteredDocuments = [];
  bool _isLoading = false;
  String? _error;
  String _selectedCategory = 'todos';

  @override
  void initState() {
    super.initState();
    _loadDocuments();
  }

  Future<void> _loadDocuments() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final documents = await _clientService.getDocuments();
      setState(() {
        _documents = documents;
        _filterDocuments();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Erro ao carregar documentos';
        _isLoading = false;
      });
    }
  }

  void _filterDocuments() {
    if (_selectedCategory == 'todos') {
      _filteredDocuments = _documents;
    } else {
      _filteredDocuments = _documents
          .where((d) => d.category?.toLowerCase() == _selectedCategory)
          .toList();
    }
    _filteredDocuments.sort((a, b) =>
        (b.uploadedAt ?? DateTime.now())
            .compareTo(a.uploadedAt ?? DateTime.now()));
  }

  void _onCategorySelected(String category) {
    setState(() {
      _selectedCategory = category;
      _filterDocuments();
    });
  }

  Future<void> _openDocument(Document document) async {
    if (document.fileUrl == null || document.fileUrl!.isEmpty) {
      _showError('URL do documento não disponível');
      return;
    }

    try {
      final Uri uri = Uri.parse(document.fileUrl!);
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri, mode: LaunchMode.externalApplication);
      } else {
        _showError('Não é possível abrir este documento');
      }
    } catch (e) {
      _showError('Erro ao abrir documento');
    }
  }

  void _showUploadOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.camera_alt),
                title: const Text('Tirar Foto'),
                onTap: () {
                  Navigator.pop(context);
                  _uploadFromCamera();
                },
              ),
              ListTile(
                leading: const Icon(Icons.image),
                title: const Text('Galeria'),
                onTap: () {
                  Navigator.pop(context);
                  _uploadFromGallery();
                },
              ),
              ListTile(
                leading: const Icon(Icons.description),
                title: const Text('Escolher Arquivo'),
                onTap: () {
                  Navigator.pop(context);
                  _uploadFromGallery();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _uploadFromCamera() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.camera,
      );
      if (image != null) {
        _showUploadDialog(image.path, image.name);
      }
    } catch (e) {
      _showError('Erro ao tirar foto');
    }
  }

  Future<void> _uploadFromGallery() async {
    try {
      final XFile? image = await _imagePicker.pickImage(
        source: ImageSource.gallery,
      );
      if (image != null) {
        _showUploadDialog(image.path, image.name);
      }
    } catch (e) {
      _showError('Erro ao selecionar arquivo');
    }
  }

  void _showUploadDialog(String filePath, String fileName) {
    showDialog(
      context: context,
      builder: (context) => _DocumentUploadDialog(
        filePath: filePath,
        fileName: fileName,
        clientService: _clientService,
        onSuccess: () {
          Navigator.pop(context);
          _showSuccess('Documento enviado com sucesso!');
          _loadDocuments();
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

  IconData _getFileIcon(Document document) {
    if (document.isPdf) return Icons.picture_as_pdf;
    if (document.isImage) return Icons.image;
    if (document.isText) return Icons.description;
    return Icons.insert_drive_file;
  }

  Color _getIconColor(Document document) {
    if (document.isPdf) return Colors.red;
    if (document.isImage) return Colors.blue;
    if (document.isText) return Colors.orange;
    return AppTheme.greyMedium;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Meus Documentos'),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadDocuments,
        child: _isLoading && _documents.isEmpty
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
                          onPressed: _loadDocuments,
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
                                _buildCategoryChip('todos', 'Todos'),
                                const SizedBox(width: 8),
                                _buildCategoryChip('contratos', 'Contratos'),
                                const SizedBox(width: 8),
                                _buildCategoryChip(
                                    'comprovantes', 'Comprovantes'),
                                const SizedBox(width: 8),
                                _buildCategoryChip('fotos', 'Fotos'),
                                const SizedBox(width: 8),
                                _buildCategoryChip('outros', 'Outros'),
                              ],
                            ),
                          ),
                        ),
                        if (_filteredDocuments.isEmpty)
                          Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              children: [
                                Icon(
                                  Icons.folder_open_outlined,
                                  size: 64,
                                  color: AppTheme.greyLight,
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Nenhum documento',
                                  style:
                                      Theme.of(context).textTheme.titleLarge,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'Comece uploading seus documentos',
                                  style:
                                      Theme.of(context).textTheme.bodySmall,
                                ),
                              ],
                            ),
                          )
                        else
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: Column(
                              children: _filteredDocuments
                                  .map((document) =>
                                      _buildDocumentCard(document))
                                  .toList(),
                            ),
                          ),
                        const SizedBox(height: 24),
                      ],
                    ),
                  ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showUploadOptions,
        child: const Icon(Icons.upload_file),
      ),
    );
  }

  Widget _buildCategoryChip(String category, String label) {
    final isSelected = _selectedCategory == category;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) => _onCategorySelected(category),
      backgroundColor: AppTheme.greyLighter,
      selectedColor: AppTheme.primaryColor,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textPrimary,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _buildDocumentCard(Document document) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () => _openDocument(document),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: _getIconColor(document).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  _getFileIcon(document),
                  color: _getIconColor(document),
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      document.name,
                      style: Theme.of(context).textTheme.titleLarge,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        if (document.category != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              document.category!,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ),
                        const SizedBox(width: 8),
                        Text(
                          document.fileSizeFormatted,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    if (document.uploadedAt != null)
                      Text(
                        _formatDate(document.uploadedAt!),
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          color: AppTheme.greyMedium,
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Icon(
                Icons.arrow_forward_ios,
                size: 16,
                color: AppTheme.greyMedium,
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

class _DocumentUploadDialog extends StatefulWidget {
  final String filePath;
  final String fileName;
  final ClientService clientService;
  final Function() onSuccess;
  final Function(String) onError;

  const _DocumentUploadDialog({
    required this.filePath,
    required this.fileName,
    required this.clientService,
    required this.onSuccess,
    required this.onError,
  });

  @override
  State<_DocumentUploadDialog> createState() => _DocumentUploadDialogState();
}

class _DocumentUploadDialogState extends State<_DocumentUploadDialog> {
  String _selectedCategory = 'outros';
  bool _isUploading = false;

  Future<void> _upload() async {
    setState(() => _isUploading = true);

    try {
      await widget.clientService.uploadDocument(
        filePath: widget.filePath,
        category: _selectedCategory,
        documentName: widget.fileName,
      );
      widget.onSuccess();
    } catch (e) {
      widget.onError('Erro ao enviar documento');
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Upload de Documento'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Selecione a categoria:'),
          const SizedBox(height: 12),
          DropdownButton<String>(
            isExpanded: true,
            value: _selectedCategory,
            items: ['contratos', 'comprovantes', 'fotos', 'outros']
                .map((category) => DropdownMenuItem(
                      value: category,
                      child: Text(_getCategoryLabel(category)),
                    ))
                .toList(),
            onChanged: (value) {
              if (value != null) {
                setState(() => _selectedCategory = value);
              }
            },
          ),
        ],
      ),
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
              : const Text('Upload'),
        ),
      ],
    );
  }

  String _getCategoryLabel(String category) {
    return switch (category) {
      'contratos' => 'Contratos',
      'comprovantes' => 'Comprovantes',
      'fotos' => 'Fotos',
      'outros' => 'Outros',
      _ => category,
    };
  }
}
