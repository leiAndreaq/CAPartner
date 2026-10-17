import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Loading screen shown right after logging in.
///
/// Based on the Welcome page of the design, except that nothing needs to be
/// tapped: [onDone] is called by itself after [duration].
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({
    super.key,
    this.name = '',
    this.onDone,
    this.duration = const Duration(seconds: 2),
  });

  /// The user's name, greeted by first name when known.
  final String name;
  final VoidCallback? onDone;
  final Duration duration;

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  late final Timer _timer = Timer(widget.duration, () => widget.onDone?.call());

  @override
  void initState() {
    super.initState();
    // Touching the late field starts the countdown.
    _timer;
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final firstName = widget.name.trim().split(' ').first;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      // Leaving mid-load would drop the user back on the login form.
      child: PopScope(
        canPop: false,
        child: Scaffold(
          backgroundColor: AppColors.darkGreen,
          body: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Image.asset(
                    'assets/images/cap_logo.png',
                    width: 205,
                    height: 205,
                    fit: BoxFit.cover,
                    semanticLabel: 'CAPartner logo',
                  ),
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      firstName.isEmpty ? 'Welcome!' : 'Welcome, $firstName!',
                      maxLines: 1,
                      style: authTextStyle(
                        color: AppColors.white,
                        fontSize: 40,
                        lineHeight: 43.5,
                        weight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Text(
                    'CAPartner sa Kalusugan, CAPartner sa Kaligtasan.',
                    textAlign: TextAlign.center,
                    style: authTextStyle(
                      color: AppColors.white,
                      fontSize: 12,
                      lineHeight: 30,
                      weight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 40),
                  const SizedBox(
                    width: 32,
                    height: 32,
                    child: CircularProgressIndicator(
                      color: AppColors.white,
                      strokeWidth: 3,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Getting things ready…',
                    textAlign: TextAlign.center,
                    style: authTextStyle(
                      color: AppColors.white,
                      fontSize: 14,
                      lineHeight: 20,
                      weight: FontWeight.w400,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
