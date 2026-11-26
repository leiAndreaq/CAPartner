import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/dashboard/vital_trend_chart.dart';
import 'package:capartner/features/dashboard/vitals.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Heart rate in detail: the last 30 minutes, its spread, and what the
/// ranges mean.
class HeartRateScreen extends StatelessWidget {
  const HeartRateScreen({super.key, this.vitals = Vitals.empty});

  final Vitals vitals;

  @override
  Widget build(BuildContext context) {
    final history = vitals.heartRateHistory;
    return _VitalDetailScaffold(
      title: 'Heart Rate',
      icon: Icons.favorite_rounded,
      value: vitals.heartRateText,
      unit: 'BPM',
      status: vitals.heartRateStatus,
      statusDetail: vitals.heartRateLabel,
      sections: [
        const _SectionLabel('LAST 30 MINUTES'),
        if (history.isEmpty)
          const _NoDataCard()
        else
          _Card(
            child: VitalTrendChart(
              values: history,
              interval: const Duration(minutes: 1),
              normalLow: Vitals.restingLow.toDouble(),
              normalHigh: Vitals.restingHigh.toDouble(),
              unit: 'BPM',
            ),
          ),
        const _ChartHint(),
        _StatsRow(values: history, unit: 'BPM'),
        const _SectionLabel('RANGES'),
        _RangesCard(
          ranges: vitals.heartRateRanges,
          current: vitals.heartRateStatus,
        ),
        _GuidanceNote(
          status: vitals.heartRateStatus,
          stable:
              'Heart rate is in the normal resting range. The cap keeps '
              'checking every minute.',
          attention:
              'Heart rate is outside the resting range. Slow down, rest in '
              'the shade and drink water, then check again.',
          unstable: vitals.heartRateBelowSafe
              ? 'Heart rate is dangerously low. Sit down, check the cap is '
                    'snug on your head and send an SOS if you feel unwell.'
              : 'Heart rate is far above the safe range. Stop, sit down and '
                    'send an SOS if you feel unwell.',
        ),
      ],
    );
  }
}

/// Body temperature in detail: the last 2 hours, its spread, and what the
/// ranges mean.
class TemperatureScreen extends StatelessWidget {
  const TemperatureScreen({super.key, this.vitals = Vitals.empty});

  final Vitals vitals;

  @override
  Widget build(BuildContext context) {
    final history = vitals.temperatureHistory;
    return _VitalDetailScaffold(
      title: 'Body Temperature',
      icon: Icons.thermostat_rounded,
      value: vitals.bodyTemperatureText,
      unit: '°C',
      status: vitals.temperatureStatus,
      statusDetail: vitals.temperatureLabel,
      sections: [
        const _SectionLabel('LAST 2 HOURS'),
        if (history.isEmpty)
          const _NoDataCard()
        else
          _Card(
            child: VitalTrendChart(
              values: history,
              interval: const Duration(minutes: 5),
              normalLow: Vitals.normalTempLow,
              normalHigh: Vitals.normalTempHigh,
              unit: '°C',
              decimals: 1,
            ),
          ),
        const _ChartHint(),
        _StatsRow(values: history, unit: '°C', decimals: 1),
        const _SectionLabel('RANGES'),
        _RangesCard(
          ranges: vitals.temperatureRanges,
          current: vitals.temperatureStatus,
        ),
        _GuidanceNote(
          status: vitals.temperatureStatus,
          stable: 'Body temperature is normal.',
          attention: vitals.temperatureBelowSafe
              ? 'Temperature is below normal. Check the cap is touching '
                    'your skin, warm up and check again.'
              : 'Temperature is outside the normal range. Move out of the '
                    'sun, rest and drink water. Tell your admin if it keeps '
                    'rising.',
          unstable: vitals.temperatureBelowSafe
              ? 'Temperature is dangerously low. If the cap is on your skin '
                    'and you feel unwell, send an SOS. If it is not touching '
                    'your skin, put it back on and check again.'
              : 'Temperature is at a dangerous level. Stop working and send '
                    'an SOS so help can reach you.',
        ),
      ],
    );
  }
}

/// Motion in detail: what the cap sees now, today's activity and the safety
/// checks that use it.
class MotionScreen extends StatelessWidget {
  const MotionScreen({super.key, this.vitals = Vitals.empty});

  final Vitals vitals;

  @override
  Widget build(BuildContext context) {
    final today = vitals.motionToday;
    final activeMinutes = today
        .where((period) => period.active)
        .fold(0, (sum, period) => sum + period.minutes);
    final stillMinutes = today
        .where((period) => !period.active)
        .fold(0, (sum, period) => sum + period.minutes);

    return _VitalDetailScaffold(
      title: 'Motion Status',
      icon: vitals.motion?.icon ?? Icons.directions_walk_rounded,
      value: vitals.motionText,
      unit: null,
      status: vitals.motionStatus,
      statusDetail: vitals.motion == null
          ? 'No reading yet'
          : 'for ${vitals.stillMinutes} min',
      sections: [
        const _SectionLabel('TODAY'),
        if (today.isEmpty)
          const _NoDataCard()
        else
          _Card(child: _MotionTimeline(periods: today)),
        const SizedBox(height: 12),
        Row(
          spacing: 10,
          children: [
            Expanded(
              child: _StatTile(
                label: 'Active',
                value: today.isEmpty
                    ? Vitals.placeholder
                    : _duration(activeMinutes),
              ),
            ),
            Expanded(
              child: _StatTile(
                label: 'Still',
                value: today.isEmpty
                    ? Vitals.placeholder
                    : _duration(stillMinutes),
              ),
            ),
            const Expanded(
              child: _StatTile(label: 'Falls', value: '0'),
            ),
          ],
        ),
        const _SectionLabel('SAFETY CHECKS'),
        _Card(
          padding: EdgeInsets.zero,
          child: Column(
            children: [
              const _CheckRow(
                icon: Icons.personal_injury_outlined,
                title: 'Fall detection',
                detail: 'Sends an SOS if you fall and do not get up',
                value: 'On',
              ),
              const Divider(height: 1, color: AppColors.outline, indent: 16),
              _CheckRow(
                icon: Icons.timer_outlined,
                title: 'Inactivity alert',
                detail:
                    'Alerts your admin after '
                    '${Vitals.inactivityAlertMinutes} min without moving',
                value: 'On',
              ),
            ],
          ),
        ),
        const _SectionLabel('ACTIVITY LOG'),
        if (today.isEmpty)
          const _NoDataCard()
        else
          _Card(
            padding: EdgeInsets.zero,
            child: _ActivityLog(periods: today),
          ),
        _GuidanceNote(
          status: vitals.motionStatus,
          stable: 'Movement looks normal. Fall detection is watching.',
          attention:
              'You have not moved for a while. Your admin will be alerted '
              'if this goes on.',
          unstable: 'A fall was detected. Send an SOS if you need help.',
        ),
      ],
    );
  }
}

String _duration(int minutes) =>
    minutes < 60 ? '${minutes}m' : '${minutes ~/ 60}h ${minutes % 60}m';

/// Dark green header with the reading, then a white sheet of [sections].
class _VitalDetailScaffold extends StatelessWidget {
  const _VitalDetailScaffold({
    required this.title,
    required this.icon,
    required this.value,
    required this.unit,
    required this.status,
    required this.statusDetail,
    required this.sections,
  });

  final String title;
  final IconData icon;
  final String value;
  final String? unit;
  final VitalStatus status;

  /// Word or phrase beside the status pill, such as "Elevated".
  final String statusDetail;
  final List<Widget> sections;

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.darkGreen,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              _buildTopBar(context),
              _buildHero(),
              Expanded(
                child: Container(
                  width: double.infinity,
                  decoration: const BoxDecoration(
                    color: AppColors.surfaceGrey,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(28),
                    ),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: ListView(
                    padding: EdgeInsets.fromLTRB(20, 8, 20, 24 + bottomInset),
                    children: sections,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
      child: Row(
        children: [
          IconButton(
            tooltip: 'Back',
            onPressed: () => Navigator.of(context).maybePop(),
            style: IconButton.styleFrom(
              backgroundColor: AppColors.white.withValues(alpha: 0.12),
              foregroundColor: AppColors.white,
            ),
            icon: const Icon(Icons.arrow_back_rounded),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: appTextStyle(
                fontSize: 20,
                lineHeight: 26,
                weight: FontWeight.w800,
                color: AppColors.white,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHero() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 20, 24, 24),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(icon, size: 30, color: AppColors.white),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        value,
                        style: appTextStyle(
                          fontSize: unit == null ? 32 : 48,
                          lineHeight: unit == null ? 40 : 52,
                          weight: FontWeight.w900,
                          color: AppColors.white,
                          letterSpacing: unit == null ? -0.5 : -2,
                        ),
                      ),
                      if (unit != null) ...[
                        const SizedBox(width: 6),
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Text(
                            unit!,
                            style: appTextStyle(
                              fontSize: 16,
                              lineHeight: 20,
                              weight: FontWeight.w800,
                              color: AppColors.white.withValues(alpha: 0.7),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    VitalStatusPill(status: status, onDark: true),
                    Text(
                      status == VitalStatus.noData
                          ? statusDetail
                          : '$statusDetail · updated 2s ago',
                      style: appTextStyle(
                        fontSize: 12,
                        lineHeight: 16,
                        weight: FontWeight.w600,
                        color: AppColors.white.withValues(alpha: 0.75),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Status with its icon and label, so it never rests on colour alone.
class VitalStatusPill extends StatelessWidget {
  const VitalStatusPill({super.key, required this.status, this.onDark = false});

  final VitalStatus status;

  /// Drawn on dark green, where a solid pill reads better.
  final bool onDark;

  @override
  Widget build(BuildContext context) {
    final foreground = onDark ? AppColors.white : _textColor;
    return Container(
      padding: const EdgeInsets.fromLTRB(6, 4, 10, 4),
      decoration: BoxDecoration(
        color: onDark ? status.color : status.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(50),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(status.icon, size: 14, color: foreground),
          const SizedBox(width: 4),
          Text(
            status.label,
            style: appTextStyle(
              fontSize: 11,
              lineHeight: 14,
              weight: FontWeight.w800,
              color: foreground,
            ),
          ),
        ],
      ),
    );
  }

  /// Darker than [VitalStatus.color] so the label stays readable on its
  /// light tint.
  Color get _textColor => switch (status) {
    VitalStatus.noData => AppColors.bodyText,
    VitalStatus.stable => AppColors.green,
    VitalStatus.attention => const Color(0xFF7A5A00),
    VitalStatus.unstable => AppColors.red,
  };
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 20, 4, 10),
      child: Text(
        text,
        style: appTextStyle(
          fontSize: 12,
          lineHeight: 16,
          weight: FontWeight.w800,
          color: AppColors.mutedText,
          letterSpacing: 1,
        ),
      ),
    );
  }
}

class _Card extends StatelessWidget {
  const _Card({required this.child, this.padding = const EdgeInsets.all(16)});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: AppColors.white,
        border: Border.all(color: AppColors.outline),
        borderRadius: BorderRadius.circular(18),
      ),
      child: child,
    );
  }
}

class _ChartHint extends StatelessWidget {
  const _ChartHint();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 12),
      child: Row(
        children: [
          Container(
            width: 14,
            height: 8,
            decoration: BoxDecoration(
              color: AppColors.mint,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              'Normal range · touch the chart to read a point',
              style: appTextStyle(
                fontSize: 11,
                lineHeight: 14,
                weight: FontWeight.w500,
                color: AppColors.mutedText,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Lowest, average and highest of [values].
class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.values,
    required this.unit,
    this.decimals = 0,
  });

  final List<double> values;
  final String unit;
  final int decimals;

  @override
  Widget build(BuildContext context) {
    if (values.isEmpty) {
      return const Row(
        spacing: 10,
        children: [
          Expanded(
            child: _StatTile(label: 'Lowest', value: Vitals.placeholder),
          ),
          Expanded(
            child: _StatTile(label: 'Average', value: Vitals.placeholder),
          ),
          Expanded(
            child: _StatTile(label: 'Highest', value: Vitals.placeholder),
          ),
        ],
      );
    }
    final average = values.reduce((a, b) => a + b) / values.length;
    String format(double value) => '${value.toStringAsFixed(decimals)} $unit';

    return Row(
      spacing: 10,
      children: [
        Expanded(
          child: _StatTile(
            label: 'Lowest',
            value: format(values.reduce(math.min)),
          ),
        ),
        Expanded(
          child: _StatTile(label: 'Average', value: format(average)),
        ),
        Expanded(
          child: _StatTile(
            label: 'Highest',
            value: format(values.reduce(math.max)),
          ),
        ),
      ],
    );
  }
}

/// Stands in for a chart or list until the cap has sent readings.
class _NoDataCard extends StatelessWidget {
  const _NoDataCard();

  @override
  Widget build(BuildContext context) {
    return _Card(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 28),
      child: Column(
        children: [
          const Icon(
            Icons.sensors_off_rounded,
            size: 28,
            color: AppColors.mutedText,
          ),
          const SizedBox(height: 8),
          Text(
            'No data yet',
            style: appTextStyle(
              fontSize: 14,
              lineHeight: 18,
              weight: FontWeight.w800,
              color: AppColors.ink,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            'Readings appear here once your Smart Cap sends them.',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 12,
              lineHeight: 16,
              weight: FontWeight.w500,
              color: AppColors.mutedText,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return _Card(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: appTextStyle(
              fontSize: 11,
              lineHeight: 14,
              weight: FontWeight.w600,
              color: AppColors.mutedText,
            ),
          ),
          const SizedBox(height: 4),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Text(
              value,
              maxLines: 1,
              style: appTextStyle(
                fontSize: 16,
                lineHeight: 20,
                weight: FontWeight.w800,
                color: AppColors.ink,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Each range with its status; the one the reading is in is marked.
class _RangesCard extends StatelessWidget {
  const _RangesCard({required this.ranges, required this.current});

  final List<VitalRange> ranges;
  final VitalStatus current;

  @override
  Widget build(BuildContext context) {
    return _Card(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Column(
        children: [
          for (final range in ranges)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: range.status == current
                    ? range.status.color.withValues(alpha: 0.08)
                    : null,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(range.status.icon, size: 20, color: range.status.color),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          range.label,
                          style: appTextStyle(
                            fontSize: 13,
                            lineHeight: 18,
                            weight: FontWeight.w800,
                            color: AppColors.ink,
                          ),
                        ),
                        Text(
                          '${range.status.label} · ${range.description}',
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
                  if (range.status == current) ...[
                    const SizedBox(width: 8),
                    Text(
                      'NOW',
                      style: appTextStyle(
                        fontSize: 10,
                        lineHeight: 14,
                        weight: FontWeight.w900,
                        color: AppColors.ink,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// What to do about the reading, for its [status].
class _GuidanceNote extends StatelessWidget {
  const _GuidanceNote({
    required this.status,
    required this.stable,
    required this.attention,
    required this.unstable,
  });

  final VitalStatus status;
  final String stable;
  final String attention;
  final String unstable;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: status.color.withValues(alpha: 0.08),
          border: Border.all(color: status.color.withValues(alpha: 0.3)),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.lightbulb_outline_rounded,
              size: 20,
              color: status.color,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                switch (status) {
                  VitalStatus.noData =>
                    'No reading from your Smart Cap yet. Make sure it is '
                        'paired and switched on.',
                  VitalStatus.stable => stable,
                  VitalStatus.attention => attention,
                  VitalStatus.unstable => unstable,
                },
                style: appTextStyle(
                  fontSize: 13,
                  lineHeight: 19,
                  weight: FontWeight.w500,
                  color: AppColors.ink,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Today as one bar: active stretches in green, still ones in mint.
class _MotionTimeline extends StatelessWidget {
  const _MotionTimeline({required this.periods});

  final List<MotionPeriod> periods;

  @override
  Widget build(BuildContext context) {
    final total = periods.fold(0, (sum, period) => sum + period.minutes);
    final legendStyle = appTextStyle(
      fontSize: 12,
      lineHeight: 16,
      weight: FontWeight.w600,
      color: AppColors.bodyText,
    );

    Widget legend(Color color, String label) => Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 6),
        Text(label, style: legendStyle),
      ],
    );

    return Semantics(
      label:
          'Activity today, ${periods.length} periods over '
          '${_duration(total)}',
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              spacing: 16,
              children: [
                legend(AppColors.green, 'Active'),
                legend(AppColors.mint, 'Still'),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 28,
              child: Row(
                spacing: 2,
                children: [
                  for (final period in periods)
                    Expanded(
                      flex: period.minutes,
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          color: period.active
                              ? AppColors.green
                              : AppColors.mint,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text('Shift start', style: legendStyle),
                const Spacer(),
                Text('Now', style: legendStyle),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Today's periods, newest first.
class _ActivityLog extends StatelessWidget {
  const _ActivityLog({required this.periods});

  final List<MotionPeriod> periods;

  @override
  Widget build(BuildContext context) {
    final newestFirst = periods.reversed.toList();
    return Column(
      children: [
        for (var i = 0; i < newestFirst.length; i++) ...[
          if (i > 0)
            const Divider(height: 1, color: AppColors.outline, indent: 60),
          _buildEntry(newestFirst[i], isCurrent: i == 0),
        ],
      ],
    );
  }

  Widget _buildEntry(MotionPeriod period, {required bool isCurrent}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: period.active ? AppColors.green : AppColors.mint,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              period.active
                  ? Icons.directions_walk_rounded
                  : Icons.accessibility_new_rounded,
              size: 18,
              color: period.active ? AppColors.white : AppColors.green,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  period.label,
                  style: appTextStyle(
                    fontSize: 14,
                    lineHeight: 18,
                    weight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                Text(
                  period.active ? 'Active' : 'Still',
                  style: appTextStyle(
                    fontSize: 12,
                    lineHeight: 16,
                    weight: FontWeight.w500,
                    color: AppColors.mutedText,
                  ),
                ),
              ],
            ),
          ),
          Text(
            isCurrent
                ? 'Now · ${_duration(period.minutes)}'
                : _duration(period.minutes),
            style: appTextStyle(
              fontSize: 12,
              lineHeight: 16,
              weight: FontWeight.w700,
              color: isCurrent ? AppColors.green : AppColors.bodyText,
            ),
          ),
        ],
      ),
    );
  }
}

class _CheckRow extends StatelessWidget {
  const _CheckRow({
    required this.icon,
    required this.title,
    required this.detail,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String detail;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(icon, size: 22, color: AppColors.green),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: appTextStyle(
                    fontSize: 14,
                    lineHeight: 18,
                    weight: FontWeight.w700,
                    color: AppColors.ink,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  detail,
                  style: appTextStyle(
                    fontSize: 12,
                    lineHeight: 16,
                    weight: FontWeight.w500,
                    color: AppColors.mutedText,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.mint,
              borderRadius: BorderRadius.circular(50),
            ),
            child: Text(
              value,
              style: appTextStyle(
                fontSize: 11,
                lineHeight: 14,
                weight: FontWeight.w800,
                color: AppColors.green,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
