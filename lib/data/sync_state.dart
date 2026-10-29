/// Where a record stored on the phone is on its way to the backend.
enum SyncState {
  /// Waiting to be sent.
  pending,

  /// Saved on the server.
  sent,

  /// Turned down by the server for good, e.g. a malformed reading; kept with
  /// the reason for checking, never re-sent.
  rejected,
}
