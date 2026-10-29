import 'dart:async';

import 'package:capartner/features/pairing/cap_radio.dart';
import 'package:capartner/features/pairing/pairing_widgets.dart';

/// Stands in for the phone's Bluetooth: a scan finds [devices], one every
/// [foundEvery], and connecting takes [connectTime]. Tests send packets from
/// the "cap" with [send].
class FakeCapRadio implements CapRadio {
  FakeCapRadio({this.devices = demoDevices, this.connectTime = connectDelay});

  static const List<PairingDevice> demoDevices = [
    PairingDevice(
      id: 'AA:00:00:00:00:01',
      name: 'CAP-001',
      description: 'CAPartner Smart Cap',
      signalBars: 4,
    ),
    PairingDevice(
      id: 'AA:00:00:00:00:14',
      name: 'CAP-014',
      description: 'CAPartner Smart Cap',
      signalBars: 2,
    ),
    PairingDevice(
      id: 'BB:00:00:00:09:F2',
      name: 'BLE-9F2',
      description: 'Unknown BLE Device',
      signalBars: 1,
      isSmartCap: false,
    ),
  ];

  static const Duration foundEvery = Duration(milliseconds: 900);
  static const Duration connectDelay = Duration(milliseconds: 1500);

  final List<PairingDevice> devices;
  final Duration connectTime;

  /// The cap connected to, if any.
  PairingDevice? connected;

  final StreamController<String> _packets = StreamController.broadcast();

  @override
  Stream<String> get packets => _packets.stream;

  /// A packet from the connected cap.
  void send(String packet) => _packets.add(packet);

  @override
  Stream<PairingDevice> scan() {
    Timer? timer;
    late final StreamController<PairingDevice> found;
    found = StreamController(
      onListen: () {
        var next = 0;
        timer = Timer.periodic(foundEvery, (timer) {
          if (next < devices.length) found.add(devices[next++]);
          if (next == devices.length) {
            timer.cancel();
            found.close();
          }
        });
      },
      onCancel: () => timer?.cancel(),
    );
    return found.stream;
  }

  @override
  Future<void> connect(PairingDevice device) async {
    await Future<void>.delayed(connectTime);
    connected = device;
  }

  @override
  Future<void> disconnect() async => connected = null;
}
