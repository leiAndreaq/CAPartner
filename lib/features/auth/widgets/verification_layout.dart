import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Layout shared by the Forgot Password and login verification steps: a back
/// button and title, a pulsing emblem with the heading on green, and a white sheet with
/// the step bar at the bottom.
///
/// [children] are laid out in the sheet, below the step bar. The green hero
/// takes the spare height, so the sheet only grows as tall as its content.
class VerificationScaffold extends StatefulWidget {
  const VerificationScaffold({
    super.key,
    required this.title,
    required this.heading,
    required this.subheading,
    required this.children,
    this.iconAsset,
    this.icon,
    this.step,
    this.subheadingEmphasis,
  }) : assert((iconAsset == null) != (icon == null));

  final String title;

  /// What the emblem shows: an image, or else a Material [icon].
  final String? iconAsset;
  final IconData? icon;

  final String heading;
  final String subheading;

  /// Shown in bold on its own line under [subheading], such as the email a
  /// code was sent to.
  final String? subheadingEmphasis;

  /// Index of this screen in [FlowSteps.labels]; null for a screen outside
  /// the Forgot Password flow, which then has no step bar.
  final int? step;

  final List<Widget> children;

  static const double horizontalPadding = 24;

  /// Whether the screen is short enough that the layout tightens up so the
  /// whole form fits without scrolling.
  static bool isCompact(BuildContext context) =>
      MediaQuery.sizeOf(context).height < 780;

  @override
  State<VerificationScaffold> createState() => _VerificationScaffoldState();
}

class _VerificationScaffoldState extends State<VerificationScaffold>
    with SingleTickerProviderStateMixin {
  static const double _sheetRadius = 32;

  late final AnimationController _entrance = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 550),
  );
  late final Animation<double> _heroFade = CurvedAnimation(
    parent: _entrance,
    curve: const Interval(0, 0.7, curve: Curves.easeOut),
  );
  late final Animation<Offset> _sheetSlide = Tween<Offset>(
    begin: const Offset(0, 0.15),
    end: Offset.zero,
  ).animate(CurvedAnimation(parent: _entrance, curve: Curves.easeOutCubic));

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _entrance.value = 1;
    } else if (_entrance.isDismissed) {
      _entrance.forward();
    }
  }

  @override
  void dispose() {
    _entrance.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.darkGreen,
        body: SafeArea(
          bottom: false,
          child: LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                child: ConstrainedBox(
                  constraints: BoxConstraints(minHeight: constraints.maxHeight),
                  child: IntrinsicHeight(
                    child: Column(
                      children: [
                        _buildTopBar(context),
                        Expanded(
                          child: FadeTransition(
                            opacity: _heroFade,
                            alwaysIncludeSemantics: true,
                            child: Center(child: _buildHero()),
                          ),
                        ),
                        SlideTransition(
                          position: _sheetSlide,
                          child: _buildSheet(context),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Back',
            onPressed: () => Navigator.of(context).maybePop(),
            style: IconButton.styleFrom(
              backgroundColor: AppColors.white.withValues(alpha: 0.12),
              foregroundColor: AppColors.white,
            ),
            icon: const Icon(Icons.arrow_back_rounded),
          ),
          Expanded(
            child: Text(
              widget.title,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: appTextStyle(
                fontSize: 18,
                weight: FontWeight.w700,
                color: AppColors.white,
              ),
            ),
          ),
          // Balances the back button so the title stays centred.
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _buildHero() {
    final subheadingStyle = appTextStyle(
      fontSize: 14,
      lineHeight: 20,
      weight: FontWeight.w400,
      color: AppColors.white.withValues(alpha: 0.75),
    );
    final emphasis = widget.subheadingEmphasis;
    final compact = VerificationScaffold.isCompact(context);

    return Padding(
      padding: EdgeInsets.fromLTRB(32, 12, 32, compact ? 20 : 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          PulsingEmblem(iconAsset: widget.iconAsset, icon: widget.icon),
          const SizedBox(height: 20),
          Text(
            widget.heading,
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 28,
              lineHeight: 34,
              weight: FontWeight.w800,
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text.rich(
            TextSpan(
              text: widget.subheading,
              children: [
                if (emphasis != null)
                  TextSpan(
                    text: '\n$emphasis',
                    style: subheadingStyle.copyWith(
                      color: AppColors.white,
                      fontWeight: FontWeight.w700,
                      fontVariations: const [FontVariation.weight(700)],
                    ),
                  ),
              ],
            ),
            textAlign: TextAlign.center,
            style: subheadingStyle,
          ),
        ],
      ),
    );
  }

  Widget _buildSheet(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;
    final gap = VerificationScaffold.isCompact(context) ? 24.0 : 36.0;
    final step = widget.step;

    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(
        VerificationScaffold.horizontalPadding,
        gap,
        VerificationScaffold.horizontalPadding,
        32 + bottomInset,
      ),
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(_sheetRadius)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (step != null) ...[
            FlowSteps(current: step),
            SizedBox(height: gap),
          ],
          ...widget.children,
        ],
      ),
    );
  }
}

/// An icon in a green disc that sends out rings like a signal, for as long
/// as it is on screen.
class PulsingEmblem extends StatefulWidget {
  const PulsingEmblem({super.key, this.iconAsset, this.icon})
    : assert((iconAsset == null) != (icon == null));

  /// What the disc shows: an image, or else a Material [icon].
  final String? iconAsset;
  final IconData? icon;

  @override
  State<PulsingEmblem> createState() => _PulsingEmblemState();
}

class _PulsingEmblemState extends State<PulsingEmblem>
    with SingleTickerProviderStateMixin {
  static const int _rippleCount = 3;

  /// One cycle sends out every ring.
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 3600),
  );

  /// Short phones get a smaller emblem so the whole form fits on screen.
  bool get _compact => VerificationScaffold.isCompact(context);

  /// The green disc, and the circle its rings spread out to.
  double get _discSize => _compact ? 100 : 116;
  double get _emblemSize => _compact ? 176 : 212;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      // A still frame that shows the rings mid-way out.
      _pulse
        ..stop()
        ..value = 0.15;
    } else if (!_pulse.isAnimating) {
      _pulse.repeat();
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final disc = Container(
      width: _discSize,
      height: _discSize,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.green,
        boxShadow: [
          BoxShadow(
            color: AppColors.green.withValues(alpha: 0.5),
            blurRadius: 32,
          ),
        ],
      ),
      child: widget.iconAsset != null
          ? Image.asset(
              widget.iconAsset!,
              width: _discSize * 0.52,
              height: _discSize * 0.52,
            )
          : Icon(widget.icon, size: _discSize * 0.5, color: AppColors.white),
    );

    return SizedBox.square(
      dimension: _emblemSize,
      child: AnimatedBuilder(
        animation: _pulse,
        builder: (context, child) {
          return Stack(
            alignment: Alignment.center,
            children: [
              for (var i = 0; i < _rippleCount; i++)
                _buildRipple((_pulse.value + i / _rippleCount) % 1),
              // The disc beats once as each ring leaves it.
              Transform.scale(
                scale:
                    1 +
                    0.04 *
                        Curves.easeOut.transform(
                          1 - (_pulse.value * _rippleCount % 1),
                        ),
                child: child,
              ),
            ],
          );
        },
        child: disc,
      ),
    );
  }

  /// One ring, [progress] of the way from the disc's edge to the emblem's.
  Widget _buildRipple(double progress) {
    final grow = Curves.easeOut.transform(progress);
    final size = _discSize + (_emblemSize - _discSize) * grow;
    final alpha = 1 - progress;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.green.withValues(alpha: 0.18 * alpha),
        border: Border.all(
          color: AppColors.white.withValues(alpha: 0.35 * alpha),
          width: 1.5,
        ),
      ),
    );
  }
}

/// Where a screen sits in the flow: email, then code, then password.
///
/// Steps before [current] are marked done.
class FlowSteps extends StatelessWidget {
  const FlowSteps({super.key, required this.current});

  final int current;

  static const List<String> labels = ['Email', 'Code', 'Password'];

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Step ${current + 1} of ${labels.length}',
      child: ExcludeSemantics(
        child: Row(
          children: [
            for (var i = 0; i < labels.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(child: _buildStep(i)),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStep(int i) {
    final done = i < current;
    final reached = i <= current;
    final color = reached ? AppColors.green : AppColors.mutedText;

    return Column(
      children: [
        Container(
          height: 4,
          decoration: BoxDecoration(
            color: reached ? AppColors.green : AppColors.outline,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (done) ...[
              Icon(Icons.check_rounded, size: 14, color: color),
              const SizedBox(width: 3),
            ],
            Text(
              labels[i],
              style: appTextStyle(
                fontSize: 12,
                weight: i == current ? FontWeight.w700 : FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

/// Full-width primary button of the verification screens.
///
/// While not [active] it is dimmed but still tappable, so a tap can reveal
/// why the form cannot be submitted yet. While [busy] it shows a spinner in
/// place of [label].
class VerificationButton extends StatelessWidget {
  const VerificationButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.active = true,
    this.busy = false,
  });

  final String label;
  final VoidCallback onPressed;
  final bool active;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: onPressed,
        style: FilledButton.styleFrom(
          backgroundColor: active || busy
              ? AppColors.darkGreen
              : AppColors.darkGreen.withValues(alpha: 0.5),
          foregroundColor: AppColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: appTextStyle(
            fontSize: 16,
            weight: FontWeight.w700,
            color: AppColors.white,
          ),
        ),
        child: busy
            ? SizedBox.square(
                dimension: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.white,
                  semanticsLabel: label,
                ),
              )
            : Text(label),
      ),
    );
  }
}

/// Small grey hint with an icon, at the foot of a verification sheet.
class VerificationNote extends StatelessWidget {
  const VerificationNote({super.key, required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 16, color: AppColors.mutedText),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            style: appTextStyle(
              fontSize: 12,
              weight: FontWeight.w500,
              color: AppColors.mutedText,
            ),
          ),
        ),
      ],
    );
  }
}

/// Bold label above an input on a verification sheet, in the colour of the
/// [VerificationButton].
class VerificationLabel extends StatelessWidget {
  const VerificationLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: appTextStyle(
        fontSize: 14,
        weight: FontWeight.w700,
        color: AppColors.darkGreen,
      ),
    );
  }
}
