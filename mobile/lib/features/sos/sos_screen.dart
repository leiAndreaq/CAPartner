import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/data/local_database.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// SOS screen, opened from the dashboard's SOS button: one big red button
/// that sends an SOS to the admin once it is held down for
/// [SosScreen.holdDuration], so a stray touch cannot send one.
///
/// Once sent, an emergency modal confirms it; holding its Cancel Alarm
/// button is the only way back to the dashboard. [onSend] stores the SOS on
/// the phone, which sends it to the admin as soon as there is signal. The
/// modal follows the SOS in [alerts] and changes to "acknowledged, help is on
/// the way" once the admin has acknowledged it.
class SosScreen extends StatefulWidget {
  const SosScreen({
    super.key,
    required this.location,
    this.onSend,
    this.alerts,
  });

  /// Where the user is, sent with the alert.
  final String location;

  /// Called when the SOS goes to the admin; returns the id of the alert it
  /// stored.
  final Future<String> Function()? onSend;

  /// The alerts on this phone, to follow the SOS in.
  final ValueListenable<List<AlertRecord>>? alerts;

  /// How long a button must be held to send or cancel.
  static const Duration holdDuration = Duration(seconds: 2);

  @override
  State<SosScreen> createState() => _SosScreenState();
}

class _SosScreenState extends State<SosScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  );

  /// Shown under the button after a press too short to count.
  bool _showHoldHint = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _pulse.stop();
    } else if (!_pulse.isAnimating) {
      _pulse.repeat();
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    HapticFeedback.heavyImpact();
    final alertId = await widget.onSend?.call();
    if (!mounted) return;
    setState(() => _showHoldHint = false);
    final sentAt = TimeOfDay.now();
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      barrierColor: AppColors.ink.withValues(alpha: 0.6),
      builder: (_) => _EmergencyModal(
        location: widget.location,
        sentAt: sentAt,
        alertId: alertId,
        alerts: widget.alerts,
      ),
    );
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.dark,
      child: Scaffold(
        backgroundColor: AppColors.white,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              _buildTopBar(),
              Expanded(
                child: LayoutBuilder(
                  builder: (context, constraints) => SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(24, 0, 24, 24 + bottomInset),
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        minHeight: constraints.maxHeight - 24 - bottomInset,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          _buildIntro(),
                          const SizedBox(height: 24),
                          _buildSosButton(),
                          const SizedBox(height: 24),
                          _buildWhatIsSent(),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Back to Dashboard',
            onPressed: () => Navigator.of(context).maybePop(),
            style: IconButton.styleFrom(
              backgroundColor: AppColors.surfaceGrey,
              foregroundColor: AppColors.ink,
            ),
            icon: const Icon(Icons.close_rounded),
          ),
          const SizedBox(width: 12),
          Text(
            'Emergency SOS',
            style: appTextStyle(
              fontSize: 20,
              lineHeight: 26,
              weight: FontWeight.w800,
              color: AppColors.ink,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIntro() {
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        children: [
          Text(
            'Need help?',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 28,
              lineHeight: 34,
              weight: FontWeight.w900,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Press and hold the SOS button for 2 seconds to alert your admin.',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 15,
              lineHeight: 22,
              weight: FontWeight.w500,
              color: AppColors.bodyText,
            ),
          ),
        ],
      ),
    );
  }

  /// The big button, with rings spreading from it and a ring that fills
  /// while it is held.
  Widget _buildSosButton() {
    const size = 200.0;

    return Column(
      children: [
        HoldToConfirm(
          semanticsLabel: 'SOS. Press and hold to alert your admin.',
          onConfirmed: _send,
          onTooShort: () => setState(() => _showHoldHint = true),
          builder: (context, progress) => SizedBox(
            width: size * 1.4,
            height: size * 1.4,
            child: AnimatedBuilder(
              animation: _pulse,
              builder: (context, _) => Stack(
                alignment: Alignment.center,
                children: [
                  for (final offset in const [0.0, 0.5])
                    _buildRing(size, (_pulse.value + offset) % 1),
                  SizedBox(
                    width: size + 16,
                    height: size + 16,
                    child: CircularProgressIndicator(
                      value: progress,
                      strokeWidth: 6,
                      strokeCap: StrokeCap.round,
                      color: AppColors.red,
                      backgroundColor: AppColors.red.withValues(alpha: 0.12),
                    ),
                  ),
                  Transform.scale(
                    scale: 1 - 0.04 * progress,
                    child: Container(
                      width: size,
                      height: size,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: RadialGradient(
                          colors: [
                            AppColors.red.withValues(alpha: 0.85),
                            AppColors.red,
                          ],
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.red.withValues(alpha: 0.4),
                            offset: const Offset(0, 12),
                            blurRadius: 28,
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'SOS',
                            style: appTextStyle(
                              fontSize: 56,
                              lineHeight: 60,
                              weight: FontWeight.w900,
                              color: AppColors.white,
                              letterSpacing: 2,
                            ),
                          ),
                          Text(
                            progress > 0 ? 'Keep holding…' : 'Press & hold',
                            style: appTextStyle(
                              fontSize: 13,
                              lineHeight: 18,
                              weight: FontWeight.w700,
                              color: AppColors.white.withValues(alpha: 0.85),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        SizedBox(
          height: 20,
          child: _showHoldHint
              ? Text(
                  'Hold the button until the ring fills.',
                  style: appTextStyle(
                    fontSize: 13,
                    lineHeight: 18,
                    weight: FontWeight.w700,
                    color: AppColors.red,
                  ),
                )
              : null,
        ),
      ],
    );
  }

  Widget _buildRing(double size, double progress) {
    final ringSize = size * (1 + 0.4 * progress);
    return Container(
      width: ringSize,
      height: ringSize,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.red.withValues(alpha: 0.14 * (1 - progress)),
      ),
    );
  }

  /// What the admin will receive.
  Widget _buildWhatIsSent() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceGrey,
        border: Border.all(color: AppColors.outline),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'YOUR ADMIN WILL RECEIVE',
            style: appTextStyle(
              fontSize: 11,
              lineHeight: 14,
              weight: FontWeight.w800,
              color: AppColors.mutedText,
              letterSpacing: 1,
            ),
          ),
          const SizedBox(height: 12),
          _DetailRow(
            icon: Icons.place_rounded,
            label: 'Location',
            value: widget.location,
          ),
          const SizedBox(height: 10),
          const _DetailRow(
            icon: Icons.monitor_heart_outlined,
            label: 'Vitals',
            value: 'Heart rate, temperature, motion',
          ),
        ],
      ),
    );
  }
}

/// Confirms the SOS went out, and what became of it: waiting for signal,
/// sent, then acknowledged by the admin. Only holding its button closes it.
class _EmergencyModal extends StatefulWidget {
  const _EmergencyModal({
    required this.location,
    required this.sentAt,
    this.alertId,
    this.alerts,
  });

  final String location;
  final TimeOfDay sentAt;

  /// The SOS being followed in [alerts].
  final String? alertId;
  final ValueListenable<List<AlertRecord>>? alerts;

  @override
  State<_EmergencyModal> createState() => _EmergencyModalState();
}

class _EmergencyModalState extends State<_EmergencyModal> {
  bool _showHoldHint = false;

  AlertRecord? _record(List<AlertRecord> alerts) {
    for (final alert in alerts) {
      if (alert.eventUid == widget.alertId) return alert;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final alerts = widget.alerts;
    if (alerts == null) return _buildDialog(null);
    return ValueListenableBuilder<List<AlertRecord>>(
      valueListenable: alerts,
      builder: (context, alerts, _) => _buildDialog(_record(alerts)),
    );
  }

  Widget _buildDialog(AlertRecord? record) {
    final acknowledged = record?.acknowledgedAt != null;
    final status = acknowledged
        ? 'Acknowledged by admin'
        : switch (record?.syncState) {
            SyncState.pending => 'Waiting for signal to send',
            _ => 'Sent · waiting for admin',
          };
    return PopScope(
      canPop: false,
      child: Dialog(
        backgroundColor: AppColors.white,
        insetPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        clipBehavior: Clip.antiAlias,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildBanner(acknowledged),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      acknowledged
                          ? 'Your admin acknowledged your alert and help is '
                                'on the way. Stay where you are if it is safe '
                                'to do so.'
                          : 'Your admin has been alerted with your location '
                                'and vitals. Stay where you are if it is safe '
                                'to do so.',
                      textAlign: TextAlign.center,
                      style: appTextStyle(
                        fontSize: 14,
                        lineHeight: 20,
                        weight: FontWeight.w500,
                        color: AppColors.bodyText,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceGrey,
                        border: Border.all(color: AppColors.outline),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Column(
                        children: [
                          const _DetailRow(
                            icon: Icons.admin_panel_settings_outlined,
                            label: 'Sent to',
                            value: 'Admin · Station',
                          ),
                          const SizedBox(height: 10),
                          _DetailRow(
                            icon: acknowledged
                                ? Icons.check_circle_rounded
                                : Icons.hourglass_top_rounded,
                            label: 'Status',
                            value: status,
                          ),
                          const SizedBox(height: 10),
                          _DetailRow(
                            icon: Icons.place_rounded,
                            label: 'Location',
                            value: widget.location,
                          ),
                          const SizedBox(height: 10),
                          _DetailRow(
                            icon: Icons.schedule_rounded,
                            label: 'Sent at',
                            value: widget.sentAt.format(context),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                    _buildCancelButton(acknowledged),
                    const SizedBox(height: 8),
                    Text(
                      _showHoldHint
                          ? 'Keep holding until the button fills.'
                          : acknowledged
                          ? 'Press and hold to close this once you are safe.'
                          : 'Press and hold to cancel the alarm.',
                      textAlign: TextAlign.center,
                      style: appTextStyle(
                        fontSize: 12,
                        lineHeight: 16,
                        weight: _showHoldHint
                            ? FontWeight.w700
                            : FontWeight.w500,
                        color: _showHoldHint
                            ? AppColors.red
                            : AppColors.mutedText,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBanner(bool acknowledged) {
    return Container(
      color: acknowledged ? AppColors.green : AppColors.red,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: AppColors.white.withValues(alpha: 0.18),
              shape: BoxShape.circle,
            ),
            child: Icon(
              acknowledged
                  ? Icons.check_rounded
                  : Icons.emergency_share_rounded,
              size: 34,
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            acknowledged ? 'SOS Acknowledged' : 'SOS Sent',
            style: appTextStyle(
              fontSize: 24,
              lineHeight: 30,
              weight: FontWeight.w900,
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            acknowledged
                ? 'Help is on the way'
                : 'Waiting for your admin to acknowledge',
            style: appTextStyle(
              fontSize: 14,
              lineHeight: 20,
              weight: FontWeight.w600,
              color: AppColors.white.withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCancelButton(bool acknowledged) {
    return HoldToConfirm(
      semanticsLabel: acknowledged
          ? 'Your admin acknowledged your alert and help is on the way. '
                'Press and hold to close.'
          : 'Cancel Alarm. Press and hold to go back.',
      onConfirmed: () {
        HapticFeedback.heavyImpact();
        Navigator.of(context).pop();
      },
      onTooShort: () => setState(() => _showHoldHint = true),
      builder: (context, progress) => Container(
        height: 56,
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: acknowledged ? AppColors.green : AppColors.red,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Stack(
          children: [
            FractionallySizedBox(
              widthFactor: progress,
              heightFactor: 1,
              child: ColoredBox(color: AppColors.white.withValues(alpha: 0.25)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Center(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        acknowledged
                            ? Icons.check_circle_rounded
                            : Icons.notifications_off_rounded,
                        size: 20,
                        color: AppColors.white,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        acknowledged
                            ? 'Admin acknowledged · Help is on the way'
                            : 'Cancel Alarm',
                        style: appTextStyle(
                          fontSize: 16,
                          weight: FontWeight.w800,
                          color: AppColors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.green),
        const SizedBox(width: 10),
        Text(
          label,
          style: appTextStyle(
            fontSize: 13,
            lineHeight: 18,
            weight: FontWeight.w600,
            color: AppColors.mutedText,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            value,
            textAlign: TextAlign.end,
            style: appTextStyle(
              fontSize: 13,
              lineHeight: 18,
              weight: FontWeight.w800,
              color: AppColors.ink,
            ),
          ),
        ),
      ],
    );
  }
}

/// Runs [onConfirmed] only after being held for [SosScreen.holdDuration].
///
/// [builder] gets how far the hold has got, 0 to 1; letting go early drains
/// it and calls [onTooShort]. Screen readers confirm with a long press.
class HoldToConfirm extends StatefulWidget {
  const HoldToConfirm({
    super.key,
    required this.semanticsLabel,
    required this.onConfirmed,
    required this.builder,
    this.onTooShort,
  });

  final String semanticsLabel;
  final VoidCallback onConfirmed;
  final VoidCallback? onTooShort;
  final Widget Function(BuildContext context, double progress) builder;

  @override
  State<HoldToConfirm> createState() => _HoldToConfirmState();
}

class _HoldToConfirmState extends State<HoldToConfirm>
    with SingleTickerProviderStateMixin {
  late final AnimationController _hold = AnimationController(
    vsync: this,
    duration: SosScreen.holdDuration,
    reverseDuration: const Duration(milliseconds: 250),
  )..addStatusListener(_onStatus);

  @override
  void dispose() {
    _hold.dispose();
    super.dispose();
  }

  void _onStatus(AnimationStatus status) {
    if (status != AnimationStatus.completed) return;
    _hold.value = 0;
    widget.onConfirmed();
  }

  void _start() {
    HapticFeedback.selectionClick();
    _hold.forward();
  }

  void _release() {
    if (_hold.status != AnimationStatus.forward) return;
    _hold.reverse();
    widget.onTooShort?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: widget.semanticsLabel,
      onLongPress: widget.onConfirmed,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTapDown: (_) => _start(),
        onTapUp: (_) => _release(),
        onTapCancel: _release,
        child: ExcludeSemantics(
          child: AnimatedBuilder(
            animation: _hold,
            builder: (context, _) => widget.builder(context, _hold.value),
          ),
        ),
      ),
    );
  }
}
