import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' show LatLng;

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// The OpenStreetMap street map, as tiles from the OpenStreetMap Foundation.
///
/// Free and without a key, under their tile usage policy: the app names
/// itself in every request and credits OpenStreetMap on the map
/// ([MapAttribution]). Tiles that were seen are cached on the phone, so
/// places already viewed still show without signal.
TileLayer osmTileLayer() => TileLayer(
  urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  userAgentPackageName: 'com.johnivansantoss.capartner',
  maxNativeZoom: 19,
);

/// The credit OpenStreetMap's licence asks for wherever its map is shown.
class MapAttribution extends StatelessWidget {
  const MapAttribution({super.key});

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: AppColors.white.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        child: Text(
          '© OpenStreetMap contributors',
          style: appTextStyle(
            fontSize: 10,
            lineHeight: 14,
            weight: FontWeight.w600,
            color: AppColors.bodyText,
          ),
        ),
      ),
    );
  }
}

/// Map pins drawn in the app's colours.
abstract final class MapMarkers {
  static const double meSize = 44;
  static const Size teammateSize = Size(38, 48);

  /// The user's own position, centred on the point: a green dot in a white
  /// ring with a soft halo.
  static Marker me(LatLng point, {Key? key}) => Marker(
    key: key,
    point: point,
    width: meSize,
    height: meSize,
    child: const _MeDot(),
  );

  /// A teammate's cap, with the pin's tip on the point.
  static Marker teammate(LatLng point, {VoidCallback? onTap}) => Marker(
    point: point,
    width: teammateSize.width,
    height: teammateSize.height,
    alignment: Alignment.topCenter,
    child: GestureDetector(
      onTap: onTap,
      child: const CustomPaint(painter: _TeammatePinPainter()),
    ),
  );

  /// A label above a pin, standing in for an info window. [pinHeight] is
  /// how far above the point the pin reaches.
  static Marker label(
    LatLng point, {
    required String title,
    required String subtitle,
    required double pinHeight,
  }) => Marker(
    point: point,
    width: 220,
    height: 56 + pinHeight,
    alignment: Alignment.topCenter,
    child: Padding(
      padding: EdgeInsets.only(bottom: pinHeight),
      child: _Label(title: title, subtitle: subtitle),
    ),
  );
}

class _MeDot extends StatelessWidget {
  const _MeDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.green.withValues(alpha: 0.18),
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: Container(
        width: 22,
        height: 22,
        decoration: BoxDecoration(
          color: AppColors.green,
          shape: BoxShape.circle,
          border: Border.all(color: AppColors.white, width: 3),
        ),
      ),
    );
  }
}

/// A dark green pin with a badge in it.
class _TeammatePinPainter extends CustomPainter {
  const _TeammatePinPainter();

  static const double _radius = 16;

  @override
  void paint(Canvas canvas, Size size) {
    final centre = Offset(size.width / 2, _radius + 3);
    final pin = Path.combine(
      PathOperation.union,
      Path()..addOval(Rect.fromCircle(center: centre, radius: _radius)),
      Path()
        ..moveTo(centre.dx - 9, centre.dy + 11)
        ..lineTo(centre.dx, size.height - 3)
        ..lineTo(centre.dx + 9, centre.dy + 11)
        ..close(),
    );
    canvas
      ..drawShadow(pin, const Color(0xFF000000), 2, false)
      ..drawPath(pin, Paint()..color = AppColors.darkGreen)
      ..drawPath(
        pin,
        Paint()
          ..color = AppColors.white
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5,
      );

    const icon = Icons.badge_rounded;
    final painter = TextPainter(
      textDirection: TextDirection.ltr,
      text: TextSpan(
        text: String.fromCharCode(icon.codePoint),
        style: TextStyle(
          fontFamily: icon.fontFamily,
          package: icon.fontPackage,
          fontSize: 17,
          color: AppColors.white,
        ),
      ),
    )..layout();
    painter.paint(
      canvas,
      centre - Offset(painter.width / 2, painter.height / 2),
    );
    painter.dispose();
  }

  @override
  bool shouldRepaint(_TeammatePinPainter oldDelegate) => false;
}

class _Label extends StatelessWidget {
  const _Label({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.bottomCenter,
      child: Container(
        padding: const EdgeInsets.fromLTRB(10, 6, 10, 6),
        decoration: BoxDecoration(
          color: AppColors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: const [
            BoxShadow(
              color: Color(0x29000000),
              offset: Offset(0, 2),
              blurRadius: 8,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: appTextStyle(
                fontSize: 12,
                lineHeight: 16,
                weight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: appTextStyle(
                fontSize: 11,
                lineHeight: 15,
                weight: FontWeight.w500,
                color: AppColors.bodyText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Straight-line distance between two points, as "450 m" or "1.2 km".
String distanceLabel(LatLng from, LatLng to) {
  const earthRadius = 6371000.0;
  double rad(double degrees) => degrees * math.pi / 180;
  final dLat = rad(to.latitude - from.latitude);
  final dLng = rad(to.longitude - from.longitude);
  final a =
      math.pow(math.sin(dLat / 2), 2) +
      math.cos(rad(from.latitude)) *
          math.cos(rad(to.latitude)) *
          math.pow(math.sin(dLng / 2), 2);
  final metres = 2 * earthRadius * math.asin(math.sqrt(a));
  return metres < 1000
      ? '${(metres / 10).round() * 10} m'
      : '${(metres / 1000).toStringAsFixed(1)} km';
}
