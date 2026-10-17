import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/features/pairing/pairing_widgets.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Smart Cap pairing, steps 1 to 3 (Figma nodes 542:437, 546:451, 546:495).
///
/// This is a demonstration only: Bluetooth is never touched, and the devices
/// "found" while scanning are [demoDevices]. [onDone] is called with the name
/// of the paired cap when the user leaves the last step.
class PairingScreen extends StatefulWidget {
  const PairingScreen({super.key, this.onDone});

  final ValueChanged<String>? onDone;

  /// Stand-ins for scan results until real pairing exists.
  static const List<PairingDevice> demoDevices = [
    PairingDevice(
      name: 'CAP-001',
      description: 'CAPartner Smart Cap',
      signalBars: 4,
    ),
    PairingDevice(
      name: 'CAP-014',
      description: 'CAPartner Smart Cap',
      signalBars: 2,
    ),
    PairingDevice(
      name: 'BLE-9F2',
      description: 'Unknown BLE Device',
      signalBars: 1,
      isSmartCap: false,
    ),
  ];

  /// Delay before each demo device shows up in the list.
  static const Duration deviceFoundInterval = Duration(milliseconds: 900);
  static const Duration pairingDuration = Duration(milliseconds: 1500);

  @override
  State<PairingScreen> createState() => _PairingScreenState();
}

class _PairingScreenState extends State<PairingScreen> {
  int _step = 1;
  bool _bluetoothOn = false;

  final List<PairingDevice> _foundDevices = [];
  PairingDevice? _selected;
  String? _error;
  bool _pairing = false;

  Timer? _scanTimer;
  Timer? _pairTimer;

  @override
  void dispose() {
    _scanTimer?.cancel();
    _pairTimer?.cancel();
    super.dispose();
  }

  Future<void> _startScanning() async {
    if (!_bluetoothOn) {
      final turnedOn = await showBluetoothDialog(context);
      if (!turnedOn || !mounted) return;
      _bluetoothOn = true;
    }
    setState(() {
      _step = 2;
      _foundDevices.clear();
      _selected = null;
      _error = null;
    });
    _scanTimer?.cancel();
    _scanTimer = Timer.periodic(PairingScreen.deviceFoundInterval, (timer) {
      setState(
        () =>
            _foundDevices.add(PairingScreen.demoDevices[_foundDevices.length]),
      );
      if (_foundDevices.length == PairingScreen.demoDevices.length) {
        timer.cancel();
      }
    });
  }

  void _backToStart() {
    _scanTimer?.cancel();
    _pairTimer?.cancel();
    setState(() {
      _step = 1;
      _pairing = false;
    });
  }

  void _select(PairingDevice device) {
    if (_pairing) return;
    setState(() {
      _selected = device;
      _error = null;
    });
  }

  void _pair() {
    final device = _selected;
    if (_pairing) return;
    if (device == null) {
      setState(
        () => _error = _foundDevices.isEmpty
            ? 'Still scanning. Please wait for your cap to appear.'
            : 'Select your Smart Cap from the list first.',
      );
      return;
    }
    if (!device.isSmartCap) {
      setState(() => _error = '${device.name} is not a CAPartner Smart Cap.');
      return;
    }
    _scanTimer?.cancel();
    setState(() => _pairing = true);
    _pairTimer = Timer(PairingScreen.pairingDuration, () {
      setState(() {
        _pairing = false;
        _step = 3;
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      // Back from the scan returns to the instructions instead of leaving.
      canPop: _step != 2,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _backToStart();
      },
      child: switch (_step) {
        1 => PairingScaffold(
          step: 1,
          connected: false,
          body: _buildInstructions(),
          buttonLabel: 'Start Scanning',
          onButtonPressed: _startScanning,
        ),
        2 => PairingScaffold(
          step: 2,
          connected: false,
          body: _buildScan(),
          buttonLabel: _pairing ? 'Pairing…' : 'Pair Device',
          buttonActive: _selected != null && !_pairing,
          onButtonPressed: _pair,
        ),
        _ => PairingScaffold(
          step: 3,
          connected: true,
          body: _buildConnected(),
          buttonLabel: 'Go To Dashboard',
          onButtonPressed: () => widget.onDone?.call(_selected!.name),
        ),
      },
    );
  }

  Widget _buildInstructions() {
    return Column(
      children: [
        const SizedBox(height: 46),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(28, 36, 28, 38),
          decoration: BoxDecoration(
            color: AppColors.paleMint,
            border: Border.all(
              color: AppColors.green.withValues(alpha: 0.3),
              width: 2,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              Container(
                width: 80,
                height: 80,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: AppColors.darkGreen,
                  shape: BoxShape.circle,
                ),
                child: SvgPicture.asset(
                  'assets/icons/cap_large.svg',
                  width: 40,
                  height: 40,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Turn on your Smart Cap',
                textAlign: TextAlign.center,
                style: appTextStyle(
                  fontSize: 22,
                  lineHeight: 33,
                  weight: FontWeight.w800,
                  color: AppColors.darkGreen,
                  letterSpacing: -0.55,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Press and hold the power button on the cap band until the '
                'LED blinks blue.',
                textAlign: TextAlign.center,
                style: appTextStyle(
                  fontSize: 15,
                  lineHeight: 20.625,
                  weight: FontWeight.w500,
                  color: AppColors.bodyText,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 26),
        const PairingTipCard(
          iconAsset: 'assets/icons/power.svg',
          title: 'Hold the power button 2 seconds',
          description: 'LED turns solid, then blinks blue.',
        ),
        const SizedBox(height: 12),
        const PairingTipCard(
          iconAsset: 'assets/icons/bluetooth_green.svg',
          title: 'Keep the cap within 1 meter',
          description: 'Pairing range is short for security.',
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildScan() {
    final scanning = _foundDevices.length < PairingScreen.demoDevices.length;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 24),
        const Center(child: ScanningPulse()),
        const SizedBox(height: 16),
        Center(
          child: Text(
            _pairing
                ? 'Pairing with ${_selected!.name}…'
                : scanning
                ? 'Scanning for nearby caps…'
                : 'Select your Smart Cap',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 15,
              lineHeight: 22.5,
              weight: FontWeight.w700,
              color: AppColors.ink,
            ),
          ),
        ),
        const SizedBox(height: 28),
        Text(
          'Available devices (${_foundDevices.length})',
          style: appTextStyle(
            fontSize: 12,
            lineHeight: 18,
            weight: FontWeight.w800,
            color: AppColors.mutedText,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 8),
        for (final device in _foundDevices) ...[
          PairingDeviceTile(
            device: device,
            selected: device == _selected,
            onTap: () => _select(device),
          ),
          const SizedBox(height: 10),
        ],
        AuthErrorText(message: _error, minHeight: 14),
      ],
    );
  }

  Widget _buildConnected() {
    final name = _selected!.name;

    return Column(
      children: [
        const SizedBox(height: 58),
        Container(
          width: 96,
          height: 96,
          alignment: Alignment.center,
          decoration: const BoxDecoration(
            color: AppColors.darkGreen,
            shape: BoxShape.circle,
          ),
          child: SvgPicture.asset(
            'assets/icons/check.svg',
            width: 56,
            height: 56,
          ),
        ),
        const SizedBox(height: 24),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            'Smart Cap connected',
            maxLines: 1,
            style: appTextStyle(
              fontSize: 26,
              lineHeight: 39,
              weight: FontWeight.w900,
              color: AppColors.ink,
              letterSpacing: -0.65,
            ),
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 18),
          child: Text(
            '$name is now streaming vitals to your station.',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 15,
              lineHeight: 22.5,
              weight: FontWeight.w500,
              color: AppColors.bodyText,
            ),
          ),
        ),
        const SizedBox(height: 32),
        PairingSummaryCard(
          rows: [
            ('Device', name),
            const ('Sensors', 'idle'),
            const ('Cap battery', '70%'),
            const ('Link', 'Bluetooth · Strong'),
          ],
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}
