import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

const List<BoxShadow> pairingCardShadow = [
  BoxShadow(color: Color(0x2E1A1A1A), offset: Offset(0, 6), blurRadius: 8),
  BoxShadow(color: Color(0x0F1A1A1A), offset: Offset(0, 1), blurRadius: 1),
];

/// Layout shared by the three pairing steps: title, connection status and
/// progress bars on top, a scrolling [body], and one button at the bottom.
class PairingScaffold extends StatelessWidget {
  const PairingScaffold({
    super.key,
    required this.step,
    required this.connected,
    required this.body,
    required this.buttonLabel,
    required this.onButtonPressed,
    this.buttonActive = true,
  });

  final int step;
  final bool connected;
  final Widget body;
  final String buttonLabel;
  final VoidCallback onButtonPressed;

  /// While false the button is dimmed but still tappable, like [AuthButton].
  final bool buttonActive;

  static const int stepCount = 3;

  // Sizes below are taken from the 390x844 Figma frames.
  static const double horizontalPadding = 30;

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.white,
        body: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: horizontalPadding,
                ),
                child: body,
              ),
            ),
            _buildFooter(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      height: 150,
      margin: const EdgeInsets.symmetric(horizontal: 10),
      padding: const EdgeInsets.fromLTRB(13, 57, 10, 0),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.outline)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: Alignment.centerLeft,
                      child: Text(
                        'Smart Cap Pairing',
                        maxLines: 1,
                        style: appTextStyle(
                          fontSize: 24,
                          lineHeight: 26,
                          weight: FontWeight.w800,
                          color: AppColors.darkGreen,
                        ),
                      ),
                    ),
                    Text(
                      'Step $step of $stepCount',
                      style: appTextStyle(
                        fontSize: 16,
                        lineHeight: 26,
                        weight: FontWeight.w600,
                        color: const Color(0xFF787878),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              _StatusChip(connected: connected),
            ],
          ),
          const SizedBox(height: 15),
          Padding(
            padding: const EdgeInsets.only(left: 7, right: 10),
            child: Row(
              spacing: 6,
              children: [
                for (var i = 1; i <= stepCount; i++)
                  Expanded(
                    child: Container(
                      height: 6,
                      decoration: BoxDecoration(
                        color: i <= step ? AppColors.green : AppColors.outline,
                        borderRadius: BorderRadius.circular(3),
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

  Widget _buildFooter() {
    return Container(
      height: 135,
      padding: const EdgeInsets.fromLTRB(
        horizontalPadding,
        22,
        horizontalPadding,
        0,
      ),
      alignment: Alignment.topCenter,
      decoration: const BoxDecoration(
        color: AppColors.white,
        border: Border(top: BorderSide(color: AppColors.outline)),
      ),
      child: SizedBox(
        width: double.infinity,
        height: 56,
        child: FilledButton(
          onPressed: onButtonPressed,
          style: FilledButton.styleFrom(
            backgroundColor: buttonActive
                ? AppColors.darkGreen
                : AppColors.darkGreen.withValues(alpha: 0.5),
            foregroundColor: AppColors.white,
            padding: EdgeInsets.zero,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            textStyle: appTextStyle(
              fontSize: 16,
              weight: FontWeight.w700,
              color: AppColors.white,
            ),
          ),
          child: Text(buttonLabel),
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({required this.connected});

  final bool connected;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 106,
      height: 25,
      decoration: BoxDecoration(
        color: connected ? const Color(0x8059BD82) : const Color(0xFFE5E5E5),
        borderRadius: BorderRadius.circular(50),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            connected
                ? 'assets/images/bluetooth_connected.png'
                : 'assets/images/bluetooth.png',
            width: 17,
            height: 17,
          ),
          Flexible(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                connected ? 'CONNECTED' : 'DISCONNECTED',
                style: appTextStyle(
                  fontSize: 9,
                  weight: FontWeight.w700,
                  color: connected
                      ? AppColors.darkGreen
                      : const Color(0xFF6E6E6E),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Instruction row on the first pairing step.
class PairingTipCard extends StatelessWidget {
  const PairingTipCard({
    super.key,
    required this.iconAsset,
    required this.title,
    required this.description,
  });

  final String iconAsset;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minHeight: 76),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border.all(color: AppColors.outline),
        borderRadius: BorderRadius.circular(16),
        boxShadow: pairingCardShadow,
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: AppColors.mint,
              borderRadius: BorderRadius.circular(8),
            ),
            child: SvgPicture.asset(iconAsset, width: 20, height: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: appTextStyle(
                    fontSize: 15,
                    lineHeight: 22.5,
                    weight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                Text(
                  description,
                  style: appTextStyle(
                    fontSize: 13,
                    lineHeight: 19.5,
                    weight: FontWeight.w500,
                    color: AppColors.bodyText,
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

/// Bluetooth button with rings that keep spreading out while scanning.
class ScanningPulse extends StatefulWidget {
  const ScanningPulse({super.key});

  @override
  State<ScanningPulse> createState() => _ScanningPulseState();
}

class _ScanningPulseState extends State<ScanningPulse>
    with SingleTickerProviderStateMixin {
  static const double _size = 112;
  static const double _maxRingSize = 220;
  static const int _ringCount = 3;

  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 2400),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: _size,
      height: _size,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.center,
        children: [
          IgnorePointer(
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) => Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  for (var i = 0; i < _ringCount; i++)
                    _buildRing((_controller.value + i / _ringCount) % 1),
                ],
              ),
            ),
          ),
          Container(
            width: 64,
            height: 64,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: AppColors.darkGreen,
              shape: BoxShape.circle,
            ),
            child: SvgPicture.asset(
              'assets/icons/bluetooth_white.svg',
              width: 32,
              height: 32,
            ),
          ),
        ],
      ),
    );
  }

  /// A ring [progress] (0 to 1) of the way through growing and fading out.
  Widget _buildRing(double progress) {
    final size = _size + (_maxRingSize - _size) * progress;
    return OverflowBox(
      maxWidth: _maxRingSize,
      maxHeight: _maxRingSize,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: AppColors.green.withValues(alpha: 0.4 * (1 - progress)),
            width: 2,
          ),
        ),
      ),
    );
  }
}

/// A device found while scanning.
class PairingDevice {
  const PairingDevice({
    required this.name,
    required this.description,
    required this.signalBars,
    this.isSmartCap = true,
  });

  final String name;
  final String description;

  /// Signal strength, 1 to 4.
  final int signalBars;
  final bool isSmartCap;
}

/// Selectable row for a device found while scanning.
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

  static const List<double> _barHeights = [9, 13, 17, 21];

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      selected: selected,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 80),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
            color: AppColors.white,
            border: Border.all(
              color: selected ? AppColors.green : AppColors.outline,
              width: 2,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: selected ? AppColors.darkGreen : AppColors.surfaceGrey,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: SvgPicture.asset(
                  selected
                      ? 'assets/icons/cap_white.svg'
                      : 'assets/icons/cap_grey.svg',
                  width: 24,
                  height: 24,
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
                        lineHeight: 24,
                        weight: FontWeight.w800,
                        color: AppColors.ink,
                      ),
                    ),
                    Text(
                      device.description,
                      style: appTextStyle(
                        fontSize: 13,
                        lineHeight: 19.5,
                        weight: FontWeight.w600,
                        color: AppColors.mutedText,
                      ),
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
              const SizedBox(width: 2),
            ],
          ),
        ),
      ),
    );
  }
}

/// Label/value table shown once the cap is connected.
class PairingSummaryCard extends StatelessWidget {
  const PairingSummaryCard({super.key, required this.rows});

  /// Label and value of each row, top to bottom.
  final List<(String, String)> rows;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border.all(color: AppColors.outline),
        borderRadius: BorderRadius.circular(16),
        boxShadow: pairingCardShadow,
      ),
      child: Column(
        children: [
          for (var i = 0; i < rows.length; i++)
            Container(
              constraints: const BoxConstraints(minHeight: 51),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: BoxDecoration(
                border: i == 0
                    ? null
                    : const Border(top: BorderSide(color: AppColors.outline)),
              ),
              child: Row(
                children: [
                  Text(
                    rows[i].$1,
                    style: appTextStyle(
                      fontSize: 14,
                      lineHeight: 21,
                      weight: FontWeight.w600,
                      color: AppColors.bodyText,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      rows[i].$2,
                      textAlign: TextAlign.end,
                      style: appTextStyle(
                        fontSize: 15,
                        lineHeight: 22.5,
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

/// Asks the user to turn Bluetooth on (Figma node 466:873).
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

  static const Color _text = Color(0xFF000000);

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFFDFE5DB),
      insetPadding: const EdgeInsets.symmetric(horizontal: 35, vertical: 24),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(26),
        side: BorderSide(color: _text.withValues(alpha: 0.2), width: 0.8),
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 320),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: Color(0xFFEDF2EA),
                  shape: BoxShape.circle,
                ),
                child: SvgPicture.asset(
                  'assets/icons/bluetooth_off.svg',
                  width: 30,
                  height: 30,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Your device is not connected to Bluetooth',
                textAlign: TextAlign.center,
                style: appTextStyle(
                  fontSize: 18,
                  lineHeight: 28,
                  weight: FontWeight.w700,
                  color: _text,
                ),
              ),
              const SizedBox(height: 11),
              Text(
                'Turn on Bluetooth so your cap can connect to your mobile '
                'for vitals, location, and SOS alerts.',
                textAlign: TextAlign.center,
                style: appTextStyle(
                  fontSize: 14,
                  lineHeight: 20,
                  weight: FontWeight.w400,
                  color: _text.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 21),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(true),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.darkGreen,
                    foregroundColor: AppColors.white,
                    shape: const StadiumBorder(),
                    textStyle: appTextStyle(
                      fontSize: 14,
                      weight: FontWeight.w700,
                      color: AppColors.white,
                    ),
                  ),
                  child: const Text('Turn on Bluetooth'),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                height: 49.6,
                child: OutlinedButton(
                  onPressed: () => Navigator.of(context).pop(false),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: _text.withValues(alpha: 0.75),
                    shape: const StadiumBorder(),
                    side: BorderSide(
                      color: _text.withValues(alpha: 0.25),
                      width: 0.8,
                    ),
                    textStyle: appTextStyle(
                      fontSize: 14,
                      weight: FontWeight.w700,
                      color: _text,
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
