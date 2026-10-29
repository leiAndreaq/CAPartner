import 'package:capartner/data/sync_state.dart';

/// A video recorded on the Camera tab. Clips are kept on the phone and
/// uploaded to the admin.
class RecordedClip {
  const RecordedClip({
    required this.path,
    required this.recordedAt,
    required this.length,
    this.id = '',
    this.syncState = SyncState.pending,
  });

  /// Made once on the phone, so a re-sent upload is only saved once. Empty
  /// until the clip is stored.
  final String id;

  /// The video file, in the app's own storage once stored.
  final String path;

  /// Whether the admin has it yet.
  final SyncState syncState;

  /// When recording stopped.
  final DateTime recordedAt;

  final Duration length;
}

String _twoDigits(int value) => value.toString().padLeft(2, '0');

/// A length as minutes and seconds, e.g. "00:42".
String formatClipLength(Duration length) =>
    '${_twoDigits(length.inMinutes)}:${_twoDigits(length.inSeconds % 60)}';

/// Time of day as shown on a clip, e.g. "09:51 AM".
String formatClipTime(DateTime time) {
  final hour = time.hour % 12 == 0 ? 12 : time.hour % 12;
  final period = time.hour < 12 ? 'AM' : 'PM';
  return '${_twoDigits(hour)}:${_twoDigits(time.minute)} $period';
}
