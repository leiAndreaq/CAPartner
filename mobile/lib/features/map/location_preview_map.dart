import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' show LatLng;

import 'package:capartner/features/map/map_visuals.dart';

/// Small map of the user's position, for the dashboard's location card.
///
/// It can't be moved, so it never fights the dashboard's scrolling. Taps pass
/// through to the card around it, which opens the full map.
class LocationPreviewMap extends StatelessWidget {
  const LocationPreviewMap({
    super.key,
    required this.position,
    required this.width,
    required this.height,
  });

  final LatLng position;
  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: width,
      height: height,
      child: IgnorePointer(
        child: FlutterMap(
          // A new map when the position moves, centred on it again.
          key: ValueKey(position),
          options: MapOptions(
            initialCenter: position,
            initialZoom: 15,
            interactionOptions: const InteractionOptions(
              flags: InteractiveFlag.none,
            ),
          ),
          children: [
            osmTileLayer(),
            MarkerLayer(markers: [MapMarkers.me(position)]),
          ],
        ),
      ),
    );
  }
}
