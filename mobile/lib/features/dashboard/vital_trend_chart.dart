import 'dart:math' as math;

import 'package:flutter/material.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Line chart of one reading over time, with its normal range shaded.
///
/// Touching or dragging along it shows the reading at that point.
class VitalTrendChart extends StatefulWidget {
  const VitalTrendChart({
    super.key,
    required this.values,
    required this.interval,
    required this.normalLow,
    required this.normalHigh,
    required this.unit,
    this.decimals = 0,
    this.height = 180,
  });

  /// Readings at a steady [interval], oldest first; the last one is now.
  final List<double> values;
  final Duration interval;

  final double normalLow;
  final double normalHigh;
  final String unit;

  /// Decimal places for the values shown.
  final int decimals;
  final double height;

  @override
  State<VitalTrendChart> createState() => _VitalTrendChartState();
}

class _VitalTrendChartState extends State<VitalTrendChart> {
  /// Reading under the finger, or null when the chart is not touched.
  int? _selected;

  static const double _axisWidth = 36;
  static const double _bottomAxis = 22;

  void _select(Offset position, double width) {
    final plotWidth = width - _axisWidth;
    final fraction = ((position.dx - _axisWidth) / plotWidth).clamp(0.0, 1.0);
    final index = (fraction * (widget.values.length - 1)).round();
    if (index != _selected) setState(() => _selected = index);
  }

  void _clear() => setState(() => _selected = null);

  String _format(double value) => value.toStringAsFixed(widget.decimals);

  /// How long before now reading [index] was taken.
  String _ago(int index) {
    final steps = widget.values.length - 1 - index;
    if (steps == 0) return 'Now';
    final minutes = widget.interval.inMinutes * steps;
    return minutes < 60
        ? '$minutes min ago'
        : '${minutes ~/ 60} h ${minutes % 60} min ago';
  }

  @override
  Widget build(BuildContext context) {
    final latest = widget.values.last;

    return Semantics(
      label:
          'Trend chart, ${_format(latest)} ${widget.unit} now. Normal range '
          '${_format(widget.normalLow)} to ${_format(widget.normalHigh)}.',
      child: ExcludeSemantics(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final width = constraints.maxWidth;
            return GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTapDown: (details) => _select(details.localPosition, width),
              onTapUp: (_) => _clear(),
              onHorizontalDragStart: (details) =>
                  _select(details.localPosition, width),
              onHorizontalDragUpdate: (details) =>
                  _select(details.localPosition, width),
              onHorizontalDragEnd: (_) => _clear(),
              onHorizontalDragCancel: _clear,
              child: SizedBox(
                width: width,
                height: widget.height,
                child: CustomPaint(
                  painter: _TrendPainter(
                    values: widget.values,
                    normalLow: widget.normalLow,
                    normalHigh: widget.normalHigh,
                    selected: _selected,
                    axisWidth: _axisWidth,
                    bottomAxis: _bottomAxis,
                    format: _format,
                    startLabel: _ago(0),
                    labelStyle: appTextStyle(
                      fontSize: 10,
                      lineHeight: 12,
                      weight: FontWeight.w600,
                      color: AppColors.mutedText,
                    ),
                    tooltipStyle: appTextStyle(
                      fontSize: 12,
                      lineHeight: 16,
                      weight: FontWeight.w800,
                      color: AppColors.white,
                    ),
                    tooltipText: _selected == null
                        ? null
                        : '${_format(widget.values[_selected!])} '
                              '${widget.unit} · ${_ago(_selected!)}',
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _TrendPainter extends CustomPainter {
  _TrendPainter({
    required this.values,
    required this.normalLow,
    required this.normalHigh,
    required this.selected,
    required this.axisWidth,
    required this.bottomAxis,
    required this.format,
    required this.startLabel,
    required this.labelStyle,
    required this.tooltipStyle,
    required this.tooltipText,
  });

  final List<double> values;
  final double normalLow;
  final double normalHigh;
  final int? selected;
  final double axisWidth;
  final double bottomAxis;
  final String Function(double) format;
  final String startLabel;
  final TextStyle labelStyle;
  final TextStyle tooltipStyle;
  final String? tooltipText;

  @override
  void paint(Canvas canvas, Size size) {
    // Room above the plot for the tooltip.
    const top = 30.0;
    final plot = Rect.fromLTRB(
      axisWidth,
      top,
      size.width - 8,
      size.height - bottomAxis,
    );

    // The scale always takes in the normal band, with some headroom.
    var low = math.min(values.reduce(math.min), normalLow);
    var high = math.max(values.reduce(math.max), normalHigh);
    final pad = (high - low) * 0.15;
    low -= pad;
    high += pad;

    double y(double value) =>
        plot.bottom - (value - low) / (high - low) * plot.height;
    double x(int index) => plot.left + index / (values.length - 1) * plot.width;

    // Normal band.
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTRB(plot.left, y(normalHigh), plot.right, y(normalLow)),
        const Radius.circular(4),
      ),
      Paint()..color = AppColors.mint.withValues(alpha: 0.7),
    );

    // Recessive grid on the band's edges, labelled on the left.
    final grid = Paint()
      ..color = AppColors.outline
      ..strokeWidth = 1;
    for (final value in [normalLow, normalHigh]) {
      canvas.drawLine(
        Offset(plot.left, y(value)),
        Offset(plot.right, y(value)),
        grid,
      );
      _text(
        canvas,
        format(value),
        labelStyle,
        Offset(axisWidth - 6, y(value)),
        alignRight: true,
      );
    }
    canvas.drawLine(
      Offset(plot.left, plot.bottom),
      Offset(plot.right, plot.bottom),
      grid,
    );

    // Time labels.
    _text(canvas, startLabel, labelStyle, Offset(plot.left, plot.bottom + 12));
    _text(
      canvas,
      'Now',
      labelStyle,
      Offset(plot.right, plot.bottom + 12),
      alignRight: true,
    );

    // Area under the line, then the 2px line itself.
    final line = Path()..moveTo(x(0), y(values.first));
    for (var i = 1; i < values.length; i++) {
      final previous = Offset(x(i - 1), y(values[i - 1]));
      final current = Offset(x(i), y(values[i]));
      final midX = (previous.dx + current.dx) / 2;
      line.cubicTo(midX, previous.dy, midX, current.dy, current.dx, current.dy);
    }
    final area = Path.from(line)
      ..lineTo(plot.right, plot.bottom)
      ..lineTo(plot.left, plot.bottom)
      ..close();
    canvas.drawPath(
      area,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.green.withValues(alpha: 0.18),
            AppColors.green.withValues(alpha: 0),
          ],
        ).createShader(plot),
    );
    canvas.drawPath(
      line,
      Paint()
        ..color = AppColors.green
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2
        ..strokeCap = StrokeCap.round
        ..strokeJoin = StrokeJoin.round,
    );

    // The latest reading, or the touched one with a crosshair.
    final marked = selected ?? values.length - 1;
    final point = Offset(x(marked), y(values[marked]));
    if (selected != null) {
      canvas.drawLine(
        Offset(point.dx, plot.top),
        Offset(point.dx, plot.bottom),
        Paint()
          ..color = AppColors.darkGreen.withValues(alpha: 0.35)
          ..strokeWidth = 1,
      );
    }
    canvas.drawCircle(point, 6, Paint()..color = AppColors.white);
    canvas.drawCircle(point, 4.5, Paint()..color = AppColors.darkGreen);

    final tooltip = tooltipText;
    if (tooltip != null) _drawTooltip(canvas, size, tooltip, point.dx);
  }

  void _drawTooltip(Canvas canvas, Size size, String text, double centerX) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: tooltipStyle),
      textDirection: TextDirection.ltr,
    )..layout();
    final width = painter.width + 20;
    const height = 26.0;
    final left = (centerX - width / 2).clamp(0.0, size.width - width);
    final box = RRect.fromRectAndRadius(
      Rect.fromLTWH(left, 0, width, height),
      const Radius.circular(8),
    );
    canvas.drawRRect(box, Paint()..color = AppColors.darkGreen);
    painter.paint(canvas, Offset(left + 10, (height - painter.height) / 2));
  }

  /// Draws [text] vertically centred on [anchor].
  void _text(
    Canvas canvas,
    String text,
    TextStyle style,
    Offset anchor, {
    bool alignRight = false,
  }) {
    final painter = TextPainter(
      text: TextSpan(text: text, style: style),
      textDirection: TextDirection.ltr,
    )..layout();
    painter.paint(
      canvas,
      Offset(
        alignRight ? anchor.dx - painter.width : anchor.dx,
        anchor.dy - painter.height / 2,
      ),
    );
  }

  @override
  bool shouldRepaint(_TrendPainter old) =>
      old.selected != selected || old.values != values;
}
