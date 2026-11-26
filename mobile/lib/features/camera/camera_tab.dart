import 'dart:async';
import 'dart:math' as math;

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/features/camera/clip_player_screen.dart';
import 'package:capartner/features/camera/recorded_clip.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Camera tab (Figma node 546:636).
///
/// The live view is the phone's own camera. The round button starts and stops
/// a video recording with sound, up to [maxClipLength]; finished clips are
/// listed below the view and play full screen when tapped.
class CameraTab extends StatefulWidget {
  const CameraTab({
    super.key,
    required this.statusBar,
    required this.location,
    this.clips = const [],
    this.onClipRecorded,
  });

  /// Longest a single clip can run; recording stops by itself at this point.
  static const Duration maxClipLength = Duration(minutes: 1);

  /// Connection status pill shown at the top.
  final Widget statusBar;

  /// Where the user is, shown under the title.
  final String location;

  /// Clips recorded so far, newest first. They are kept by the home screen so
  /// they survive switching tabs.
  final List<RecordedClip> clips;

  /// Called with each finished clip.
  final ValueChanged<RecordedClip>? onClipRecorded;

  @override
  State<CameraTab> createState() => _CameraTabState();
}

class _CameraTabState extends State<CameraTab>
    with WidgetsBindingObserver, SingleTickerProviderStateMixin {
  // Sizes below are taken from the 390x844 Figma frame.
  static const double _viewHeight = 352.68;
  static const Color _recordRed = Color(0xFFD32F2F);

  List<CameraDescription> _cameras = const [];
  int _cameraIndex = 0;
  CameraController? _controller;

  /// Why there is no live view, when the camera could not be opened.
  String? _error;

  /// Set when the microphone was refused, so clips are recorded silently.
  bool _micDenied = false;

  /// Guards against tapping a button again while the camera is still busy.
  bool _busy = false;

  /// Runs from 0 to 1 over [CameraTab.maxClipLength] while recording, and
  /// stops the recording when it gets to the end.
  late final AnimationController _clipProgress =
      AnimationController(vsync: this, duration: CameraTab.maxClipLength)
        ..addStatusListener((status) {
          if (status == AnimationStatus.completed) {
            _stopRecording(reachedLimit: true);
          }
        });

  /// Shown briefly over the live view after a clip is saved.
  String? _notice;
  Timer? _noticeTimer;

  bool get _isRecording => _controller?.value.isRecordingVideo ?? false;

  Duration get _elapsed => CameraTab.maxClipLength * _clipProgress.value;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _setUp();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _noticeTimer?.cancel();
    final controller = _controller;
    if (controller != null && controller.value.isRecordingVideo) {
      // Leaving the tab mid-recording still keeps the clip.
      final length = _elapsed;
      final onClipRecorded = widget.onClipRecorded;
      controller
          .stopVideoRecording()
          .then(
            (file) => onClipRecorded?.call(
              RecordedClip(
                path: file.path,
                recordedAt: DateTime.now(),
                length: length,
              ),
            ),
          )
          .catchError((Object _) {})
          .whenComplete(controller.dispose);
    } else {
      controller?.dispose();
    }
    _clipProgress.dispose();
    super.dispose();
  }

  // The camera must be released while the app is in the background.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (_cameras.isEmpty) return;
    if (state == AppLifecycleState.inactive) {
      _release();
    } else if (state == AppLifecycleState.resumed && _controller == null) {
      _open(_cameraIndex);
    }
  }

  Future<void> _release() async {
    // A clip being recorded is saved rather than lost.
    await _stopRecording();
    final controller = _controller;
    if (controller == null || !mounted) return;
    setState(() => _controller = null);
    await controller.dispose();
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
    // Clips have sound unless the microphone was refused.
    final controller = CameraController(
      _cameras[index],
      ResolutionPreset.high,
      enableAudio: !_micDenied,
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
      if (error is CameraException &&
          error.code.startsWith('Audio') &&
          !_micDenied) {
        // Without the microphone the camera still works; record silently.
        _micDenied = true;
        return _open(index);
      }
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

  Future<void> _toggleRecording() =>
      _isRecording ? _stopRecording() : _startRecording();

  Future<void> _startRecording() async {
    final controller = _controller;
    if (_busy || controller == null || controller.value.isRecordingVideo) {
      return;
    }
    _busy = true;
    try {
      await controller.startVideoRecording();
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      _clipProgress.forward(from: 0);
      setState(() {});
    } catch (error) {
      _showError(error);
    } finally {
      _busy = false;
    }
  }

  /// Stops and keeps the clip; [reachedLimit] when the time ran out.
  Future<void> _stopRecording({bool reachedLimit = false}) async {
    final controller = _controller;
    if (_busy || controller == null || !controller.value.isRecordingVideo) {
      return;
    }
    _busy = true;
    final length = reachedLimit ? CameraTab.maxClipLength : _elapsed;
    _clipProgress.stop();
    try {
      final file = await controller.stopVideoRecording();
      widget.onClipRecorded?.call(
        RecordedClip(
          path: file.path,
          recordedAt: DateTime.now(),
          length: length,
        ),
      );
      if (!mounted) return;
      HapticFeedback.mediumImpact();
      _clipProgress.value = 0;
      _showNotice(
        reachedLimit
            ? '1 minute limit reached · clip saved'
            : 'Clip saved · ${formatClipLength(length)}',
      );
    } catch (error) {
      _clipProgress.value = 0;
      _showError(error);
    } finally {
      _busy = false;
    }
  }

  void _showNotice(String message) {
    _noticeTimer?.cancel();
    setState(() => _notice = message);
    _noticeTimer = Timer(const Duration(milliseconds: 2500), () {
      if (mounted) setState(() => _notice = null);
    });
  }

  void _play(RecordedClip clip) {
    Navigator.of(context).push(
      MaterialPageRoute<void>(builder: (_) => ClipPlayerScreen(clip: clip)),
    );
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
        if (widget.clips.isNotEmpty) ...[
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 41),
            child: Row(
              children: [
                Text(
                  'RECENT CLIPS',
                  style: appTextStyle(
                    fontSize: 11,
                    lineHeight: 16,
                    weight: FontWeight.w800,
                    color: AppColors.darkGreen,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '${widget.clips.length}',
                  style: appTextStyle(
                    fontSize: 11,
                    lineHeight: 16,
                    weight: FontWeight.w700,
                    color: AppColors.mutedText,
                  ),
                ),
                const Spacer(),
                Text(
                  'Tap to play',
                  style: appTextStyle(
                    fontSize: 11,
                    lineHeight: 16,
                    weight: FontWeight.w600,
                    color: AppColors.mutedText,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 64,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 41),
              itemCount: widget.clips.length,
              separatorBuilder: (_, _) => const SizedBox(width: 10),
              itemBuilder: (_, index) => _buildClip(widget.clips[index]),
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
          Positioned(right: 16, top: 16, child: _buildLimitChip()),
          if (_notice != null)
            Positioned(
              left: 16,
              right: 16,
              top: 56,
              child: Center(child: _buildNotice(_notice!)),
            ),
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
    return AnimatedBuilder(
      animation: _clipProgress,
      builder: (_, _) {
        final recording = _isRecording;
        final elapsed = _elapsed;
        // The dot blinks while recording.
        final dotOn = !recording || (elapsed.inMilliseconds ~/ 500).isEven;
        return Container(
          height: 28.5,
          padding: const EdgeInsets.only(left: 12, right: 16),
          decoration: BoxDecoration(
            color: const Color(0x8C000000),
            borderRadius: BorderRadius.circular(15),
          ),
          child: Row(
            children: [
              AnimatedOpacity(
                opacity: dotOn ? 1 : 0.2,
                duration: const Duration(milliseconds: 150),
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: _recordRed,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                recording
                    ? 'REC ${formatClipLength(elapsed)} / '
                          '${formatClipLength(CameraTab.maxClipLength)}'
                    : 'Live view',
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
      },
    );
  }

  /// The clip length limit, and whether sound is being recorded.
  Widget _buildLimitChip() {
    return Container(
      height: 28.5,
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: const Color(0x8C000000),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          Icon(
            _micDenied ? Icons.mic_off_rounded : Icons.mic_rounded,
            size: 14,
            color: AppColors.white,
            semanticLabel: _micDenied ? 'Sound off' : 'Sound on',
          ),
          const SizedBox(width: 6),
          Text(
            'MAX 1:00',
            style: appTextStyle(
              fontSize: 10,
              weight: FontWeight.w800,
              color: AppColors.white,
              letterSpacing: 0.8,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotice(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x33000000),
            offset: Offset(0, 4),
            blurRadius: 12,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.check_circle_rounded,
            size: 16,
            color: AppColors.green,
          ),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              message,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: appTextStyle(
                fontSize: 12,
                weight: FontWeight.w700,
                color: AppColors.ink,
              ),
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
        child: AnimatedBuilder(
          animation: _clipProgress,
          // The time used so far fills the button's ring in red.
          builder: (_, child) => CustomPaint(
            foregroundPainter: _RingPainter(
              progress: _clipProgress.value,
              color: _recordRed,
            ),
            child: child,
          ),
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
                      color: _recordRed,
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
      ),
    );
  }

  Widget _buildClip(RecordedClip clip) {
    return Semantics(
      button: true,
      label: 'Play clip from ${formatClipTime(clip.recordedAt)}',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => _play(clip),
        child: ExcludeSemantics(child: _buildClipTile(clip)),
      ),
    );
  }

  Widget _buildClipTile(RecordedClip clip) {
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
          Positioned(
            right: 4,
            top: 4,
            child: Text(
              formatClipLength(clip.length),
              style: appTextStyle(
                fontSize: 8,
                weight: FontWeight.w700,
                color: AppColors.white.withValues(alpha: 0.85),
              ),
            ),
          ),
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
                formatClipTime(clip.recordedAt),
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

/// A ring drawn over the record button's border, filled clockwise from the
/// top as [progress] goes from 0 to 1.
class _RingPainter extends CustomPainter {
  const _RingPainter({required this.progress, required this.color});

  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (progress == 0) return;
    const strokeWidth = 5.0;
    final rect = (Offset.zero & size).deflate(strokeWidth / 2);
    canvas.drawArc(
      rect,
      -math.pi / 2,
      2 * math.pi * progress,
      false,
      Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(_RingPainter oldDelegate) =>
      oldDelegate.progress != progress || oldDelegate.color != color;
}
