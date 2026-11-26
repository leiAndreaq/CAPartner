import 'package:flutter/services.dart';

/// How a request to turn on the phone's Bluetooth ended.
enum BluetoothRequest {
  /// Bluetooth is on.
  turnedOn,

  /// The user turned down the permission or Android's prompt.
  declined,

  /// This platform cannot switch Bluetooth on for the user (iOS), or the
  /// Android side is missing, as in widget tests.
  unsupported,
}

/// The phone's Bluetooth switch, through the channel in `MainActivity.kt`.
class PhoneBluetooth {
  const PhoneBluetooth();

  static const MethodChannel _channel = MethodChannel('capartner/bluetooth');

  /// Whether Bluetooth is on; false when that cannot be told.
  Future<bool> isOn() async {
    try {
      return await _channel.invokeMethod<bool>('isEnabled') ?? false;
    } on MissingPluginException {
      return false;
    } on PlatformException {
      return false;
    }
  }

  /// Asks for the Nearby devices permission if needed, then shows Android's
  /// "turn on Bluetooth" prompt.
  Future<BluetoothRequest> turnOn() async {
    try {
      final on = await _channel.invokeMethod<bool>('requestEnable') ?? false;
      return on ? BluetoothRequest.turnedOn : BluetoothRequest.declined;
    } on MissingPluginException {
      return BluetoothRequest.unsupported;
    } on PlatformException {
      return BluetoothRequest.declined;
    }
  }
}
