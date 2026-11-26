import 'package:capartner/features/pairing/pairing_widgets.dart';

/// The phone's Bluetooth link to the Smart Cap: finding caps nearby, and
/// keeping one connected so its packets come in.
///
/// One for the whole app, so the cap stays connected from pairing through
/// the tabs. [BleCapRadio] is the real one.
abstract class CapRadio {
  /// Caps nearby, each once, as they are found. The stream ends when the
  /// scan does, and cancelling it stops the scan. Fails with a
  /// [CapRadioException] when the phone cannot scan.
  Stream<PairingDevice> scan();

  /// Connects to [device] in place of the cap connected before, if any, and
  /// from then on reconnects whenever the link drops. Throws a
  /// [CapRadioException] when the first connection fails.
  Future<void> connect(PairingDevice device);

  /// Lets go of the connected cap, as on logout.
  Future<void> disconnect();

  /// Each packet the connected cap sends: the JSON text in
  /// docs/cap-data-format.md.
  Stream<String> get packets;
}

/// Why the phone could not scan for or connect to a cap, to show the user.
class CapRadioException implements Exception {
  const CapRadioException(this.message);

  final String message;

  @override
  String toString() => message;
}
