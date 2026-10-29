import 'package:flutter/material.dart';

import 'package:capartner/data/local_database.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// How an alert was raised.
enum AlertType {
  auto('Auto', 'Auto-Detected', Icons.monitor_heart_rounded, AppColors.amber),
  manual('Manual', 'Manual SOS', Icons.sos_rounded, AppColors.red),
  system('System', 'System', Icons.cell_tower_rounded, AppColors.green);

  const AlertType(this.filterLabel, this.cardLabel, this.icon, this.color);

  /// Label of the filter button.
  final String filterLabel;

  /// Label shown on an alert of this type.
  final String cardLabel;
  final IconData icon;

  /// Accent of the type's icon and label.
  final Color color;
}

class _Alert {
  /// [record], raised on this phone, as of [now].
  factory _Alert.from(AlertRecord record, DateTime now) {
    final at = record.occurredAt.toLocal();
    final today = DateTime(now.year, now.month, now.day);
    final day = DateTime(at.year, at.month, at.day);
    final hour = at.hour % 12 == 0 ? 12 : at.hour % 12;
    final minute = at.minute.toString().padLeft(2, '0');
    final status = switch (record.syncState) {
      SyncState.sent when record.acknowledgedAt != null =>
        'Acknowledged by admin · help is on the way',
      SyncState.sent => 'Sent to admin',
      SyncState.pending => 'Waiting for signal to send',
      SyncState.rejected => 'Not accepted: ${record.syncError}',
    };
    return _Alert(
      type: switch (record.type) {
        'sos' => AlertType.manual,
        'health' => AlertType.auto,
        _ => AlertType.system,
      },
      day: day == today
          ? 'Today'
          : day == today.subtract(const Duration(days: 1))
          ? 'Yesterday'
          : '${_months[at.month - 1]} ${at.day}, ${at.year}',
      time: '$hour:$minute ${at.hour < 12 ? 'AM' : 'PM'}',
      title: record.title,
      detail: '${record.detail} · $status',
      source: record.type == 'sos' || record.type == 'health' ? 'You' : null,
      fromMe: true,
      pending: record.syncState == SyncState.pending,
    );
  }

  static const List<String> _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', //
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  const _Alert({
    required this.type,
    required this.day,
    required this.time,
    required this.title,
    required this.detail,
    this.source,
    this.fromMe = false,
    this.pending = false,
  });

  final AlertType type;

  /// Section the alert is listed under, e.g. "Today".
  final String day;
  final String time;
  final String title;
  final String detail;

  /// Who raised it: "You" or another cap. System alerts have none.
  final String? source;
  final bool fromMe;

  /// Not yet sent to the admin.
  final bool pending;
}

/// Alerts tab (Figma nodes 546:661, 736:48, 736:166, 736:284).
///
/// A summary of where things stand, filters by [AlertType] with their counts,
/// then the alerts grouped by day. Tapping an alert opens its details.
/// [alerts] are the ones raised on this phone; without them the tab is empty.
class AlertsTab extends StatefulWidget {
  const AlertsTab({
    super.key,
    required this.statusBar,
    required this.bottomPadding,
    this.alerts,
  });

  /// Alerts raised on this phone, newest first.
  final List<AlertRecord>? alerts;

  /// Connection status pill shown at the top.
  final Widget statusBar;

  /// Room taken by the tab bar at the bottom of the screen.
  final double bottomPadding;

  @override
  State<AlertsTab> createState() => _AlertsTabState();
}

class _AlertsTabState extends State<AlertsTab> {
  static const double _horizontalPadding = 20;

  static const List<BoxShadow> _cardShadow = [
    BoxShadow(color: Color(0x141A1A1A), offset: Offset(0, 6), blurRadius: 16),
  ];

  /// Type the list is narrowed to; null shows every alert.
  AlertType? _filter;

  List<_Alert> get _alerts {
    final records = widget.alerts;
    if (records == null) return const [];
    final now = DateTime.now();
    return [for (final record in records) _Alert.from(record, now)];
  }

  int _countOf(AlertType? type) => type == null
      ? _alerts.length
      : _alerts.where((alert) => alert.type == type).length;

  @override
  Widget build(BuildContext context) {
    final alerts = [
      for (final alert in _alerts)
        if (_filter == null || alert.type == _filter) alert,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 10),
        widget.statusBar,
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: _horizontalPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Alerts & Notification',
                style: appTextStyle(
                  fontSize: 20,
                  lineHeight: 26,
                  weight: FontWeight.w900,
                  color: AppColors.darkGreen,
                  letterSpacing: 0.2,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                'SOS, health and system events from your cap',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 18,
                  weight: FontWeight.w500,
                  color: AppColors.mutedText,
                ),
              ),
              const SizedBox(height: 16),
              _buildSummary(),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: _horizontalPadding),
          child: Row(
            spacing: 8,
            children: [
              _buildFilter(label: 'All', type: null),
              for (final type in AlertType.values)
                _buildFilter(label: type.filterLabel, type: type),
            ],
          ),
        ),
        Expanded(
          child: ListView(
            padding: EdgeInsets.fromLTRB(
              _horizontalPadding,
              8,
              _horizontalPadding,
              widget.bottomPadding + 27,
            ),
            children: [
              if (alerts.isEmpty) _buildEmpty(),
              for (var i = 0; i < alerts.length; i++) ...[
                if (i == 0 || alerts[i].day != alerts[i - 1].day)
                  _buildDayHeader(
                    alerts[i].day,
                    alerts.where((a) => a.day == alerts[i].day).length,
                    first: i == 0,
                  ),
                _buildAlertCard(alerts[i]),
                const SizedBox(height: 10),
              ],
            ],
          ),
        ),
      ],
    );
  }

  /// Where things stand: how many alerts there are, and the latest one.
  Widget _buildSummary() {
    final all = _alerts;
    final waiting = all.where((alert) => alert.pending).length;
    final latest = all.isEmpty ? null : all.first;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.paleMint,
        border: Border.all(color: AppColors.mint, width: 1.5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: AppColors.green,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.verified_rounded,
              size: 22,
              color: AppColors.white,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  all.isEmpty
                      ? 'No alerts yet'
                      : waiting > 0
                      ? '$waiting of ${all.length} alerts waiting to send'
                      : widget.alerts == null
                      ? 'All ${all.length} alerts acknowledged'
                      : 'All ${all.length} alerts sent to admin',
                  style: appTextStyle(
                    fontSize: 15,
                    lineHeight: 20,
                    weight: FontWeight.w800,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  latest == null
                      ? 'SOS and health alerts will show up here'
                      : 'Latest: ${latest.title} · ${latest.time}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: appTextStyle(
                    fontSize: 12,
                    lineHeight: 16,
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

  Widget _buildFilter({required String label, required AlertType? type}) {
    final selected = type == _filter;
    final foreground = selected ? AppColors.white : AppColors.darkGreen;

    return Semantics(
      button: true,
      selected: selected,
      child: Material(
        color: selected ? AppColors.darkGreen : AppColors.white,
        shape: StadiumBorder(
          side: BorderSide(
            color: selected ? AppColors.darkGreen : AppColors.outline,
          ),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => setState(() => _filter = type),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 7, 8, 7),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (type != null) ...[
                  Icon(
                    type.icon,
                    size: 16,
                    color: selected ? AppColors.white : type.color,
                  ),
                  const SizedBox(width: 6),
                ],
                Text(
                  label,
                  maxLines: 1,
                  style: appTextStyle(
                    fontSize: 13,
                    lineHeight: 18,
                    weight: FontWeight.w700,
                    color: foreground,
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  constraints: const BoxConstraints(minWidth: 20),
                  height: 20,
                  padding: const EdgeInsets.symmetric(horizontal: 6),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selected
                        ? AppColors.white.withValues(alpha: 0.18)
                        : AppColors.surfaceGrey,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    '${_countOf(type)}',
                    style: appTextStyle(
                      fontSize: 11,
                      weight: FontWeight.w800,
                      color: foreground,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildDayHeader(String day, int count, {required bool first}) {
    return Padding(
      padding: EdgeInsets.only(top: first ? 8 : 14, bottom: 8),
      child: Row(
        children: [
          Text(
            day,
            style: appTextStyle(
              fontSize: 13,
              lineHeight: 18,
              weight: FontWeight.w800,
              color: AppColors.mutedText,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(width: 10),
          const Expanded(child: Divider(color: AppColors.outline, height: 1)),
          const SizedBox(width: 10),
          Text(
            count == 1 ? '1 alert' : '$count alerts',
            style: appTextStyle(
              fontSize: 11,
              lineHeight: 16,
              weight: FontWeight.w600,
              color: AppColors.mutedText,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Padding(
      padding: const EdgeInsets.only(top: 40),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: const BoxDecoration(
              color: AppColors.mint,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_none_rounded,
              size: 30,
              color: AppColors.green,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'No alerts here yet.',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 15,
              lineHeight: 20,
              weight: FontWeight.w800,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Alerts from your cap will show up here.',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 13,
              lineHeight: 18,
              weight: FontWeight.w500,
              color: AppColors.mutedText,
            ),
          ),
        ],
      ),
    );
  }

  /// Round icon on the type's tint.
  Widget _buildTypeBadge(AlertType type, {double size = 42}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: type.color.withValues(alpha: 0.12),
        shape: BoxShape.circle,
      ),
      child: Icon(type.icon, size: size * 0.52, color: type.color),
    );
  }

  /// Who raised the alert: red for the user, amber for another cap.
  Widget _buildSourceChip(_Alert alert) {
    final color = alert.fromMe ? AppColors.red : AppColors.amber;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(50),
      ),
      child: Text(
        alert.source!,
        style: appTextStyle(
          fontSize: 10,
          lineHeight: 14,
          weight: FontWeight.w800,
          color: alert.fromMe ? AppColors.red : AppColors.ink,
        ),
      ),
    );
  }

  Widget _buildStatusPill() {
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 3, 9, 3),
      decoration: BoxDecoration(
        color: AppColors.mint,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(
            Icons.check_circle_rounded,
            size: 13,
            color: AppColors.green,
          ),
          const SizedBox(width: 4),
          Text(
            'Acknowledged',
            style: appTextStyle(
              fontSize: 10,
              lineHeight: 14,
              weight: FontWeight.w800,
              color: AppColors.green,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(_Alert alert) {
    final type = alert.type;

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        boxShadow: _cardShadow,
      ),
      child: Material(
        color: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: AppColors.outline),
        ),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: () => _showDetails(alert),
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // The type's colour down the leading edge.
                Container(width: 4, color: type.color),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(12, 14, 14, 14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildTypeBadge(type),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Flexible(
                                    child: Text(
                                      type.cardLabel.toUpperCase(),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      semanticsLabel: type.cardLabel,
                                      style: appTextStyle(
                                        fontSize: 10.5,
                                        lineHeight: 16,
                                        weight: FontWeight.w800,
                                        color: type == AlertType.auto
                                            ? AppColors.ink
                                            : type.color,
                                        letterSpacing: 0.6,
                                      ),
                                    ),
                                  ),
                                  if (alert.source != null) ...[
                                    const SizedBox(width: 8),
                                    _buildSourceChip(alert),
                                  ],
                                  const Spacer(),
                                  Text(
                                    alert.time,
                                    style: appTextStyle(
                                      fontSize: 11.5,
                                      lineHeight: 16,
                                      weight: FontWeight.w600,
                                      color: AppColors.mutedText,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                alert.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: appTextStyle(
                                  fontSize: 15.5,
                                  lineHeight: 21,
                                  weight: FontWeight.w800,
                                  color: AppColors.ink,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                alert.detail,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: appTextStyle(
                                  fontSize: 13,
                                  lineHeight: 18,
                                  weight: FontWeight.w500,
                                  color: AppColors.bodyText,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  _buildStatusPill(),
                                  const Spacer(),
                                  Text(
                                    'Details',
                                    style: appTextStyle(
                                      fontSize: 12,
                                      lineHeight: 16,
                                      weight: FontWeight.w800,
                                      color: AppColors.green,
                                    ),
                                  ),
                                  const Icon(
                                    Icons.chevron_right_rounded,
                                    size: 18,
                                    color: AppColors.green,
                                  ),
                                ],
                              ),
                            ],
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
    );
  }

  void _showDetails(_Alert alert) {
    showModalBottomSheet<void>(
      context: context,
      useRootNavigator: true,
      backgroundColor: AppColors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) => _AlertDetails(
        alert: alert,
        badge: _buildTypeBadge(alert.type, size: 52),
        status: _buildStatusPill(),
      ),
    );
  }
}

/// Bottom sheet with everything known about one alert.
class _AlertDetails extends StatelessWidget {
  const _AlertDetails({
    required this.alert,
    required this.badge,
    required this.status,
  });

  final _Alert alert;
  final Widget badge;
  final Widget status;

  @override
  Widget build(BuildContext context) {
    final source = alert.source;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 12, 24, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 5,
                decoration: BoxDecoration(
                  color: AppColors.outline,
                  borderRadius: BorderRadius.circular(50),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                badge,
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        alert.type.cardLabel,
                        style: appTextStyle(
                          fontSize: 12,
                          lineHeight: 16,
                          weight: FontWeight.w800,
                          color: AppColors.mutedText,
                        ),
                      ),
                      Text(
                        alert.title,
                        style: appTextStyle(
                          fontSize: 18,
                          lineHeight: 24,
                          weight: FontWeight.w900,
                          color: AppColors.ink,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            _buildRow(
              Icons.schedule_rounded,
              'When',
              '${alert.day} · ${alert.time}',
            ),
            if (source != null)
              _buildRow(
                Icons.person_rounded,
                'Raised by',
                alert.fromMe ? 'You' : source,
              ),
            _buildRow(
              Icons.info_outline_rounded,
              'What happened',
              alert.detail,
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  'Status',
                  style: appTextStyle(
                    fontSize: 13,
                    lineHeight: 18,
                    weight: FontWeight.w600,
                    color: AppColors.mutedText,
                  ),
                ),
                const Spacer(),
                status,
              ],
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.darkGreen,
                  foregroundColor: AppColors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                onPressed: () => Navigator.of(context).pop(),
                child: Text(
                  'Done',
                  style: appTextStyle(
                    fontSize: 15,
                    weight: FontWeight.w800,
                    color: AppColors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.green),
          const SizedBox(width: 10),
          SizedBox(
            width: 104,
            child: Text(
              label,
              style: appTextStyle(
                fontSize: 13,
                lineHeight: 18,
                weight: FontWeight.w600,
                color: AppColors.mutedText,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: appTextStyle(
                fontSize: 13,
                lineHeight: 18,
                weight: FontWeight.w700,
                color: AppColors.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
