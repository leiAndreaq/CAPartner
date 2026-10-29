import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/features/auth/widgets/verification_layout.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Layout shared by the three pairing steps, in the style of the sign-up
/// screens: title, connection status and step bar on green, an [emblem] with
/// the [heading], then a white sheet with the scrolling [body] and one button
/// pinned at its foot.
class PairingScaffold extends StatelessWidget {
  const PairingScaffold({
    super.key,
    required this.step,
    required this.connected,
    required this.emblem,
    required this.heading,
    required this.subheading,
    required this.body,
    required this.buttonLabel,
    required this.onButtonPressed,
    this.buttonActive = true,
    this.buttonBusy = false,
  });

  final int step;
  final bool connected;

  /// Shown above [heading] on green, usually a [PairingEmblem].
  final Widget emblem;
  final String heading;
  final String subheading;
  final Widget body;
  final String buttonLabel;
  final VoidCallback onButtonPressed;

  /// While false the button is dimmed but still tappable, so a tap can
  /// reveal why the step cannot go on yet.
  final bool buttonActive;

  /// Shows a spinner in the button while a step is under way.
  final bool buttonBusy;

  static const List<String> stepLabels = ['Power on', 'Scan', 'Connect'];
  static int get stepCount => stepLabels.length;

  static const double horizontalPadding = 24;
  static const double _sheetRadius = 32;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.darkGreen,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              _buildHeader(context),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: KeyedSubtree(
                  key: ValueKey(step),
                  child: _buildHero(context),
                ),
              ),
              Expanded(child: _buildSheet(context)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    // Back from the scan returns to the instructions; on the first step it
    // is only there when pairing was opened from another screen.
    final canGoBack = step == 2 || (step == 1 && Navigator.canPop(context));

    return Padding(
      padding: EdgeInsets.fromLTRB(canGoBack ? 8 : horizontalPadding, 8, 20, 0),
      child: SizedBox(
        height: 48,
        child: Row(
          children: [
            if (canGoBack) ...[
              IconButton(
                tooltip: 'Back',
                onPressed: () => Navigator.of(context).maybePop(),
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.white.withValues(alpha: 0.12),
                  foregroundColor: AppColors.white,
                ),
                icon: const Icon(Icons.arrow_back_rounded),
              ),
              const SizedBox(width: 8),
            ],
            Expanded(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Text(
                  'Smart Cap Pairing',
                  maxLines: 1,
                  style: appTextStyle(
                    fontSize: 20,
                    lineHeight: 26,
                    weight: FontWeight.w800,
                    color: AppColors.white,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            _StatusChip(connected: connected),
          ],
        ),
      ),
    );
  }

  Widget _buildHero(BuildContext context) {
    final compact = VerificationScaffold.isCompact(context);

    return Padding(
      padding: EdgeInsets.fromLTRB(32, compact ? 8 : 16, 32, compact ? 16 : 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          emblem,
          SizedBox(height: compact ? 10 : 14),
          Text(
            heading,
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 24,
              lineHeight: 30,
              weight: FontWeight.w800,
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subheading,
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 14,
              lineHeight: 20,
              weight: FontWeight.w400,
              color: AppColors.white.withValues(alpha: 0.75),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSheet(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(_sheetRadius)),
      ),
      child: Column(
        children: [
          _buildProgress(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(
                horizontalPadding,
                20,
                horizontalPadding,
                16,
              ),
              child: body,
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              horizontalPadding,
              8,
              horizontalPadding,
              20 + bottomInset,
            ),
            child: _buildButton(),
          ),
        ],
      ),
    );
  }

  /// "Step N of 3" and the step bar, fixed at the top of the sheet above a
  /// thin divider.
  Widget _buildProgress() {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        horizontalPadding,
        22,
        horizontalPadding,
        16,
      ),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.outline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Step $step of $stepCount',
            style: appTextStyle(
              fontSize: 15,
              lineHeight: 20,
              weight: FontWeight.w800,
              color: AppColors.darkGreen,
            ),
          ),
          const SizedBox(height: 10),
          _StepBar(current: step),
        ],
      ),
    );
  }

  Widget _buildButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: onButtonPressed,
        style: FilledButton.styleFrom(
          backgroundColor: buttonActive || buttonBusy
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
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (buttonBusy) ...[
              const SizedBox.square(
                dimension: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.white,
                ),
              ),
              const SizedBox(width: 12),
            ],
            Text(buttonLabel),
          ],
        ),
      ),
    );
  }
}

/// Three bars with a label each; steps up to [current] are lit.
class _StepBar extends StatelessWidget {
  const _StepBar({required this.current});

  /// 1-based, like [PairingScaffold.step].
  final int current;

  @override
  Widget build(BuildContext context) {
    final labels = PairingScaffold.stepLabels;

    return ExcludeSemantics(
      child: Row(
        children: [
          for (var i = 0; i < labels.length; i++) ...[
            if (i > 0) const SizedBox(width: 8),
            Expanded(child: _buildStep(i)),
          ],
        ],
      ),
    );
  }

  Widget _buildStep(int i) {
    final step = i + 1;
    final done = step < current;
    final reached = step <= current;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          height: 4,
          decoration: BoxDecoration(
            color: reached ? AppColors.green : AppColors.outline,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 6),
        Row(
          children: [
            if (done) ...[
              const Icon(Icons.check_rounded, size: 13, color: AppColors.green),
              const SizedBox(width: 3),
            ],
            Flexible(
              child: Text(
                PairingScaffold.stepLabels[i],
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: appTextStyle(
                  fontSize: 12,
                  weight: step == current ? FontWeight.w700 : FontWeight.w500,
                  color: reached ? AppColors.green : AppColors.mutedText,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.connected});

  final bool connected;

  @override
  Widget build(BuildContext context) {
    final color = connected
        ? AppColors.white
        : AppColors.white.withValues(alpha: 0.75);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: connected
            ? AppColors.green
            : AppColors.white.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(50),
        border: Border.all(
          color: AppColors.white.withValues(alpha: connected ? 0.3 : 0.15),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            connected
                ? Icons.bluetooth_connected_rounded
                : Icons.bluetooth_disabled_rounded,
            size: 14,
            color: color,
          ),
          const SizedBox(width: 4),
          Text(
            connected ? 'CONNECTED' : 'DISCONNECTED',
            style: appTextStyle(
              fontSize: 10,
              weight: FontWeight.w700,
              color: color,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}

/// An icon in a glowing green disc on the pairing header. While [scanning]
/// it sends out rings like a radar; otherwise it pops in once and stays
/// still.
class PairingEmblem extends StatefulWidget {
  const PairingEmblem({
    super.key,
    required this.svgAsset,
    this.scanning = false,
  });

  /// Drawn in white.
  final String svgAsset;
  final bool scanning;

  @override
  State<PairingEmblem> createState() => _PairingEmblemState();
}

class _PairingEmblemState extends State<PairingEmblem>
    with TickerProviderStateMixin {
  static const int _ringCount = 3;

  late final AnimationController _rings = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  );
  late final AnimationController _popIn = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 500),
  );

  bool get _compact => VerificationScaffold.isCompact(context);
  double get _discSize => _compact ? 76 : 88;
  double get _areaSize => _compact ? 128 : 152;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _sync();
  }

  @override
  void didUpdateWidget(PairingEmblem oldWidget) {
    super.didUpdateWidget(oldWidget);
    _sync();
  }

  void _sync() {
    final still = MediaQuery.disableAnimationsOf(context);
    if (still) {
      _popIn.value = 1;
    } else if (_popIn.isDismissed) {
      _popIn.forward();
    }
    if (widget.scanning && !still) {
      if (!_rings.isAnimating) _rings.repeat();
    } else {
      _rings
        ..stop()
        ..value = 0;
    }
  }

  @override
  void dispose() {
    _rings.dispose();
    _popIn.dispose();
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
        border: Border.all(
          color: AppColors.white.withValues(alpha: 0.2),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.green.withValues(alpha: 0.6),
            blurRadius: 36,
          ),
        ],
      ),
      child: SvgPicture.asset(
        widget.svgAsset,
        width: _discSize * 0.5,
        height: _discSize * 0.5,
        colorFilter: const ColorFilter.mode(AppColors.white, BlendMode.srcIn),
      ),
    );

    return SizedBox.square(
      dimension: _areaSize,
      child: AnimatedBuilder(
        animation: Listenable.merge([_rings, _popIn]),
        builder: (context, child) {
          return Stack(
            alignment: Alignment.center,
            children: [
              // A faint halo so the still emblem is not bare.
              Container(
                width: _discSize + 28,
                height: _discSize + 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.white.withValues(alpha: 0.06),
                ),
              ),
              if (widget.scanning)
                for (var i = 0; i < _ringCount; i++)
                  _buildRing((_rings.value + i / _ringCount) % 1),
              Transform.scale(
                scale: Curves.easeOutBack.transform(_popIn.value),
                child: child,
              ),
            ],
          );
        },
        child: disc,
      ),
    );
  }

  /// A ring [progress] (0 to 1) of the way through growing and fading out.
  Widget _buildRing(double progress) {
    final grow = Curves.easeOut.transform(progress);
    final size = _discSize + (_areaSize - _discSize) * grow;
    final alpha = 1 - progress;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.green.withValues(alpha: 0.15 * alpha),
        border: Border.all(
          color: AppColors.white.withValues(alpha: 0.4 * alpha),
          width: 1.5,
        ),
      ),
    );
  }
}

/// Small spaced-out caption above a group on the pairing sheet.
class PairingSectionLabel extends StatelessWidget {
  const PairingSectionLabel(this.text, {super.key, this.trailing});

  final String text;

  /// Shown at the end of the row, such as a spinner while scanning.
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            text,
            style: appTextStyle(
              fontSize: 12,
              lineHeight: 18,
              weight: FontWeight.w800,
              color: AppColors.mutedText,
              letterSpacing: 1.2,
            ),
          ),
        ),
        ?trailing,
      ],
    );
  }
}

/// Numbered instruction row on the first pairing step.
class PairingTipCard extends StatelessWidget {
  const PairingTipCard({
    super.key,
    required this.number,
    required this.icon,
    required this.title,
    required this.description,
  });

  final int number;
  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.paleMint,
        border: Border.all(color: AppColors.mint, width: 1.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.mint),
            ),
            child: Icon(icon, size: 24, color: AppColors.green),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: appTextStyle(
                    fontSize: 15,
                    lineHeight: 21,
                    weight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  description,
                  style: appTextStyle(
                    fontSize: 13,
                    lineHeight: 18,
                    weight: FontWeight.w500,
                    color: AppColors.bodyText,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.darkGreen,
              shape: BoxShape.circle,
            ),
            child: Text(
              '$number',
              style: appTextStyle(
                fontSize: 12,
                weight: FontWeight.w800,
                color: AppColors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// A device found while scanning.
class PairingDevice {
  const PairingDevice({
    required this.id,
    required this.name,
    required this.description,
    required this.signalBars,
    this.isSmartCap = true,
  });

  /// The phone's identifier for the device (its Bluetooth address).
  final String id;
  final String name;
  final String description;

  /// Signal strength, 1 to 4.
  final int signalBars;
  final bool isSmartCap;
}

/// Selectable row for a device found while scanning. It slides in when it
/// first appears.
class PairingDeviceTile extends StatelessWidget {
  const PairingDeviceTile({
    super.key,
    required this.device,
    required this.selected,
    required this.onTap,
  });

  final PairingDevice device;
  final bool selected;
  final VoidCallback onTap;

  static const List<double> _barHeights = [7, 11, 15, 19];

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0, end: 1),
      duration: MediaQuery.disableAnimationsOf(context)
          ? Duration.zero
          : const Duration(milliseconds: 350),
      curve: Curves.easeOutCubic,
      builder: (context, t, child) => Opacity(
        opacity: t,
        child: Transform.translate(
          offset: Offset(0, 12 * (1 - t)),
          child: child,
        ),
      ),
      child: _buildTile(),
    );
  }

  Widget _buildTile() {
    return Semantics(
      button: true,
      selected: selected,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: selected ? AppColors.paleMint : AppColors.white,
            border: Border.all(
              color: selected ? AppColors.green : AppColors.outline,
              width: selected ? 2 : 1.5,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected ? AppColors.darkGreen : AppColors.surfaceGrey,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: SvgPicture.asset(
                  'assets/icons/smart_cap.svg',
                  width: 26,
                  height: 26,
                  colorFilter: ColorFilter.mode(
                    selected ? AppColors.white : AppColors.bodyText,
                    BlendMode.srcIn,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      device.name,
                      style: appTextStyle(
                        fontSize: 16,
                        lineHeight: 22,
                        weight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (device.isSmartCap) ...[
                          const Icon(
                            Icons.verified_rounded,
                            size: 13,
                            color: AppColors.green,
                          ),
                          const SizedBox(width: 4),
                        ],
                        Flexible(
                          child: Text(
                            device.description,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: appTextStyle(
                              fontSize: 13,
                              lineHeight: 18,
                              weight: FontWeight.w600,
                              color: AppColors.mutedText,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              ExcludeSemantics(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  spacing: 3,
                  children: [
                    for (var i = 0; i < _barHeights.length; i++)
                      Container(
                        width: 4,
                        height: _barHeights[i],
                        decoration: BoxDecoration(
                          color: i < device.signalBars
                              ? AppColors.green
                              : AppColors.outline,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 200),
                transitionBuilder: (child, animation) =>
                    ScaleTransition(scale: animation, child: child),
                child: Icon(
                  selected
                      ? Icons.check_circle_rounded
                      : Icons.radio_button_unchecked_rounded,
                  key: ValueKey(selected),
                  size: 22,
                  color: selected ? AppColors.green : AppColors.outline,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Row with a spinner shown under the found devices while the scan goes on.
class PairingSearchingRow extends StatelessWidget {
  const PairingSearchingRow({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.surfaceGrey,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const SizedBox.square(
            dimension: 18,
            child: CircularProgressIndicator(
              strokeWidth: 2.2,
              color: AppColors.green,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'Looking for more devices…',
              style: appTextStyle(
                fontSize: 13,
                weight: FontWeight.w600,
                color: AppColors.mutedText,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Icon, label and value table shown once the cap is connected.
class PairingSummaryCard extends StatelessWidget {
  const PairingSummaryCard({super.key, required this.rows});

  /// Icon, label and value of each row, top to bottom.
  final List<(IconData, String, String)> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.paleMint,
        border: Border.all(color: AppColors.mint, width: 1.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              decoration: BoxDecoration(
                border: i == 0
                    ? null
                    : const Border(top: BorderSide(color: AppColors.mint)),
              ),
              child: Row(
                children: [
                  Container(
                    width: 32,
                    height: 32,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: AppColors.white,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(rows[i].$1, size: 18, color: AppColors.green),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    rows[i].$2,
                    style: appTextStyle(
                      fontSize: 14,
                      lineHeight: 20,
                      weight: FontWeight.w600,
                      color: AppColors.bodyText,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      rows[i].$3,
                      textAlign: TextAlign.end,
                      style: appTextStyle(
                        fontSize: 14,
                        lineHeight: 20,
                        weight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Asks the user to turn Bluetooth on.
///
/// Resolves to true when they agree.
Future<bool> showBluetoothDialog(BuildContext context) async {
  final turnOn = await showDialog<bool>(
    context: context,
    builder: (context) => const _BluetoothDialog(),
  );
  return turnOn ?? false;
}

class _BluetoothDialog extends StatelessWidget {
  const _BluetoothDialog();

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppColors.white,
      surfaceTintColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 340),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: SvgPicture.asset(
                  'assets/icons/bluetooth_off.svg',
                  width: 32,
                  height: 32,
                ),
              ),
              const SizedBox(height: 18),
              Text(
                'Bluetooth is off',
                textAlign: TextAlign.center,
                style: appTextStyle(
                  fontSize: 20,
                  lineHeight: 26,
                  weight: FontWeight.w800,
                  color: AppColors.ink,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Turn on Bluetooth so your cap can connect to your mobile '
                'for vitals, location, and SOS alerts.',
                textAlign: TextAlign.center,
                style: appTextStyle(
                  fontSize: 14,
                  lineHeight: 20,
                  weight: FontWeight.w400,
                  color: AppColors.bodyText,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton.icon(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.darkGreen,
                    foregroundColor: AppColors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    textStyle: appTextStyle(
                      fontSize: 15,
                      weight: FontWeight.w700,
                      color: AppColors.white,
                    ),
                  ),
                  icon: const Icon(Icons.bluetooth_rounded, size: 20),
                  label: const Text('Turn on Bluetooth'),
                ),
              ),
              const SizedBox(height: 4),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: TextButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.mutedText,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    textStyle: appTextStyle(
                      fontSize: 14,
                      weight: FontWeight.w700,
                      color: AppColors.mutedText,
                    ),
                  ),
                  child: const Text('No thanks'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
