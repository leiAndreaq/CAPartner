import 'dart:async';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// A video recorded during this session.
class _Clip {
  const _Clip({required this.path, required this.recordedAt});

  final String path;
  final DateTime recordedAt;
}

/// Camera tab (Figma node 546:636).
///
/// The live view is the phone's own camera. The round button starts and stops
/// a video recording; finished clips are listed below the view for the rest
/// of the session.
class CameraTab extends StatefulWidget {
  const CameraTab({super.key, required this.statusBar, required this.location});

  /// Connection status pill shown at the top.
  final Widget statusBar;

  /// Where the user is, shown under the title.
  final String location;

  @override
  State<CameraTab> createState() => _CameraTabState();
}

class _CameraTabState extends State<CameraTab> with WidgetsBindingObserver {
  // Sizes below are taken from the 390x844 Figma frame.
  static const double _viewHeight = 352.68;

  List<CameraDescription> _cameras = const [];
  int _cameraIndex = 0;
  CameraController? _controller;

  /// Why there is no live view, when the camera could not be opened.
  String? _error;

  /// Guards against tapping a button again while the camera is still busy.
  bool _busy = false;

  Timer? _recordTimer;
  int _recordedSeconds = 0;
  final List<_Clip> _clips = [];

  bool get _isRecording => _controller?.value.isRecordingVideo ?? false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _setUp();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _recordTimer?.cancel();
    _controller?.dispose();
    super.dispose();
  }

  // The camera must be released while the app is in the background.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_cameras.isEmpty) return;
    if (state == AppLifecycleState.inactive) {
      _recordTimer?.cancel();
      _controller?.dispose();
      setState(() => _controller = null);
    } else if (state == AppLifecycleState.resumed && _controller == null) {
      _open(_cameraIndex);
    }
  }

  Future<void> _setUp() async {
    try {
      final cameras = await availableCameras();
      if (!mounted) return;
      if (cameras.isEmpty) {
        setState(() => _error = 'No camera was found on this device.');
        return;
      }
      _cameras = cameras;
      final back = cameras.indexWhere(
        (camera) => camera.lensDirection == CameraLensDirection.back,
      );
      await _open(back == -1 ? 0 : back);
    } catch (error) {
      _showError(error);
    }
  }

  Future<void> _open(int index) async {
    final previous = _controller;
    // Audio is off so only the camera permission is asked for.
    final controller = CameraController(
      _cameras[index],
      ResolutionPreset.high,
      enableAudio: false,
    );
    setState(() {
      _controller = null;
      _error = null;
    });
    try {
      await previous?.dispose();
      await controller.initialize();
    } catch (error) {
      await controller.dispose();
      _showError(error);
      return;
    }
    if (!mounted) {
      await controller.dispose();
      return;
    }
    setState(() {
      _cameraIndex = index;
      _controller = controller;
    });
  }

  void _showError(Object error) {
    if (!mounted) return;
    final denied =
        error is CameraException && error.code.contains('AccessDenied');
    setState(() {
      _controller = null;
      _error = denied
          ? 'Camera access is off. Allow it in your phone settings to see '
                'the live view.'
          : 'The camera is not available right now.';
    });
  }

  Future<void> _switchCamera() async {
    if (_busy || _isRecording || _cameras.length < 2) return;
    _busy = true;
    await _open((_cameraIndex + 1) % _cameras.length);
    _busy = false;
  }

  Future<void> _toggleRecording() async {
    final controller = _controller;
    if (_busy || controller == null) return;
    _busy = true;
    try {
      if (controller.value.isRecordingVideo) {
        _recordTimer?.cancel();
        final file = await controller.stopVideoRecording();
        if (!mounted) return;
        setState(
          () => _clips.insert(
            0,
            _Clip(path: file.path, recordedAt: DateTime.now()),
          ),
        );
      } else {
        await controller.startVideoRecording();
        if (!mounted) return;
        setState(() => _recordedSeconds = 0);
        _recordTimer = Timer.periodic(
          const Duration(seconds: 1),
          (_) => setState(() => _recordedSeconds++),
        );
      }
    } catch (error) {
      _recordTimer?.cancel();
      _showError(error);
    } finally {
      _busy = false;
    }
  }

  static String _twoDigits(int value) => value.toString().padLeft(2, '0');

  /// Time of day as shown on a clip, e.g. "09:51 AM".
  static String _formatTime(DateTime time) {
    final hour = time.hour % 12 == 0 ? 12 : time.hour % 12;
    final period = time.hour < 12 ? 'AM' : 'PM';
    return '${_twoDigits(hour)}:${_twoDigits(time.minute)} $period';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const SizedBox(height: 10),
        widget.statusBar,
        const SizedBox(height: 14),
        Text(
          'RECORD',
          textAlign: TextAlign.center,
          style: appTextStyle(
            fontSize: 32,
            lineHeight: 36,
            weight: FontWeight.w900,
            color: AppColors.darkGreen,
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            widget.location,
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 16,
              lineHeight: 30,
              weight: FontWeight.w600,
              color: const Color(0xFF6F6F6F),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 37),
          child: Container(
            width: double.infinity,
            constraints: const BoxConstraints(minHeight: 56),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.mint,
              borderRadius: BorderRadius.circular(15),
            ),
            child: Text(
              'Internet connection required. Please connect to the internet '
              'and try again.',
              textAlign: TextAlign.center,
              style: appTextStyle(
                fontSize: 13,
                lineHeight: 19.5,
                weight: FontWeight.w600,
                color: AppColors.green,
              ),
            ),
          ),
        ),
        const SizedBox(height: 19),
        Padding(
          padding: const EdgeInsets.only(left: 40, right: 35),
          child: _buildLiveView(),
        ),
        if (_clips.isNotEmpty) ...[
          const SizedBox(height: 23),
          SizedBox(
            height: 64,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 41),
              itemCount: _clips.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (_, index) => _buildClip(_clips[index]),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildLiveView() {
    final controller = _controller;
    const cornerColor = Color(0xB3FFFFFF);
    const cornerSide = BorderSide(color: cornerColor, width: 1.25);
    const cornerRadius = Radius.circular(8);

    return Container(
      height: _viewHeight,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF101310),
        borderRadius: BorderRadius.circular(24),
      ),
      child: Stack(
        children: [
          if (controller != null)
            Positioned.fill(child: _buildPreview(controller))
          else
            Positioned.fill(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Center(
                  child: _error == null
                      ? const CircularProgressIndicator(color: AppColors.white)
                      : Text(
                          _error!,
                          textAlign: TextAlign.center,
                          style: appTextStyle(
                            fontSize: 13,
                            lineHeight: 19.5,
                            weight: FontWeight.w600,
                            color: AppColors.white,
                          ),
                        ),
                ),
              ),
            ),
          // Viewfinder corners.
          for (final (alignment, border, radius) in const [
            (
              Alignment.topLeft,
              Border(top: cornerSide, left: cornerSide),
              BorderRadius.only(topLeft: cornerRadius),
            ),
            (
              Alignment.topRight,
              Border(top: cornerSide, right: cornerSide),
              BorderRadius.only(topRight: cornerRadius),
            ),
            (
              Alignment.bottomLeft,
              Border(bottom: cornerSide, left: cornerSide),
              BorderRadius.only(bottomLeft: cornerRadius),
            ),
            (
              Alignment.bottomRight,
              Border(bottom: cornerSide, right: cornerSide),
              BorderRadius.only(bottomRight: cornerRadius),
            ),
          ])
            Positioned.fill(
              child: IgnorePointer(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Align(
                    alignment: alignment,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        border: border,
                        borderRadius: radius,
                      ),
                    ),
                  ),
                ),
              ),
            ),
          Positioned(left: 16, top: 16, child: _buildViewLabel()),
          Positioned(left: 34, bottom: 34, child: _buildSwitchButton()),
          Positioned(
            left: 0,
            right: 0,
            bottom: 20,
            child: Center(child: _buildRecordButton()),
          ),
        ],
      ),
    );
  }

  /// The camera image, scaled to fill the view without stretching.
  Widget _buildPreview(CameraController controller) {
    // The camera reports its size in landscape; the app is used in portrait.
    final size = controller.value.previewSize ?? const Size(4, 3);
    return FittedBox(
      fit: BoxFit.cover,
      clipBehavior: Clip.hardEdge,
      child: SizedBox(
        width: size.height,
        height: size.width,
        child: CameraPreview(controller),
      ),
    );
  }

  Widget _buildViewLabel() {
    final minutes = _twoDigits(_recordedSeconds ~/ 60);
    final seconds = _twoDigits(_recordedSeconds % 60);

    return Container(
      height: 28.5,
      padding: const EdgeInsets.only(left: 12, right: 16),
      decoration: BoxDecoration(
        color: const Color(0x8C000000),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: Color(0xFFD32F2F),
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            _isRecording ? 'REC $minutes:$seconds' : 'Live view',
            style: appTextStyle(
              fontSize: 11,
              weight: FontWeight.w800,
              color: AppColors.white,
              letterSpacing: 1.1,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSwitchButton() {
    return Semantics(
      button: true,
      label: 'Switch camera',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _switchCamera,
        child: Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: AppColors.white,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: Color(0x2E1A1A1A),
                offset: Offset(0, 8),
                blurRadius: 12,
              ),
              BoxShadow(
                color: Color(0x0F1A1A1A),
                offset: Offset(0, 1),
                blurRadius: 1,
              ),
            ],
          ),
          child: SvgPicture.asset(
            'assets/icons/switch_camera.svg',
            width: 20,
            height: 20,
          ),
        ),
      ),
    );
  }

  Widget _buildRecordButton() {
    return Semantics(
      button: true,
      label: _isRecording ? 'Stop recording' : 'Start recording',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _toggleRecording,
        child: Container(
          width: 76,
          height: 76,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppColors.white,
            shape: BoxShape.circle,
            border: Border.all(color: AppColors.ink, width: 5),
          ),
          child: _isRecording
              // The Figma file only has the idle state of this button.
              ? Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD32F2F),
                    borderRadius: BorderRadius.circular(6),
                  ),
                )
              : SvgPicture.asset(
                  'assets/icons/shutter.svg',
                  width: 52,
                  height: 52,
                ),
        ),
      ),
    );
  }

  Widget _buildClip(_Clip clip) {
    return Container(
      width: 64,
      height: 64,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: const Color(0xFF101310),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE1E5E1), width: 1.25),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            bottom: 17.5,
            child: Center(
              child: SvgPicture.asset(
                'assets/icons/play.svg',
                width: 18,
                height: 18,
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 17.5,
            child: Container(
              color: const Color(0x8C000000),
              alignment: Alignment.center,
              child: Text(
                _formatTime(clip.recordedAt),
                maxLines: 1,
                style: appTextStyle(
                  fontSize: 9,
                  weight: FontWeight.w700,
                  color: AppColors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
