import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:latlong2/latlong.dart';

import 'package:capartner/features/home/home_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Someone shown on the map and in the status list.
class _Enforcer {
  const _Enforcer({
    required this.name,
    required this.address,
    required this.capId,
    required this.location,
  });

  final String name;
  final String address;
  final String capId;

  /// Where the pin sits on the map.
  final LatLng location;
}

/// Map tab (Figma node 546:611).
///
/// The map is a live OpenStreetMap that can be dragged and zoomed. The
/// positions are fixed sample values until the caps report real locations.
class MapTab extends StatefulWidget {
  const MapTab({
    super.key,
    required this.statusBar,
    required this.capId,
    required this.bottomPadding,
  });

  /// Connection status pill, floating over the top of the map.
  final Widget statusBar;

  /// ID line of the user's own cap.
  final String capId;

  /// Room taken by the tab bar at the bottom of the screen.
  final double bottomPadding;

  @override
  State<MapTab> createState() => _MapTabState();
}

class _MapTabState extends State<MapTab> {
  // Sizes below are taken from the 390x844 Figma frame.
  static const double _sheetContentHeight = 277;
  static const double _sheetRadius = 50;
  static const double _initialZoom = 16;

  final MapController _mapController = MapController();

  List<_Enforcer> get _enforcers => [
    _Enforcer(
      name: 'Me',
      address: 'Vicas Market, Camarin Road',
      capId: widget.capId,
      location: const LatLng(14.7534, 121.0437),
    ),
    const _Enforcer(
      name: 'Enforcer 01',
      address: 'Almar Zabarte, Camarin Road',
      capId: 'CAP 002 - PSTMD-2026-085',
      location: LatLng(14.7572, 121.0491),
    ),
    const _Enforcer(
      name: 'Enforcer 02',
      address: 'Zapote, Camarin Road',
      capId: 'CAP 003 - PSTMD-2026-086',
      location: LatLng(14.7556, 121.0448),
    ),
  ];

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  void _showOnMap(_Enforcer enforcer) {
    _mapController.move(
      enforcer.location,
      _mapController.camera.zoom < _initialZoom
          ? _initialZoom
          : _mapController.camera.zoom,
    );
  }

  @override
  Widget build(BuildContext context) {
    final enforcers = _enforcers;
    final sheetHeight = _sheetContentHeight + widget.bottomPadding;

    return Stack(
      children: [
        // The map runs on under the sheet's rounded corners.
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          bottom: sheetHeight - _sheetRadius,
          child: _buildMap(enforcers),
        ),
        Positioned(left: 0, right: 0, top: 10, child: widget.statusBar),
        // OpenStreetMap requires credit wherever its tiles are shown.
        Positioned(
          right: 12,
          bottom: sheetHeight + 4,
          child: Text(
            '© OpenStreetMap contributors',
            style: appTextStyle(
              fontSize: 9,
              lineHeight: 12,
              weight: FontWeight.w400,
              color: const Color(0xFF555555),
            ),
          ),
        ),
        Positioned(
          right: 16,
          bottom: sheetHeight + 22,
          child: FloatingActionButton.small(
            heroTag: null,
            backgroundColor: AppColors.white,
            foregroundColor: AppColors.darkGreen,
            tooltip: 'Show my location',
            onPressed: () => _showOnMap(enforcers.first),
            child: const Icon(Icons.my_location),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: sheetHeight,
          child: _buildSheet(enforcers),
        ),
      ],
    );
  }

  Widget _buildMap(List<_Enforcer> enforcers) {
    return FlutterMap(
      mapController: _mapController,
      options: MapOptions(
        initialCenter: enforcers.first.location,
        initialZoom: _initialZoom,
        minZoom: 3,
        maxZoom: 19,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
        ),
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.johnivansantoss.capartner',
        ),
        MarkerLayer(
          markers: [
            for (final enforcer in enforcers)
              Marker(
                point: enforcer.location,
                width: 100,
                height: 40,
                // Puts the centre of the 20px circle on the point, with the
                // name hanging below it.
                alignment: const Alignment(0, 0.5),
                child: Column(
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: const Color(0xFFEDF2EA),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF1E8E52),
                          width: 1.6,
                        ),
                      ),
                      child: SvgPicture.asset(
                        'assets/icons/map_pin.svg',
                        width: 12,
                        height: 12,
                      ),
                    ),
                    Text(
                      enforcer.name,
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      style: appTextStyle(
                        fontSize: 11,
                        lineHeight: 16.5,
                        weight: FontWeight.w700,
                        color: const Color(0xFF000000),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ],
    );
  }

  Widget _buildSheet(List<_Enforcer> enforcers) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(_sheetRadius)),
        boxShadow: [
          BoxShadow(
            color: Color(0x80000000),
            offset: Offset(0, 4),
            blurRadius: 30,
          ),
        ],
      ),
      child: Column(
        children: [
          const SizedBox(height: 15),
          Container(
            width: 62,
            height: 9,
            decoration: BoxDecoration(
              color: const Color(0xFFE7E7E7),
              borderRadius: BorderRadius.circular(50),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(left: 46, right: 52),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                for (final label in const ['STATUS', 'Refresh'])
                  Text(
                    label,
                    style: appTextStyle(
                      fontSize: 11,
                      lineHeight: 16.5,
                      weight: FontWeight.w700,
                      color: AppColors.darkGreen,
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 4),
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.fromLTRB(
                24,
                3,
                19,
                widget.bottomPadding + 12,
              ),
              itemCount: enforcers.length,
              separatorBuilder: (_, _) => const SizedBox(height: 7),
              itemBuilder: (_, index) => GestureDetector(
                onTap: () => _showOnMap(enforcers[index]),
                child: _buildStatusCard(enforcers[index]),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(_Enforcer enforcer) {
    return Container(
      height: 60,
      padding: const EdgeInsets.only(left: 23, right: 21),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x26000000),
            offset: Offset(1, 4),
            blurRadius: 4,
            spreadRadius: 3,
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  enforcer.name,
                  maxLines: 1,
                  style: appTextStyle(
                    fontSize: 10,
                    lineHeight: 15,
                    weight: FontWeight.w900,
                    color: const Color(0xFF898989),
                  ),
                ),
                Text(
                  enforcer.address,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: appTextStyle(
                    fontSize: 11,
                    lineHeight: 16,
                    weight: FontWeight.w700,
                    color: const Color(0xFF000000),
                  ),
                ),
                Text(
                  enforcer.capId,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: appTextStyle(
                    fontSize: 8,
                    lineHeight: 15,
                    weight: FontWeight.w400,
                    color: AppColors.darkGreen,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          const StatusChip.connected(),
        ],
      ),
    );
  }
}
