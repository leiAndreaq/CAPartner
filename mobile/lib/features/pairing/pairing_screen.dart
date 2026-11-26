import 'dart:async';

import 'package:flutter/material.dart';

import 'package:capartner/features/auth/widgets/auth_widgets.dart';
import 'package:capartner/features/auth/widgets/verification_layout.dart';
import 'package:capartner/features/pairing/cap_radio.dart';
import 'package:capartner/features/pairing/pairing_widgets.dart';
import 'package:capartner/features/pairing/phone_bluetooth.dart';

/// Smart Cap pairing in three steps: turn the cap on, scan and pick it, then
/// the connected summary.
///
/// The phone's Bluetooth is switched on (after Android's prompt), [radio]
/// scans for caps and connects to the one picked, and stays connected after.
/// [onDone] is called with the name of the paired cap when the user leaves
/// the last step.
class PairingScreen extends StatefulWidget {
  const PairingScreen({
    super.key,
    required this.radio,
    required this.assignedCap,
    this.onUnauthorized,
    this.onDone,
    this.bluetooth = const PhoneBluetooth(),
  });

  final CapRadio radio;

  /// Code of the cap the admin assigned to the logged-in enforcer; empty
  /// when none. Any other cap is refused.
  final String assignedCap;

  /// Called with the name of a cap the user tried to pair that is not theirs,
  /// so the attempt can be logged and reported to the admin.
  final ValueChanged<String>? onUnauthorized;
  final ValueChanged<String>? onDone;
  final PhoneBluetooth bluetooth;

  @override
  State<PairingScreen> createState() => _PairingScreenState();
}

class _PairingScreenState extends State<PairingScreen> {
  int _step = 1;

  /// Shown on the first step when Bluetooth stays off.
  String? _bluetoothError;

  final List<PairingDevice> _foundDevices = [];
  PairingDevice? _selected;
  String? _error;
  bool _pairing = false;

  StreamSubscription<PairingDevice>? _scan;
  bool _scanning = false;

  @override
  void dispose() {
    _scan?.cancel();
    super.dispose();
  }

  Future<void> _startScanning() async {
    setState(() => _bluetoothError = null);
    if (!await widget.bluetooth.isOn()) {
      if (!mounted) return;
      final turnOn = await showBluetoothDialog(context);
      if (!turnOn || !mounted) return;
      final request = await widget.bluetooth.turnOn();
      if (!mounted) return;
      // Where Bluetooth cannot be switched on for the user, the scan goes
      // ahead and says so if it fails.
      if (request == BluetoothRequest.declined) {
        setState(
          () => _bluetoothError =
              'Bluetooth is still off. Turn it on to pair your cap.',
        );
        return;
      }
    }
    setState(() => _step = 2);
    _scanAgain();
  }

  void _scanAgain() {
    _scan?.cancel();
    setState(() {
      _foundDevices.clear();
      _selected = null;
      _error = null;
      _scanning = true;
    });
    _scan = widget.radio.scan().listen(
      (device) => setState(() => _foundDevices.add(device)),
      onError: (Object e) => setState(
        () => _error = e is CapRadioException
            ? e.message
            : "Couldn't scan for caps. Try again.",
      ),
      onDone: () => setState(() {
        _scanning = false;
        if (_foundDevices.isEmpty) {
          _error ??=
              'No cap found. Make sure it is on and close to your phone.';
        }
      }),
    );
  }

  void _stopScanning() {
    _scan?.cancel();
    _scan = null;
    _scanning = false;
  }

  void _backToStart() {
    _stopScanning();
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

  Future<void> _pair() async {
    final device = _selected;
    if (_pairing) return;
    if (device == null) {
      if (_nothingFound) {
        _scanAgain();
        return;
      }
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
    if (widget.assignedCap.isEmpty) {
      widget.onUnauthorized?.call(device.name);
      setState(
        () => _error =
            'No Smart Cap is assigned to your account yet. Ask your admin to '
            'assign one.',
      );
      return;
    }
    if (_capKey(device.name) != _capKey(widget.assignedCap)) {
      widget.onUnauthorized?.call(device.name);
      setState(
        () => _error =
            '${device.name} is not the cap assigned to you. This attempt was '
            'reported to your admin.',
      );
      return;
    }
    setState(() {
      _stopScanning();
      _pairing = true;
    });
    try {
      await widget.radio.connect(device);
      if (!mounted) return;
      setState(() {
        _pairing = false;
        _step = 3;
      });
    } on CapRadioException catch (e) {
      if (!mounted) return;
      setState(() {
        _pairing = false;
        _error = e.message;
      });
    }
  }

  /// "CAP-001", "CAP 001" and "cap001" are the same cap.
  static String _capKey(String name) =>
      name.toUpperCase().replaceAll(RegExp(r'[^A-Z0-9]'), '');

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
          emblem: const PairingEmblem(svgAsset: 'assets/icons/smart_cap.svg'),
          heading: 'Turn on your Smart Cap',
          subheading:
              'Press and hold the power button on the cap band until the '
              'LED blinks blue.',
          body: _buildInstructions(),
          buttonLabel: 'Start Scanning',
          onButtonPressed: _startScanning,
        ),
        2 => PairingScaffold(
          step: 2,
          connected: false,
          emblem: const PairingEmblem(
            svgAsset: 'assets/icons/bluetooth_white.svg',
            scanning: true,
          ),
          heading: _pairing
              ? 'Pairing with ${_selected!.name}…'
              : _scanning
              ? 'Scanning for nearby caps…'
              : 'Select your Smart Cap',
          subheading: 'Keep your cap within 1 meter of your phone.',
          body: _buildScan(),
          buttonLabel: _pairing
              ? 'Pairing…'
              : _nothingFound
              ? 'Scan Again'
              : 'Pair Device',
          buttonActive: (_selected != null || _nothingFound) && !_pairing,
          buttonBusy: _pairing,
          onButtonPressed: _pair,
        ),
        _ => PairingScaffold(
          step: 3,
          connected: true,
          emblem: const PairingEmblem(svgAsset: 'assets/icons/check.svg'),
          heading: 'Smart Cap connected',
          subheading:
              '${_selected!.name} is now streaming vitals to your station.',
          body: _buildConnected(),
          buttonLabel: 'Go To Dashboard',
          onButtonPressed: () => widget.onDone?.call(_selected!.name),
        ),
      },
    );
  }

  /// The scan ended without a cap, so the button scans again.
  bool get _nothingFound => !_scanning && _foundDevices.isEmpty;

  Widget _buildInstructions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const PairingSectionLabel('BEFORE YOU START'),
        const SizedBox(height: 12),
        const PairingTipCard(
          number: 1,
          icon: Icons.power_settings_new_rounded,
          title: 'Hold the power button 2 seconds',
          description: 'LED turns solid, then blinks blue.',
        ),
        const SizedBox(height: 10),
        const PairingTipCard(
          number: 2,
          icon: Icons.bluetooth_rounded,
          title: 'Keep the cap within 1 meter',
          description: 'Pairing range is short for security.',
        ),
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: AuthErrorText(message: _bluetoothError, minHeight: 0),
        ),
        const VerificationNote(
          icon: Icons.bluetooth_searching_rounded,
          text: "We'll ask to turn on Bluetooth if it is off.",
        ),
      ],
    );
  }

  Widget _buildScan() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        PairingSectionLabel('Available devices (${_foundDevices.length})'),
        const SizedBox(height: 12),
        for (final device in _foundDevices) ...[
          PairingDeviceTile(
            key: ValueKey(device.name),
            device: device,
            selected: device == _selected,
            onTap: () => _select(device),
          ),
          const SizedBox(height: 10),
        ],
        if (_scanning && !_pairing) const PairingSearchingRow(),
        AuthErrorText(message: _error, minHeight: 14),
      ],
    );
  }

  Widget _buildConnected() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const PairingSectionLabel('DEVICE DETAILS'),
        const SizedBox(height: 12),
        PairingSummaryCard(
          rows: [
            (Icons.sensors_rounded, 'Device', _selected!.name),
            (
              Icons.bluetooth_connected_rounded,
              'Link',
              'Bluetooth · ${_selected!.signalBars} of 4 bars',
            ),
          ],
        ),
        const SizedBox(height: 20),
        const VerificationNote(
          icon: Icons.info_outline_rounded,
          text: 'You can change your paired cap in Account.',
        ),
      ],
    );
  }
}
