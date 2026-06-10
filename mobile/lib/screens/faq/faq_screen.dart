import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dream_abroad/models/faq.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';

class FaqScreen extends StatefulWidget {
  const FaqScreen({Key? key}) : super(key: key);

  @override
  State<FaqScreen> createState() => _FaqScreenState();
}

class _FaqScreenState extends State<FaqScreen> {
  late ClientService _clientService;
  List<FaqItem> _allFaqs = [];
  List<FaqItem> _filteredFaqs = [];
  bool _isLoading = false;
  bool _hasError = false;
  String? _errorMessage;
  final TextEditingController _searchController = TextEditingController();
  Map<String, bool> _expandedCategories = {};

  @override
  void initState() {
    super.initState();
    _clientService = ClientService();
    _searchController.addListener(_filterFaqs);
    _loadFaqs();
  }

  Future<void> _loadFaqs() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });

    try {
      final faqs = await _clientService.getFaq();
      setState(() {
        _allFaqs = faqs;
        _filteredFaqs = faqs;
        _isLoading = false;
        _initializeCategories();
      });
    } catch (e) {
      setState(() {
        _hasError = true;
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  void _initializeCategories() {
    _expandedCategories.clear();
    final categories = _getCategories();
    for (var category in categories) {
      _expandedCategories[category] = false;
    }
  }

  List<String> _getCategories() {
    final categories = <String>{};
    for (var faq in _filteredFaqs) {
      if (faq.category != null && faq.category!.isNotEmpty) {
        categories.add(faq.category!);
      }
    }
    return categories.toList()..sort();
  }

  void _filterFaqs() {
    final query = _searchController.text.toLowerCase();

    setState(() {
      if (query.isEmpty) {
        _filteredFaqs = _allFaqs;
      } else {
        _filteredFaqs = _allFaqs.where((faq) {
          return faq.question.toLowerCase().contains(query) ||
              faq.answer.toLowerCase().contains(query) ||
              (faq.category != null &&
                  faq.category!.toLowerCase().contains(query));
        }).toList();
      }
      _initializeCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Perguntas Frequentes',
          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppTheme.primaryColor,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _loadFaqs,
        color: AppTheme.primaryColor,
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: CircularProgressIndicator(color: AppTheme.primaryColor),
      );
    }

    if (_hasError) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Erro ao carregar FAQ',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _errorMessage ?? 'Tente novamente',
              style: GoogleFonts.inter(),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loadFaqs,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
              ),
              child: Text(
                'Tentar Novamente',
                style: GoogleFonts.inter(color: Colors.white),
              ),
            ),
          ],
        ),
      );
    }

    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildSearchBar(),
            const SizedBox(height: 20),
            _filteredFaqs.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 48),
                      child: Column(
                        children: [
                          Icon(
                            Icons.search_off,
                            size: 64,
                            color: Colors.grey,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Nenhuma pergunta encontrada',
                            style: GoogleFonts.inter(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  )
                : _buildFaqList(),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return TextField(
      controller: _searchController,
      decoration: InputDecoration(
        hintText: 'Pesquisar perguntas...',
        hintStyle: GoogleFonts.inter(color: Colors.grey),
        prefixIcon: Icon(Icons.search, color: AppTheme.primaryColor),
        suffixIcon: _searchController.text.isNotEmpty
            ? GestureDetector(
                onTap: () => _searchController.clear(),
                child: Icon(Icons.clear, color: Colors.grey),
              )
            : null,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primaryColor.withOpacity(0.3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primaryColor.withOpacity(0.3)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primaryColor),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      style: GoogleFonts.inter(),
    );
  }

  Widget _buildFaqList() {
    final categories = _getCategories();

    if (categories.isEmpty) {
      return ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _filteredFaqs.length,
        itemBuilder: (context, index) {
          return _buildFaqTile(_filteredFaqs[index]);
        },
      );
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: categories.length,
      itemBuilder: (context, categoryIndex) {
        final category = categories[categoryIndex];
        final categoryFaqs = _filteredFaqs
            .where((faq) => faq.category == category)
            .toList();

        return Column(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      category,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                  Text(
                    '${categoryFaqs.length}',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: categoryFaqs.length,
              itemBuilder: (context, itemIndex) {
                return _buildFaqTile(categoryFaqs[itemIndex]);
              },
            ),
            const SizedBox(height: 12),
          ],
        );
      },
    );
  }

  Widget _buildFaqTile(FaqItem faq) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: ExpansionTile(
        title: Text(
          faq.question,
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.w600,
            fontSize: 14,
          ),
        ),
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        collapsedIconColor: AppTheme.primaryColor,
        iconColor: AppTheme.primaryColor,
        children: [
          Padding(
            padding: const EdgeInsets.only(
              left: 16,
              right: 16,
              bottom: 16,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 1,
                  color: AppTheme.primaryColor.withOpacity(0.2),
                  margin: const EdgeInsets.only(bottom: 12),
                ),
                Text(
                  faq.answer,
                  style: GoogleFonts.inter(
                    height: 1.6,
                    color: Colors.black87,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
