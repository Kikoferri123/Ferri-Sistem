import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dream_abroad/models/client_profile.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';

class EditProfileScreen extends StatefulWidget {
  final ClientProfile profile;
  final VoidCallback onSaved;

  const EditProfileScreen({
    Key? key,
    required this.profile,
    required this.onSaved,
  }) : super(key: key);

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late ClientService _clientService;
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _nationalityController;
  late TextEditingController _emergencyContactController;

  String _selectedNationality = '';
  bool _isSaving = false;

  final List<String> _nationalities = [
    'Afganistão',
    'Alemanha',
    'Angola',
    'Argentina',
    'Brasil',
    'Canadá',
    'China',
    'Colômbia',
    'Coreia do Sul',
    'Dinamarca',
    'Egito',
    'Emirados Árabes Unidos',
    'Espanha',
    'Estados Unidos',
    'Filipinas',
    'França',
    'Grécia',
    'Holanda',
    'Hong Kong',
    'Hungria',
    'Índia',
    'Indonésia',
    'Irã',
    'Irlanda',
    'Israel',
    'Itália',
    'Japão',
    'Jordânia',
    'Líbano',
    'México',
    'Moçambique',
    'Nigéria',
    'Noruega',
    'Nova Zelândia',
    'Paquistão',
    'Paraguai',
    'Peru',
    'Polônia',
    'Portugal',
    'Reino Unido',
    'República Checa',
    'Romênia',
    'Rússia',
    'Senegal',
    'Sérvia',
    'Singapura',
    'Síria',
    'Suécia',
    'Suíça',
    'Tailândia',
    'Taiwan',
    'Tanzânia',
    'Turquia',
    'Ucrânia',
    'Vietnã',
  ];

  @override
  void initState() {
    super.initState();
    _clientService = ClientService();
    _nameController = TextEditingController(text: widget.profile.name);
    _emailController = TextEditingController(text: widget.profile.email ?? '');
    _phoneController = TextEditingController(text: widget.profile.phone ?? '');
    _nationalityController =
        TextEditingController(text: widget.profile.nationality ?? '');
    _emergencyContactController = TextEditingController();

    _selectedNationality = widget.profile.nationality ?? '';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _nationalityController.dispose();
    _emergencyContactController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (_phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Por favor, preencha o telefone')),
      );
      return;
    }

    setState(() {
      _isSaving = true;
    });

    try {
      await _clientService.updateProfile({
        'phone': _phoneController.text,
        'nationality': _selectedNationality,
      });

      if (mounted) {
        setState(() {
          _isSaving = false;
        });
        widget.onSaved();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Perfil atualizado com sucesso!'),
            backgroundColor: AppTheme.successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao atualizar perfil: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Editar Perfil'),
        elevation: 0,
        actions: [
          if (!_isSaving)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 16),
                child: TextButton(
                  onPressed: _handleSave,
                  child: Text(
                    'Salvar',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _AvatarSection(name: widget.profile.name),
            const SizedBox(height: 32),
            _EditableField(
              label: 'Nome',
              controller: _nameController,
              icon: Icons.person_outlined,
              readOnly: true,
              hint: 'Nome não pode ser alterado',
            ),
            const SizedBox(height: 16),
            _EditableField(
              label: 'Email',
              controller: _emailController,
              icon: Icons.email_outlined,
              readOnly: true,
              hint: 'Email não pode ser alterado',
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            _EditableField(
              label: 'Telefone',
              controller: _phoneController,
              icon: Icons.phone_outlined,
              hint: 'Digite seu telefone',
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 16),
            Text(
              'Nacionalidade',
              style: GoogleFonts.poppins(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            DropdownButtonFormField<String>(
              value: _selectedNationality.isEmpty ? null : _selectedNationality,
              items: _nationalities
                  .map((nationality) => DropdownMenuItem(
                        value: nationality,
                        child: Text(nationality),
                      ))
                  .toList(),
              onChanged: (value) {
                setState(() {
                  _selectedNationality = value ?? '';
                });
              },
              decoration: InputDecoration(
                prefixIcon: const Icon(Icons.public_outlined),
                hintText: 'Selecione sua nacionalidade',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppTheme.greyLight),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:
                      const BorderSide(color: AppTheme.primaryColor, width: 2),
                ),
                filled: true,
                fillColor: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            _EditableField(
              label: 'Contato de Emergência',
              controller: _emergencyContactController,
              icon: Icons.emergency_outlined,
              hint: 'Nome e telefone do contato',
            ),
            const SizedBox(height: 32),
            if (_isSaving)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: null,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: AppTheme.primaryColor,
                    disabledBackgroundColor: AppTheme.greyLight,
                  ),
                  child: const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      strokeWidth: 2,
                    ),
                  ),
                ),
              )
            else
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _handleSave,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: AppTheme.primaryColor,
                  ),
                  child: const Text('Salvar Alterações'),
                ),
              ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AvatarSection extends StatelessWidget {
  final String name;

  const _AvatarSection({required this.name});

  String _getInitials() {
    final names = name.split(' ');
    if (names.isEmpty) return 'U';
    if (names.length == 1) return names[0][0].toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Stack(
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
          Positioned(
            bottom: 0,
            right: 0,
            child: Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppTheme.accentColor,
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 3),
              ),
              child: Icon(
                Icons.camera_alt_outlined,
                size: 18,
                color: Colors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _EditableField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final IconData icon;
  final String hint;
  final TextInputType keyboardType;
  final bool readOnly;

  const _EditableField({
    required this.label,
    required this.controller,
    required this.icon,
    required this.hint,
    this.keyboardType = TextInputType.text,
    this.readOnly = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          readOnly: readOnly,
          keyboardType: keyboardType,
          style: GoogleFonts.inter(
            fontSize: 14,
            color: readOnly ? AppTheme.textSecondary : AppTheme.textPrimary,
          ),
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(
              icon,
              color: readOnly ? AppTheme.greyMedium : AppTheme.primaryColor,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.greyLight),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide:
                  const BorderSide(color: AppTheme.primaryColor, width: 2),
            ),
            disabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: AppTheme.greyLighter),
            ),
            filled: true,
            fillColor: readOnly ? AppTheme.greyLightest : Colors.white,
          ),
        ),
      ],
    );
  }
}
