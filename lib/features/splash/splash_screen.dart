import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/theme/app_colors.dart';

/// Splash screen (Figma node 482:2).
///
/// The whole screen is tappable in the design; [onContinue] is called on tap.
/// On open the logo pops in, then the title and tagline rise in after it, and
/// a soft glow keeps pulsing behind the logo.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key, this.onContinue});

  final VoidCallback? onContinue;

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // Offsets below are taken from the 390x844 Figma frame, relative to the top
  // of the logo (y = 260). The texts overlap the logo's transparent padding.
  static const double _logoSize = 243;
  static const double _titleTop = 229;
  static const double _taglineTop = 265;
  static const double _lineHeight = 43.5;
  static const double _contentHeight = _taglineTop + _lineHeight;

  /// Diameter of the glow behind the logo.
  static const double _glowSize = 320;

  // Places the content block 260px from the top on an 844px tall frame.
  static const Alignment _contentAlignment = Alignment(0, -0.029);

  static const TextStyle _baseTextStyle = TextStyle(
    fontFamily: 'Inter',
    color: AppColors.white,
    letterSpacing: -0.725,
    leadingDistribution: TextLeadingDistribution.even,
    fontFeatures: [FontFeature('dlig')],
  );

  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  late final AnimationController _glow = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  );

  // The intro is staggered: logo first, then the title, then the tagline.
  late final Animation<double> _logoFade = _interval(0, 0.45, Curves.easeOut);
  late final Animation<double> _logoScale = Tween<double>(
    begin: 0.6,
    end: 1,
  ).animate(_interval(0, 0.6, Curves.easeOutBack));
  late final Animation<double> _titleFade = _interval(
    0.35,
    0.75,
    Curves.easeOut,
  );
  late final Animation<Offset> _titleSlide = _rise(0.35, 0.75);
  late final Animation<double> _taglineFade = _interval(
    0.55,
    1,
    Curves.easeOut,
  );
  late final Animation<Offset> _taglineSlide = _rise(0.55, 1);

  // The glow fades in with the logo, then breathes once the intro is done.
  late final Animation<double> _glowIntro = _interval(0.2, 0.8, Curves.easeOut);
  late final Animation<double> _glowPulse = CurvedAnimation(
    parent: _glow,
    curve: Curves.easeInOut,
  );

  Animation<double> _interval(double begin, double end, Curve curve) {
    return CurvedAnimation(
      parent: _intro,
      curve: Interval(begin, end, curve: curve),
    );
  }

  /// Slides a line up into place over the given part of the intro.
  Animation<Offset> _rise(double begin, double end) {
    return Tween<Offset>(
      begin: const Offset(0, 0.35),
      end: Offset.zero,
    ).animate(_interval(begin, end, Curves.easeOutCubic));
  }

  @override
  void initState() {
    super.initState();
    _intro.addStatusListener((status) {
      if (status == AnimationStatus.completed) _glow.repeat(reverse: true);
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Respect the system's reduce-motion setting: show the end state at once.
    if (MediaQuery.disableAnimationsOf(context)) {
      _glow.stop();
      _intro.value = 1;
      _glow.value = 0;
    } else if (_intro.isDismissed) {
      _intro.forward();
    }
  }

  @override
  void dispose() {
    _intro.dispose();
    _glow.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.darkGreen,
        body: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: widget.onContinue,
          child: Align(
            alignment: _contentAlignment,
            child: SizedBox(
              width: double.infinity,
              height: _contentHeight,
              child: Stack(
                alignment: Alignment.topCenter,
                clipBehavior: Clip.none,
                children: [
                  Positioned(
                    top: (_logoSize - _glowSize) / 2,
                    child: _buildGlow(),
                  ),
                  FadeTransition(
                    opacity: _logoFade,
                    alwaysIncludeSemantics: true,
                    child: ScaleTransition(
                      scale: _logoScale,
                      child: Image.asset(
                        'assets/images/cap_logo.png',
                        width: _logoSize,
                        height: _logoSize,
                        fit: BoxFit.cover,
                        semanticLabel: 'CAPartner logo',
                      ),
                    ),
                  ),
                  Positioned(
                    top: _titleTop,
                    left: 0,
                    right: 0,
                    child: _buildRisingText(
                      fade: _titleFade,
                      slide: _titleSlide,
                      child: Text(
                        'CAPartner',
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        style: _baseTextStyle.copyWith(
                          fontSize: 40,
                          height: _lineHeight / 40,
                          fontWeight: FontWeight.w800,
                          fontVariations: const [FontVariation.weight(800)],
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: _taglineTop,
                    left: 0,
                    right: 0,
                    child: _buildRisingText(
                      fade: _taglineFade,
                      slide: _taglineSlide,
                      child: Text(
                        'CAPartner sa Kalusugan, CAPartner sa Kaligtasan.',
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        style: _baseTextStyle.copyWith(
                          fontSize: 12,
                          height: _lineHeight / 12,
                          fontWeight: FontWeight.w600,
                          fontVariations: const [FontVariation.weight(600)],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Soft green halo behind the logo, in the palette's lighter green.
  Widget _buildGlow() {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: Listenable.merge([_intro, _glow]),
        builder: (context, child) {
          final pulse = _glowPulse.value;
          return Opacity(
            opacity: _glowIntro.value * (0.55 + 0.45 * pulse),
            child: Transform.scale(scale: 0.92 + 0.12 * pulse, child: child),
          );
        },
        child: Container(
          width: _glowSize,
          height: _glowSize,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(
              colors: [
                AppColors.green.withValues(alpha: 0.7),
                AppColors.green.withValues(alpha: 0),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRisingText({
    required Animation<double> fade,
    required Animation<Offset> slide,
    required Widget child,
  }) {
    return FadeTransition(
      opacity: fade,
      alwaysIncludeSemantics: true,
      child: SlideTransition(position: slide, child: child),
    );
  }
}
