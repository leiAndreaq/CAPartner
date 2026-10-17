import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// How an alert was raised.
enum AlertType {
  auto('Auto', 'Auto-Detected', 'assets/icons/alert_auto.svg'),
  manual('Manual', 'Manual SOS', 'assets/icons/alert_manual.svg'),
  system('System', 'System', 'assets/icons/alert_system.svg');

  const AlertType(this.filterLabel, this.cardLabel, this.iconAsset);

  /// Label of the filter button.
  final String filterLabel;

  /// Label shown on an alert of this type.
  final String cardLabel;
  final String iconAsset;
}

class _Alert {
  const _Alert({
    required this.type,
    required this.day,
    required this.time,
    required this.title,
    required this.detail,
    this.source,
    this.fromMe = false,
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
}

/// Alerts tab (Figma nodes 546:661, 736:48, 736:166, 736:284).
///
/// The filter buttons narrow the list to one [AlertType]. The alerts are
/// fixed sample values until the cap and the admin side send real ones.
class AlertsTab extends StatefulWidget {
  const AlertsTab({
    super.key,
    required this.statusBar,
    required this.bottomPadding,
  });

  /// Connection status pill shown at the top.
  final Widget statusBar;

  /// Room taken by the tab bar at the bottom of the screen.
  final double bottomPadding;

  @override
  State<AlertsTab> createState() => _AlertsTabState();
}

class _AlertsTabState extends State<AlertsTab> {
  static const Color _grey = Color(0xFF5F6660);
  static const List<BoxShadow> _shadow = [
    BoxShadow(color: Color(0x40000000), offset: Offset(0, 4), blurRadius: 4),
  ];

  // Newest first.
  static const List<_Alert> _alerts = [
    _Alert(
      type: AlertType.manual,
      day: 'Today',
      time: '4:11 PM',
      title: 'Manual SOS sent',
      detail: 'Acknowledged by Admin · responder dispatched',
      source: 'You',
      fromMe: true,
    ),
    _Alert(
      type: AlertType.auto,
      day: 'Yesterday',
      time: '2:20 PM',
      title: 'Elevated heart rate detected',
      detail: 'Sustained 142 BPM — enforcer confirmed safe',
      source: 'You',
      fromMe: true,
    ),
    _Alert(
      type: AlertType.system,
      day: 'Yesterday',
      time: '9:45 PM',
      title: 'Switched to LoRa relay',
      detail: 'Internet lost for 14 minutes — vitals relayed via mesh',
    ),
    _Alert(
      type: AlertType.manual,
      day: 'Yesterday',
      time: '10:50 PM',
      title: 'Manual SOS sent',
      detail: 'Acknowledged by Admin Reyes · responder dispatched',
      source: 'CAP 002',
    ),
  ];

  /// Type the list is narrowed to; null shows every alert.
  AlertType? _filter;

  @override
  Widget build(BuildContext context) {
    final alerts = [
      for (final alert in _alerts)
        if (_filter == null || alert.type == _filter) alert,
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 10),
        widget.statusBar,
        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 19),
          child: Text(
            'Alerts & Notification',
            style: appTextStyle(
              fontSize: 20,
              lineHeight: 28,
              weight: FontWeight.w900,
              color: AppColors.darkGreen,
            ),
          ),
        ),
        const SizedBox(height: 11),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Row(
              spacing: 8,
              children: [
                _buildFilter(label: 'All', type: null, width: 46),
                _buildFilter(
                  label: AlertType.auto.filterLabel,
                  type: AlertType.auto,
                  width: 82,
                ),
                _buildFilter(
                  label: AlertType.manual.filterLabel,
                  type: AlertType.manual,
                  width: 104,
                ),
                _buildFilter(
                  label: AlertType.system.filterLabel,
                  type: AlertType.system,
                  width: 104,
                ),
              ],
            ),
          ),
        ),
        Expanded(
          child: ListView(
            padding: EdgeInsets.fromLTRB(18, 10, 21, widget.bottomPadding + 27),
            children: [
              if (alerts.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 40),
                  child: Text(
                    'No alerts here yet.',
                    textAlign: TextAlign.center,
                    style: appTextStyle(
                      fontSize: 14,
                      weight: FontWeight.w600,
                      color: _grey,
                    ),
                  ),
                ),
              for (var i = 0; i < alerts.length; i++) ...[
                if (i == 0 || alerts[i].day != alerts[i - 1].day)
                  Padding(
                    padding: EdgeInsets.only(top: i == 0 ? 0 : 11, bottom: 6),
                    child: Text(
                      alerts[i].day,
                      style: appTextStyle(
                        fontSize: 14,
                        lineHeight: 24,
                        weight: FontWeight.w800,
                        color: const Color(0xFF8E8E8E),
                      ),
                    ),
                  ),
                _buildAlertCard(alerts[i]),
                const SizedBox(height: 12),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFilter({
    required String label,
    required AlertType? type,
    required double width,
  }) {
    final selected = type == _filter;
    return Semantics(
      button: true,
      selected: selected,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _filter = type),
        // Extra room below so the shadow is not cut off by the scaling box.
        child: Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Container(
            width: width,
            height: 28,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: selected ? AppColors.darkGreen : const Color(0xFFF6F5F5),
              borderRadius: BorderRadius.circular(20),
              boxShadow: _shadow,
            ),
            child: Text(
              label,
              maxLines: 1,
              style: appTextStyle(
                fontSize: 14,
                weight: FontWeight.w700,
                color: selected ? AppColors.white : AppColors.darkGreen,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildAlertCard(_Alert alert) {
    final source = alert.source;

    return Container(
      constraints: const BoxConstraints(minHeight: 107),
      padding: const EdgeInsets.fromLTRB(18, 13, 16, 13),
      decoration: BoxDecoration(
        color: const Color(0xFFF9F9F9),
        borderRadius: BorderRadius.circular(20),
        boxShadow: _shadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              SvgPicture.asset(alert.type.iconAsset, width: 14, height: 14),
              const SizedBox(width: 6),
              Flexible(
                child: Text(
                  alert.type.cardLabel,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: appTextStyle(
                    fontSize: 11.5,
                    lineHeight: 17.25,
                    weight: FontWeight.w800,
                    color: _grey,
                    letterSpacing: 0.2875,
                  ),
                ),
              ),
              if (source != null) ...[
                const SizedBox(width: 22),
                Container(
                  width: 57,
                  height: 16,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: alert.fromMe
                        ? const Color(0xFFD00000)
                        : const Color(0xFFCECB00),
                    borderRadius: BorderRadius.circular(50),
                  ),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      source,
                      style: appTextStyle(
                        fontSize: alert.fromMe ? 11 : 10,
                        weight: FontWeight.w700,
                        color: AppColors.white,
                      ),
                    ),
                  ),
                ),
              ],
              const Spacer(),
              Text(
                alert.time,
                style: appTextStyle(
                  fontSize: 12,
                  lineHeight: 18,
                  weight: FontWeight.w700,
                  color: _grey,
                ),
              ),
              const SizedBox(width: 9),
            ],
          ),
          const SizedBox(height: 2),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              alert.title,
              maxLines: 1,
              style: appTextStyle(
                fontSize: 17,
                lineHeight: 23.375,
                weight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
          ),
          const SizedBox(height: 2),
          Row(
            children: [
              Expanded(
                child: Text(
                  alert.detail,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: appTextStyle(
                    fontSize: 13.5,
                    lineHeight: 18.563,
                    weight: FontWeight.w400,
                    color: _grey,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                width: 93,
                height: 24,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.mint,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'Acknowledged',
                    style: appTextStyle(
                      fontSize: 10,
                      weight: FontWeight.w900,
                      color: AppColors.green,
                      letterSpacing: 0.275,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
