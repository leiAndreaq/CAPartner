import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

import 'package:capartner/features/pairing/cap_radio.dart';
import 'package:capartner/features/pairing/pairing_widgets.dart';

/// [CapRadio] over Bluetooth Low Energy.
///
/// The cap advertises [service] under a name starting with [namePrefix] and
/// sends each packet as a notification on [readings]. See
/// docs/cap-data-format.md.
class BleCapRadio implements CapRadio {
  static final Guid service = Guid('8f3a1c20-5b7e-4d2a-9c61-0e4b7f2a1d00');
  static final Guid readings = Guid('8f3a1c21-5b7e-4d2a-9c61-0e4b7f2a1d00');

  /// Dropped from the advertised name, so "CAPartner-CAP-001" shows as
  /// "CAP-001".
  static const String namePrefix = 'CAPartner-';

  static const Duration scanTime = Duration(seconds: 15);
  static const Duration connectTimeout = Duration(seconds: 15);

  /// Wait between attempts to get a dropped cap back.
  static const Duration retryDelay = Duration(seconds: 3);

  final StreamController<String> _packets = StreamController.broadcast();

  /// The cap to keep connected, if any.
  BluetoothDevice? _device;
  StreamSubscription<BluetoothConnectionState>? _state;
  StreamSubscription<List<int>>? _values;
  bool _reconnecting = false;

  @override
  Stream<String> get packets => _packets.stream;

  @override
  Stream<PairingDevice> scan() {
    final seen = <String>{};
    StreamSubscription<List<ScanResult>>? results;
    late final StreamController<PairingDevice> found;

    void add(String id, String name, int rssi) {
      if (seen.add(id)) {
        found.add(
          PairingDevice(
            id: id,
            name: _shortName(name, id),
            description: 'CAPartner Smart Cap',
            signalBars: _signalBars(rssi),
          ),
        );
      }
    }

    Future<void> start() async {
      // A connected cap stops advertising, so it is listed from here.
      final current = _device;
      if (current != null && current.isConnected) {
        add(current.remoteId.str, current.platformName, -50);
      }
      results = FlutterBluePlus.onScanResults.listen((list) {
        for (final result in list) {
          final advertised = result.advertisementData.advName;
          add(
            result.device.remoteId.str,
            advertised.isNotEmpty ? advertised : result.device.platformName,
            result.rssi,
          );
        }
      });
      try {
        await FlutterBluePlus.startScan(
          withServices: [service],
          timeout: scanTime,
        );
      } catch (e) {
        debugPrint('Cap scan failed: $e');
        found.addError(
          CapRadioException(
            '$e'.contains('Permission')
                ? "Couldn't scan for caps. Allow Nearby devices for "
                      'CAPartner and try again.'
                : "Couldn't scan for caps. Make sure Bluetooth is on and "
                      'try again.',
          ),
        );
        await found.close();
        return;
      }
      await FlutterBluePlus.isScanning.firstWhere((scanning) => !scanning);
      await found.close();
    }

    found = StreamController(
      onListen: start,
      onCancel: () async {
        await results?.cancel();
        await FlutterBluePlus.stopScan();
      },
    );
    return found.stream;
  }

  @override
  Future<void> connect(PairingDevice device) async {
    final next = BluetoothDevice.fromId(device.id);
    if (_device == next && next.isConnected) return;
    await disconnect();
    _device = next;
    try {
      await _open(next);
    } catch (_) {
      if (_device == next) await disconnect();
      throw CapRadioException(
        "Couldn't connect to ${device.name}. Keep it close and try again.",
      );
    }
    _state = next.connectionState.listen((state) {
      if (state == BluetoothConnectionState.disconnected) _reconnect(next);
    });
  }

  @override
  Future<void> disconnect() async {
    final device = _device;
    _device = null;
    await _state?.cancel();
    await _values?.cancel();
    _state = null;
    _values = null;
    await device?.disconnect();
  }

  /// Connects to [device] and subscribes to its readings.
  Future<void> _open(BluetoothDevice device) async {
    // A larger MTU is asked for on connecting, so a packet fits in one
    // notification.
    await device.connect(license: License.nonprofit, timeout: connectTimeout);
    try {
      final services = await device.discoverServices();
      final characteristic = services
          .where((s) => s.uuid == service)
          .expand((s) => s.characteristics)
          .firstWhere(
            (c) => c.uuid == readings,
            orElse: () => throw const CapRadioException('Not a Smart Cap.'),
          );
      await _values?.cancel();
      _values = characteristic.onValueReceived.listen(
        (value) => _packets.add(utf8.decode(value, allowMalformed: true)),
      );
      await characteristic.setNotifyValue(true);
    } catch (_) {
      // Connected but not listening is no use: drop it, to start over.
      await device.disconnect();
      rethrow;
    }
  }

  /// Tries to get [device] back until it is connected again, or another cap
  /// (or none) is wanted.
  Future<void> _reconnect(BluetoothDevice device) async {
    if (_reconnecting) return;
    _reconnecting = true;
    try {
      while (_device == device && !device.isConnected) {
        await Future<void>.delayed(retryDelay);
        if (_device != device) return;
        try {
          await _open(device);
        } catch (_) {
          // Out of range or switched off: try again.
        }
      }
    } finally {
      _reconnecting = false;
    }
  }

  static String _shortName(String name, String id) {
    if (name.isEmpty) return id;
    return name.startsWith(namePrefix)
        ? name.substring(namePrefix.length)
        : name;
  }

  /// Signal strength from 1 to 4 bars.
  static int _signalBars(int rssi) {
    if (rssi >= -60) return 4;
    if (rssi >= -70) return 3;
    if (rssi >= -80) return 2;
    return 1;
  }
}
