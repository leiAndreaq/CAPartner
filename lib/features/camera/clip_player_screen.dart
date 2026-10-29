import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';

import 'package:capartner/features/camera/recorded_clip.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Full-screen player for a clip recorded on the Camera tab.
///
/// It starts playing straight away. Tapping the video shows or hides the
/// controls, which also hide by themselves a few seconds into playback.
class ClipPlayerScreen extends StatefulWidget {
  const ClipPlayerScreen({super.key, required this.clip});

  final RecordedClip clip;

  @override
  State<ClipPlayerScreen> createState() => _ClipPlayerScreenState();
}

class _ClipPlayerScreenState extends State<ClipPlayerScreen> {
  late final VideoPlayerController _video = VideoPlayerController.file(
    File(widget.clip.path),
  );

  bool _ready = false;
  bool _failed = false;
  bool _controlsVisible = true;
  Timer? _hideTimer;

  @override
  void initState() {
    super.initState();
    _video.initialize().then(
      (_) {
        if (!mounted) return;
        setState(() => _ready = true);
        _play();
      },
      onError: (Object _) {
        if (mounted) setState(() => _failed = true);
      },
    );
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    _video.dispose();
    super.dispose();
  }

  bool get _finished {
    final value = _video.value;
    return value.isInitialized &&
        !value.isPlaying &&
        value.position >= value.duration;
  }

  void _play() {
    if (_finished) _video.seekTo(Duration.zero);
    _video.play();
    _scheduleHide();
  }

  void _togglePlay() {
    if (!_ready) return;
    if (_video.value.isPlaying) {
      _video.pause();
      _hideTimer?.cancel();
      setState(() => _controlsVisible = true);
    } else {
      _play();
    }
  }

  void _toggleControls() {
    setState(() => _controlsVisible = !_controlsVisible);
    if (_controlsVisible) _scheduleHide();
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && _video.value.isPlaying) {
        setState(() => _controlsVisible = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: Colors.black,
        body: ValueListenableBuilder<VideoPlayerValue>(
          valueListenable: _video,
          builder: (context, value, _) {
            return Stack(
              children: [
                Positioned.fill(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: _toggleControls,
                    child: Center(child: _buildVideo(value)),
                  ),
                ),
                Positioned.fill(
                  child: IgnorePointer(
                    ignoring: !_controlsVisible,
                    child: AnimatedOpacity(
                      opacity: _controlsVisible ? 1 : 0,
                      duration: const Duration(milliseconds: 200),
                      child: _buildControls(value),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildVideo(VideoPlayerValue value) {
    if (_failed) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Text(
          "This clip can't be played.",
          textAlign: TextAlign.center,
          style: appTextStyle(
            fontSize: 14,
            lineHeight: 20,
            weight: FontWeight.w600,
            color: AppColors.white,
          ),
        ),
      );
    }
    if (!_ready) {
      return const CircularProgressIndicator(color: AppColors.white);
    }
    return AspectRatio(
      aspectRatio: value.aspectRatio,
      child: VideoPlayer(_video),
    );
  }

  Widget _buildControls(VideoPlayerValue value) {
    final clip = widget.clip;
    final IconData playIcon = _finished
        ? Icons.replay_rounded
        : value.isPlaying
        ? Icons.pause_rounded
        : Icons.play_arrow_rounded;

    return DecoratedBox(
      // Darkens the top and bottom so the controls read over a bright video.
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color(0x99000000),
            Color(0x00000000),
            Color(0x00000000),
            Color(0x99000000),
          ],
          stops: [0, 0.22, 0.7, 1],
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 4, 16, 0),
              child: Row(
                children: [
                  IconButton(
                    tooltip: 'Close',
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(
                      Icons.close_rounded,
                      color: AppColors.white,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Recorded clip',
                          style: appTextStyle(
                            fontSize: 15,
                            lineHeight: 20,
                            weight: FontWeight.w800,
                            color: AppColors.white,
                          ),
                        ),
                        Text(
                          '${formatClipTime(clip.recordedAt)} · '
                          '${formatClipLength(clip.length)}',
                          style: appTextStyle(
                            fontSize: 12,
                            lineHeight: 16,
                            weight: FontWeight.w500,
                            color: AppColors.white.withValues(alpha: 0.75),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Spacer(),
            if (_ready)
              Semantics(
                button: true,
                label: value.isPlaying ? 'Pause' : 'Play',
                child: GestureDetector(
                  onTap: _togglePlay,
                  child: Container(
                    width: 72,
                    height: 72,
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.45),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.white.withValues(alpha: 0.35),
                      ),
                    ),
                    child: Icon(playIcon, size: 40, color: AppColors.white),
                  ),
                ),
              ),
            const Spacer(),
            if (_ready)
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                child: Column(
                  children: [
                    SizedBox(
                      height: 20,
                      child: VideoProgressIndicator(
                        _video,
                        allowScrubbing: true,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        colors: VideoProgressColors(
                          playedColor: AppColors.mint,
                          bufferedColor: AppColors.white.withValues(
                            alpha: 0.35,
                          ),
                          backgroundColor: AppColors.white.withValues(
                            alpha: 0.2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        _buildTime(value.position),
                        const Spacer(),
                        _buildTime(value.duration),
                      ],
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildTime(Duration time) {
    return Text(
      formatClipLength(time),
      style: appTextStyle(
        fontSize: 12,
        lineHeight: 16,
        weight: FontWeight.w700,
        color: AppColors.white,
      ),
    );
  }
}
