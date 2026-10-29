import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart' show LatLng;

/// Where the phone is, and the street it is on.
class LocationFix {
  const LocationFix({required this.position, this.address});

  final LatLng position;

  /// e.g. "Camarin Road, Caloocan"; null until it is looked up, or when the
  /// phone could not name the place.
  final String? address;
}

/// Why there is no [LocationFix].
enum LocationProblem {
  /// Location is switched off in the phone's settings.
  serviceOff,

  /// The user did not allow the app to use location.
  denied,

  /// The user refused for good; only the app's settings can change it.
  deniedForever,
}

/// The phone's own GPS, followed while [start]ed. The enforcer carries the
/// phone, so it stands in for the cap's position until the cap sends GPS.
class LiveLocation {
  /// Moves smaller than this, in metres, are not reported.
  static const int distanceFilter = 10;

  /// The street name is looked up again once the phone has moved this far.
  static const double addressRefreshMetres = 50;

  final ValueNotifier<LocationFix?> fix = ValueNotifier(null);
  final ValueNotifier<LocationProblem?> problem = ValueNotifier(null);

  StreamSubscription<Position>? _subscription;
  LatLng? _addressedAt;
  String? _address;

  /// Asks for permission when needed and starts following the phone. Calling
  /// it again, e.g. after the user switched location on, tries once more.
  Future<void> start() async {
    if (_subscription != null) return;
    if (!await Geolocator.isLocationServiceEnabled()) {
      problem.value = LocationProblem.serviceOff;
      return;
    }
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) {
      problem.value = LocationProblem.deniedForever;
      return;
    }
    if (permission == LocationPermission.denied ||
        permission == LocationPermission.unableToDetermine) {
      problem.value = LocationProblem.denied;
      return;
    }
    problem.value = null;

    // Shows something right away while the GPS gets a precise fix.
    final last = await Geolocator.getLastKnownPosition();
    if (last != null && fix.value == null) _update(last);

    _subscription =
        Geolocator.getPositionStream(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            distanceFilter: distanceFilter,
          ),
        ).listen(
          _update,
          onError: (Object _) {
            // Location switched off while following: wait for the next start.
            _subscription?.cancel();
            _subscription = null;
            problem.value = LocationProblem.serviceOff;
          },
        );
  }

  void _update(Position position) {
    final point = LatLng(position.latitude, position.longitude);
    fix.value = LocationFix(position: point, address: _address);

    final addressedAt = _addressedAt;
    if (addressedAt == null ||
        Geolocator.distanceBetween(
              addressedAt.latitude,
              addressedAt.longitude,
              point.latitude,
              point.longitude,
            ) >=
            addressRefreshMetres) {
      _addressedAt = point;
      unawaited(_lookUpAddress(point));
    }
  }

  Future<void> _lookUpAddress(LatLng point) async {
    try {
      final places = await Geocoding().placemarkFromCoordinates(
        point.latitude,
        point.longitude,
      );
      if (places.isEmpty) return;
      final place = places.first;
      final parts = [
        place.thoroughfare?.isNotEmpty == true
            ? place.thoroughfare
            : place.name,
        place.locality?.isNotEmpty == true
            ? place.locality
            : place.subAdministrativeArea,
      ].whereType<String>().where((part) => part.isNotEmpty).toSet();
      if (parts.isEmpty) return;
      _address = parts.join(', ');
      final current = fix.value;
      if (current != null) {
        fix.value = LocationFix(position: current.position, address: _address);
      }
    } catch (_) {
      // No network or no geocoder: the map still shows the position.
      _addressedAt = null;
    }
  }

  /// Helps the user fix [problem]: asks for permission again, or opens the
  /// phone's settings where only they can change it.
  Future<void> fixProblem() async {
    switch (problem.value) {
      case LocationProblem.serviceOff:
        await Geolocator.openLocationSettings();
      case LocationProblem.deniedForever:
        await Geolocator.openAppSettings();
      case LocationProblem.denied || null:
        await start();
    }
  }

  Future<void> stop() async {
    await _subscription?.cancel();
    _subscription = null;
  }
}
