import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:dream_abroad/models/property_detail.dart';
import 'package:dream_abroad/services/client_service.dart';
import 'package:dream_abroad/utils/theme.dart';

class PropertyScreen extends StatefulWidget {
  const PropertyScreen({Key? key}) : super(key: key);

  @override
  State<PropertyScreen> createState() => _PropertyScreenState();
}

class _PropertyScreenState extends State<PropertyScreen> {
  late ClientService _clientService;
  late Future<PropertyDetail> _propertyFuture;
  final Set<int> _expandedRooms = {};

  @override
  void initState() {
    super.initState();
    _clientService = ClientService();
    _propertyFuture = _clientService.getProperty();
  }

  Future<void> _refresh() async {
    setState(() {
      _propertyFuture = _clientService.getProperty();
    });
  }

  void _toggleRoomExpanded(int roomId) {
    setState(() {
      if (_expandedRooms.contains(roomId)) {
        _expandedRooms.remove(roomId);
      } else {
        _expandedRooms.add(roomId);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Propriedade'),
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        color: AppTheme.primaryColor,
        child: FutureBuilder<PropertyDetail>(
          future: _propertyFuture,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const _LoadingPropertyState();
            }

            if (snapshot.hasError) {
              return _ErrorPropertyState(
                error: snapshot.error.toString(),
                onRetry: _refresh,
              );
            }

            final property = snapshot.data;
            if (property == null) {
              return const Center(child: Text('Propriedade não encontrada'));
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _PropertyHeroSection(property: property),
                  const SizedBox(height: 20),
                  _PropertyInfoSection(property: property),
                  const SizedBox(height: 20),
                  _OccupancyCard(property: property),
                  const SizedBox(height: 20),
                  _RoomsSection(
                    property: property,
                    expandedRooms: _expandedRooms,
                    onToggleRoom: _toggleRoomExpanded,
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Navegando para reportar problema...'),
                          ),
                        );
                      },
                      icon: const Icon(Icons.error_outline),
                      label: const Text('Reportar Problema'),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        backgroundColor: AppTheme.primaryColor,
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  _MapPlaceholder(),
                  const SizedBox(height: 20),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

class _PropertyHeroSection extends StatelessWidget {
  final PropertyDetail property;

  const _PropertyHeroSection({required this.property});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        height: 240,
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Stack(
          children: [
            Center(
              child: Icon(
                Icons.apartment_outlined,
                size: 100,
                color: AppTheme.primaryColor,
              ),
            ),
            Positioned(
              top: 16,
              right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.successColor,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  property.status.toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PropertyInfoSection extends StatelessWidget {
  final PropertyDetail property;

  const _PropertyInfoSection({required this.property});

  String _getTypeLabel() {
    final type = property.type?.toLowerCase() ?? '';
    if (type.contains('apartment') || type.contains('apartamento')) {
      return 'Apartamento';
    } else if (type.contains('house') || type.contains('casa')) {
      return 'Casa';
    } else if (type.contains('studio')) {
      return 'Studio';
    } else if (type.contains('room') || type.contains('quarto')) {
      return 'Quarto';
    }
    return property.type ?? 'Imóvel';
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        property.name,
                        style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        property.code,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
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
                    color: AppTheme.primaryColor.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    _getTypeLabel(),
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primaryColor,
                    ),
                  ),
                ),
              ],
            ),
            if (property.address != null && property.address!.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 18,
                    color: AppTheme.greyMedium,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      property.address!,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _OccupancyCard extends StatelessWidget {
  final PropertyDetail property;

  const _OccupancyCard({required this.property});

  @override
  Widget build(BuildContext context) {
    final occupancyPercent = property.occupancyPercentage;

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
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Ocupação',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${property.occupiedBeds}/${property.totalBeds} camas ocupadas',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: AppTheme.accentColor,
                      width: 4,
                    ),
                  ),
                  child: Center(
                    child: Text(
                      '${occupancyPercent.toStringAsFixed(0)}%',
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.w700,
                        color: AppTheme.accentColor,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: occupancyPercent / 100,
                minHeight: 8,
                backgroundColor: AppTheme.greyLighter,
                valueColor: AlwaysStoppedAnimation<Color>(
                  occupancyPercent < 50
                      ? AppTheme.successColor
                      : occupancyPercent < 80
                          ? AppTheme.warningColor
                          : AppTheme.errorColor,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _RoomsSection extends StatelessWidget {
  final PropertyDetail property;
  final Set<int> expandedRooms;
  final Function(int) onToggleRoom;

  const _RoomsSection({
    required this.property,
    required this.expandedRooms,
    required this.onToggleRoom,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Quartos',
          style: GoogleFonts.poppins(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 12),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: property.rooms.length,
          itemBuilder: (context, index) {
            final room = property.rooms[index];
            final isExpanded = expandedRooms.contains(room.id);

            return _RoomCard(
              room: room,
              isExpanded: isExpanded,
              onToggle: () => onToggleRoom(room.id),
            );
          },
        ),
      ],
    );
  }
}

class _RoomCard extends StatelessWidget {
  final RoomDetail room;
  final bool isExpanded;
  final VoidCallback onToggle;

  const _RoomCard({
    required this.room,
    required this.isExpanded,
    required this.onToggle,
  });

  IconData _getRoomIcon() {
    final type = room.roomType?.toLowerCase() ?? '';
    if (type.contains('single')) return Icons.hotel_class_outlined;
    if (type.contains('double') || type.contains('duplo'))
      return Icons.hotel_outlined;
    if (type.contains('suite')) return Icons.domain_outlined;
    return Icons.door_front_door_outlined;
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      color: AppTheme.surfaceColor,
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          GestureDetector(
            onTap: onToggle,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      _getRoomIcon(),
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
                          room.name,
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${room.occupiedBeds}/${room.beds.length} camas ocupadas',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    isExpanded
                        ? Icons.keyboard_arrow_up_outlined
                        : Icons.keyboard_arrow_down_outlined,
                    color: AppTheme.greyMedium,
                  ),
                ],
              ),
            ),
          ),
          if (isExpanded) ...[
            Divider(
              color: AppTheme.greyLighter,
              height: 1,
              thickness: 1,
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Camas',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: room.beds.length,
                    itemBuilder: (context, bedIndex) {
                      final bed = room.beds[bedIndex];
                      return _BedItem(bed: bed);
                    },
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _BedItem extends StatelessWidget {
  final BedDetail bed;

  const _BedItem({required this.bed});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: bed.isOccupied
              ? AppTheme.errorColor.withOpacity(0.08)
              : AppTheme.successColor.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: bed.isOccupied
                ? AppTheme.errorColor.withOpacity(0.3)
                : AppTheme.successColor.withOpacity(0.3),
          ),
        ),
        child: Row(
          children: [
            Icon(
              bed.isOccupied ? Icons.person : Icons.person_outline,
              size: 20,
              color: bed.isOccupied ? AppTheme.errorColor : AppTheme.successColor,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    bed.name,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  if (bed.isOccupied)
                    Text(
                      bed.occupantName ?? 'Ocupado',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    )
                  else
                    Text(
                      'Disponível',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.successColor,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                ],
              ),
            ),
            if (bed.monthlyValue != null)
              Text(
                '\$${bed.monthlyValue!.toStringAsFixed(2)}',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.accentColor,
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _MapPlaceholder extends StatelessWidget {
  const _MapPlaceholder();

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        height: 200,
        decoration: BoxDecoration(
          color: AppTheme.primaryColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.map_outlined,
              size: 60,
              color: AppTheme.primaryColor,
            ),
            const SizedBox(height: 12),
            Text(
              'Localização no mapa',
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Toque para visualizar localização',
              style: GoogleFonts.inter(
                fontSize: 12,
                color: AppTheme.textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LoadingPropertyState extends StatelessWidget {
  const _LoadingPropertyState();

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
            'Carregando propriedade...',
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

class _ErrorPropertyState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorPropertyState({
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
            'Erro ao carregar propriedade',
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
