import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' show LatLng;

import 'package:capartner/features/home/home_widgets.dart';
import 'package:capartner/features/map/live_location.dart';
import 'package:capartner/features/map/map_visuals.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Someone shown on the map and in the team list.
class _Enforcer {
  const _Enforcer({
    required this.name,
    required this.address,
    required this.capId,
    required this.location,
    this.isMe = false,
  });

  final String name;
  final String address;
  final String capId;

  /// Where the pin sits on the map.
  final LatLng location;

  /// Whether this is the user's own cap.
  final bool isMe;
}

/// Map tab (Figma node 546:611).
///
/// A live OpenStreetMap of the user, with map controls on the right and their
/// status in a sheet below. The user's own position is live from the phone's
/// GPS; teammates will show once the backend shares their caps' locations.
class MapTab extends StatefulWidget {
  const MapTab({
    super.key,
    required this.statusBar,
    required this.capId,
    required this.position,
    required this.location,
    required this.bottomPadding,
    this.locationProblem,
    this.onFixLocation,
  });

  /// Connection status pill, floating over the top of the map.
  final Widget statusBar;

  /// ID line of the user's own cap.
  final String capId;

  /// Where the user is, and its address.
  /// The user's position; null until the phone has a fix.
  final LatLng? position;
  final String location;

  /// Why the user's position is not live, if it isn't.
  final LocationProblem? locationProblem;

  /// Helps the user fix [locationProblem].
  final VoidCallback? onFixLocation;

  /// Room taken by the tab bar at the bottom of the screen.
  final double bottomPadding;

  @override
  State<MapTab> createState() => _MapTabState();
}

class _MapTabState extends State<MapTab> with TickerProviderStateMixin {
  static const double _sheetContentHeight = 277;
  static const double _sheetRadius = 28;
  static const double _initialZoom = 16;

  /// Where the map looks, zoomed out, until the phone has a fix.
  static const LatLng _noFixCenter = LatLng(12.8797, 121.774);
  static const double _noFixZoom = 5;
  static const double _minZoom = 3;
  static const double _maxZoom = 19;

  /// How close the recenter button brings the camera to the user.
  static const double _focusZoom = 18.5;

  final MapController _map = MapController();

  /// Completes once the map can be moved.
  final Completer<void> _mapReady = Completer();

  /// The rings that ripple out from the user once the camera lands on them.
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  String? _selectedCapId;
  TimeOfDay _updatedAt = TimeOfDay.now();

  /// Bumped on every recenter, so an older one stops when a newer one starts.
  int _recenterRun = 0;

  List<_Enforcer> get _enforcers => [
    _Enforcer(
      name: 'Me',
      address: widget.location,
      capId: widget.capId,
      location: widget.position ?? _noFixCenter,
      isMe: true,
    ),
  ];

  /// Whether the camera has been brought to the user's live position yet.
  bool _movedToLivePosition = false;

  @override
  void didUpdateWidget(MapTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    // The first fix arrives after the map opened on the sample position.
    if (!_movedToLivePosition && widget.position != oldWidget.position) {
      _movedToLivePosition = true;
      final position = widget.position;
      if (position != null) _animateTo(position, _initialZoom);
    }
  }

  /// The camera move in progress, stopped when another one starts.
  AnimationController? _move;

  @override
  void dispose() {
    _move?.dispose();
    _pulse.dispose();
    _map.dispose();
    super.dispose();
  }

  /// Glides the camera to [target] at [zoom], finishing after [duration].
  Future<void> _animateTo(
    LatLng target,
    double zoom, {
    Duration duration = const Duration(milliseconds: 600),
  }) async {
    await _mapReady.future;
    if (!mounted) return;
    _move?.dispose();
    final move = _move = AnimationController(vsync: this, duration: duration);
    final camera = _map.camera;
    final curve = CurvedAnimation(parent: move, curve: Curves.easeInOutCubic);
    final latitude = Tween(begin: camera.center.latitude, end: target.latitude);
    final longitude = Tween(
      begin: camera.center.longitude,
      end: target.longitude,
    );
    final zoomTween = Tween(begin: camera.zoom, end: zoom);
    move.addListener(
      () => _map.move(
        LatLng(latitude.evaluate(curve), longitude.evaluate(curve)),
        zoomTween.evaluate(curve),
      ),
    );
    try {
      await move.forward().orCancel;
    } on TickerCanceled {
      // A newer move took over.
    }
  }

  /// Pulls back for context, then dives in on the user and ripples a ring
  /// around them, so it's clear at a glance where they are.
  Future<void> _recenter() async {
    final run = ++_recenterRun;
    if (widget.position == null) return;
    final me = _enforcers.first;
    HapticFeedback.selectionClick();
    setState(() => _selectedCapId = me.capId);

    await _animateTo(
      me.location,
      15,
      duration: const Duration(milliseconds: 450),
    );
    if (!mounted || run != _recenterRun) return;

    await _animateTo(
      me.location,
      _focusZoom,
      duration: const Duration(milliseconds: 1100),
    );
    if (!mounted || run != _recenterRun) return;

    _pulse.forward(from: 0);
  }

  Future<void> _showOnMap(_Enforcer enforcer) async {
    _recenterRun++;
    setState(() => _selectedCapId = enforcer.capId);
    await _animateTo(enforcer.location, 17);
  }

  /// Frames every cap on the map at once.
  Future<void> _showTeam() async {
    _recenterRun++;
    setState(() => _selectedCapId = null);
    await _mapReady.future;
    if (!mounted || widget.position == null) return;
    final fitted = CameraFit.bounds(
      bounds: LatLngBounds.fromPoints([for (final e in _enforcers) e.location]),
      padding: const EdgeInsets.all(72),
      maxZoom: _focusZoom,
    ).fit(_map.camera);
    await _animateTo(fitted.center, fitted.zoom);
  }

  Future<void> _zoom(double by) async {
    await _mapReady.future;
    if (!mounted) return;
    final camera = _map.camera;
    await _animateTo(
      camera.center,
      (camera.zoom + by).clamp(_minZoom, _maxZoom),
      duration: const Duration(milliseconds: 250),
    );
  }

  void _refresh() {
    setState(() => _updatedAt = TimeOfDay.now());
    _showTeam();
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
          child: Stack(
            fit: StackFit.expand,
            children: [
              _buildMap(enforcers),
              // The camera's target is the middle of the map.
              IgnorePointer(
                child: AnimatedBuilder(
                  animation: _pulse,
                  builder: (_, _) =>
                      CustomPaint(painter: _PulsePainter(_pulse.value)),
                ),
              ),
            ],
          ),
        ),
        Positioned(left: 0, right: 0, top: 10, child: widget.statusBar),
        if (widget.locationProblem case final problem?)
          Positioned(
            left: 16,
            right: 16,
            top: 58,
            child: _LocationBanner(
              problem: problem,
              onFix: widget.onFixLocation,
            ),
          ),
        Positioned(
          left: 12,
          bottom: sheetHeight + 8,
          child: const MapAttribution(),
        ),
        Positioned(
          right: 16,
          bottom: sheetHeight + 14,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _buildZoomControls(),
              const SizedBox(height: 10),
              _MapButton(
                icon: Icons.groups_rounded,
                tooltip: 'Show whole team',
                onPressed: _showTeam,
              ),
              const SizedBox(height: 10),
              _MapButton(
                icon: Icons.my_location_rounded,
                tooltip: 'Show my location',
                size: 52,
                primary: true,
                onPressed: _recenter,
              ),
            ],
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
    final selected = enforcers
        .where((e) => e.capId == _selectedCapId)
        .firstOrNull;
    return FlutterMap(
      mapController: _map,
      options: MapOptions(
        initialCenter: enforcers.first.location,
        initialZoom: widget.position == null ? _noFixZoom : _initialZoom,
        minZoom: _minZoom,
        maxZoom: _maxZoom,
        interactionOptions: const InteractionOptions(
          flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
        ),
        onMapReady: () {
          if (!_mapReady.isCompleted) _mapReady.complete();
        },
        onTap: (_, _) => setState(() => _selectedCapId = null),
      ),
      children: [
        osmTileLayer(),
        MarkerLayer(
          markers: [
            for (final enforcer in enforcers.where((e) => !e.isMe))
              MapMarkers.teammate(
                enforcer.location,
                onTap: () => setState(() => _selectedCapId = enforcer.capId),
              ),
            // The user last, so they are on top where pins overlap.
            if (widget.position != null)
              MapMarkers.me(enforcers.first.location),
            if (selected != null && (widget.position != null || !selected.isMe))
              MapMarkers.label(
                selected.location,
                title: selected.isMe ? 'You are here' : selected.name,
                subtitle: selected.address,
                pinHeight: selected.isMe
                    ? MapMarkers.meSize / 2
                    : MapMarkers.teammateSize.height,
              ),
          ],
        ),
      ],
    );
  }

  /// Zoom in and out, stacked in one card.
  Widget _buildZoomControls() {
    Widget button(IconData icon, String tooltip, double by) {
      return Tooltip(
        message: tooltip,
        child: InkWell(
          onTap: () => _zoom(by),
          child: SizedBox(
            width: 44,
            height: 44,
            child: Icon(icon, size: 22, color: AppColors.darkGreen),
          ),
        ),
      );
    }

    return _MapCard(
      radius: 14,
      child: Column(
        children: [
          button(Icons.add_rounded, 'Zoom in', 1),
          Container(width: 28, height: 1, color: AppColors.outline),
          button(Icons.remove_rounded, 'Zoom out', -1),
        ],
      ),
    );
  }

  Widget _buildSheet(List<_Enforcer> enforcers) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(_sheetRadius)),
        boxShadow: [
          BoxShadow(
            color: Color(0x33000000),
            offset: Offset(0, -2),
            blurRadius: 24,
          ),
        ],
      ),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 5,
            decoration: BoxDecoration(
              color: AppColors.outline,
              borderRadius: BorderRadius.circular(50),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 12, 8),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Team Status',
                        style: appTextStyle(
                          fontSize: 16,
                          lineHeight: 22,
                          weight: FontWeight.w900,
                          color: AppColors.darkGreen,
                        ),
                      ),
                      Text(
                        '${enforcers.length} caps connected · '
                        'updated ${_updatedAt.format(context)}',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: appTextStyle(
                          fontSize: 12,
                          lineHeight: 16,
                          weight: FontWeight.w500,
                          color: AppColors.mutedText,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  tooltip: 'Refresh',
                  onPressed: _refresh,
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.mint,
                    foregroundColor: AppColors.darkGreen,
                  ),
                  icon: const Icon(Icons.refresh_rounded, size: 20),
                ),
              ],
            ),
          ),
          Expanded(
            child: ListView.separated(
              padding: EdgeInsets.fromLTRB(
                16,
                4,
                16,
                widget.bottomPadding + 12,
              ),
              itemCount: enforcers.length,
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemBuilder: (_, index) =>
                  _buildStatusCard(enforcers[index], enforcers.first.location),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(_Enforcer enforcer, LatLng myLocation) {
    final selected = enforcer.capId == _selectedCapId;
    return Material(
      color: selected ? AppColors.paleMint : AppColors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: selected ? AppColors.green : AppColors.outline,
          width: selected ? 1.5 : 1,
        ),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => enforcer.isMe ? _recenter() : _showOnMap(enforcer),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: enforcer.isMe ? AppColors.green : AppColors.mint,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  enforcer.isMe
                      ? Icons.navigation_rounded
                      : Icons.badge_rounded,
                  size: 20,
                  color: enforcer.isMe ? AppColors.white : AppColors.darkGreen,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          enforcer.name,
                          maxLines: 1,
                          style: appTextStyle(
                            fontSize: 13,
                            lineHeight: 18,
                            weight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                        ),
                        if (!enforcer.isMe) ...[
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              '· ${distanceLabel(myLocation, enforcer.location)} away',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: appTextStyle(
                                fontSize: 11,
                                lineHeight: 18,
                                weight: FontWeight.w600,
                                color: AppColors.mutedText,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    Text(
                      enforcer.address,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: appTextStyle(
                        fontSize: 12,
                        lineHeight: 16,
                        weight: FontWeight.w500,
                        color: AppColors.bodyText,
                      ),
                    ),
                    Text(
                      enforcer.capId,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: appTextStyle(
                        fontSize: 10,
                        lineHeight: 14,
                        weight: FontWeight.w600,
                        color: AppColors.green,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const StatusChip.connected(),
            ],
          ),
        ),
      ),
    );
  }
}

/// Says the user's position is not live, and offers the way to fix it.
class _LocationBanner extends StatelessWidget {
  const _LocationBanner({required this.problem, this.onFix});

  final LocationProblem problem;
  final VoidCallback? onFix;

  @override
  Widget build(BuildContext context) {
    final (message, action) = switch (problem) {
      LocationProblem.serviceOff => ('Location is off', 'Turn on'),
      LocationProblem.denied => ('Location not allowed', 'Allow'),
      LocationProblem.deniedForever => ('Location not allowed', 'Settings'),
    };
    return _MapCard(
      radius: 14,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 4, 4, 4),
        child: Row(
          children: [
            const Icon(
              Icons.location_off_rounded,
              size: 18,
              color: AppColors.red,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                message,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 18,
                  weight: FontWeight.w700,
                  color: AppColors.ink,
                ),
              ),
            ),
            TextButton(
              onPressed: onFix,
              child: Text(
                action,
                style: appTextStyle(
                  fontSize: 13,
                  weight: FontWeight.w800,
                  color: AppColors.green,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// White rounded surface with a soft shadow, for controls over the map.
class _MapCard extends StatelessWidget {
  const _MapCard({required this.child, required this.radius, this.color});

  final Widget child;
  final double radius;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(radius),
        boxShadow: const [
          BoxShadow(
            color: Color(0x29000000),
            offset: Offset(0, 3),
            blurRadius: 10,
          ),
        ],
      ),
      child: Material(
        color: color ?? AppColors.white,
        borderRadius: BorderRadius.circular(radius),
        clipBehavior: Clip.antiAlias,
        child: child,
      ),
    );
  }
}

/// Round button over the map. The [primary] one is filled dark green.
class _MapButton extends StatelessWidget {
  const _MapButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    this.size = 44,
    this.primary = false,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;
  final double size;
  final bool primary;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: _MapCard(
        radius: size / 2,
        color: primary ? AppColors.darkGreen : null,
        child: InkWell(
          onTap: onPressed,
          child: SizedBox(
            width: size,
            height: size,
            child: Icon(
              icon,
              size: size * 0.5,
              color: primary ? AppColors.white : AppColors.darkGreen,
            ),
          ),
        ),
      ),
    );
  }
}

/// Two green rings that spread out from the centre and fade, one after the
/// other. [progress] runs from 0 to 1; nothing is drawn at either end.
class _PulsePainter extends CustomPainter {
  const _PulsePainter(this.progress);

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    if (progress == 0 || progress == 1) return;
    final centre = size.center(Offset.zero);
    for (var ring = 0; ring < 2; ring++) {
      final t = ((progress - ring * 0.35) / 0.65).clamp(0.0, 1.0);
      if (t == 0 || t == 1) continue;
      final radius = 14 + t * 76;
      final fade = 1 - Curves.easeOut.transform(t);
      canvas
        ..drawCircle(
          centre,
          radius,
          Paint()..color = AppColors.green.withValues(alpha: 0.16 * fade),
        )
        ..drawCircle(
          centre,
          radius,
          Paint()
            ..color = AppColors.green.withValues(alpha: 0.7 * fade)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 2,
        );
    }
  }

  @override
  bool shouldRepaint(_PulsePainter oldDelegate) =>
      oldDelegate.progress != progress;
}
