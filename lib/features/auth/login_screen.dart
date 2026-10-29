import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';

import 'package:capartner/features/account/privacy_policy_screen.dart';
import 'package:capartner/features/auth/widgets/verification_layout.dart';
import 'package:capartner/theme/app_colors.dart';
import 'package:capartner/theme/app_text_styles.dart';

/// Checks the entered credentials; returns the message to show when they are
/// rejected, or null once the user is on their way in.
typedef LoginCallback = Future<String?> Function(
  String identifier,
  String password,
  bool rememberMe,
);

/// Login screen, in the style of the verification steps: the logo and a greeting
/// on green, with the form on a white sheet below.
///
/// The sheet starts hidden, leaving the logo alone in the middle; swiping up
/// slides it in and swiping down hides it again.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, this.onLogin, this.onForgotPassword});

  final LoginCallback? onLogin;
  final VoidCallback? onForgotPassword;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  static const double _sheetRadius = 32;

  final TextEditingController _identifierController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final FocusNode _identifierFocusNode = FocusNode();
  final FocusNode _passwordFocusNode = FocusNode();

  late final AnimationController _entrance = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 550),
  );
  late final Animation<double> _heroFade = CurvedAnimation(
    parent: _entrance,
    curve: const Interval(0, 0.7, curve: Curves.easeOut),
  );

  /// Springy enough that the sheet overshoots a little and bounces back
  /// when it is let go.
  static final SpringDescription _sheetSpring =
      SpringDescription.withDampingRatio(mass: 1, stiffness: 260, ratio: 0.6);

  /// How far the form sheet is pulled up: 0 hidden, 1 fully shown. Unbounded
  /// so the spring can carry it briefly past either end.
  late final AnimationController _reveal = AnimationController.unbounded(
    vsync: this,
  );

  /// Whether the form is open, or on its way open.
  bool _formOpen = false;

  /// Height of the form sheet, measured once it is laid out.
  double _sheetHeight = 0;

  bool _rememberMe = true;
  bool _showErrors = false;
  bool _signingIn = false;

  /// Message returned by [LoginScreen.onLogin] for the last attempt.
  String? _loginError;

  String get _identifier => _identifierController.text.trim();
  String get _password => _passwordController.text;
  bool get _isFilled => _identifier.isNotEmpty && _password.isNotEmpty;

  String? get _identifierError =>
      _identifier.isEmpty ? 'Please enter your email or username.' : null;
  String? get _passwordError =>
      _password.isEmpty ? 'Please enter your password.' : null;

  @override
  void initState() {
    super.initState();
    _identifierController.addListener(_onInputChanged);
    _passwordController.addListener(_onInputChanged);
    // Repaints the field borders as focus moves.
    _identifierFocusNode.addListener(_onFocusChanged);
    _passwordFocusNode.addListener(_onFocusChanged);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _entrance.value = 1;
    } else if (_entrance.isDismissed) {
      _entrance.forward();
    }
  }

  @override
  void dispose() {
    _entrance.dispose();
    _reveal.dispose();
    _identifierController.dispose();
    _passwordController.dispose();
    _identifierFocusNode.dispose();
    _passwordFocusNode.dispose();
    super.dispose();
  }

  void _onInputChanged() => setState(() => _loginError = null);

  void _onFocusChanged() => setState(() {});

  Future<void> _submit() async {
    if (_signingIn) return;
    if (!_isFilled) {
      setState(() => _showErrors = true);
      (_identifier.isEmpty ? _identifierFocusNode : _passwordFocusNode)
          .requestFocus();
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _signingIn = true;
      _loginError = null;
    });
    final error = await widget.onLogin?.call(
      _identifier,
      _password,
      _rememberMe,
    );
    if (!mounted) return;
    setState(() {
      _signingIn = false;
      _showErrors = error != null;
      _loginError = error;
    });
    if (error != null) _passwordFocusNode.requestFocus();
  }

  void _showForm({double velocity = 0}) => _settleSheet(1, velocity);

  void _hideForm({double velocity = 0}) {
    FocusScope.of(context).unfocus();
    _settleSheet(0, velocity);
  }

  /// Springs the sheet to [target] (0 hidden, 1 shown), starting at the
  /// fling's [velocity] in sheet heights per second, so it bounces as it
  /// lands.
  void _settleSheet(double target, double velocity) {
    setState(() => _formOpen = target == 1);
    if (MediaQuery.disableAnimationsOf(context)) {
      _reveal.value = target;
      return;
    }
    _reveal
        .animateWith(
          SpringSimulation(_sheetSpring, _reveal.value, target, velocity),
        )
        // The spring stops within a hair of the target; land on it exactly
        // so a hidden sheet is fully hidden.
        .then((_) => _reveal.value = target);
  }

  /// Drags the sheet along with the finger.
  void _onDragUpdate(DragUpdateDetails details) {
    if (_sheetHeight == 0) return;
    _reveal.value = (_reveal.value - details.primaryDelta! / _sheetHeight)
        .clamp(0.0, 1.0);
  }

  /// Finishes a swipe: a quick flick goes its way, a slow drag snaps to the
  /// nearer end.
  void _onDragEnd(DragEndDetails details) {
    final velocity = details.primaryVelocity ?? 0;
    final open = velocity.abs() > 300 ? velocity < 0 : _reveal.value >= 0.5;
    // Upward drags are negative on screen but open the sheet.
    final sheetVelocity = _sheetHeight == 0 ? 0.0 : -velocity / _sheetHeight;
    open
        ? _showForm(velocity: sheetVelocity)
        : _hideForm(velocity: sheetVelocity);
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;

    // Back closes the form before it leaves the screen.
    return PopScope(
      canPop: !_formOpen,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _hideForm();
      },
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.light,
        child: Scaffold(
          backgroundColor: AppColors.darkGreen,
          body: SafeArea(
            bottom: false,
            child: LayoutBuilder(
              builder: (context, constraints) {
                return GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onVerticalDragUpdate: _onDragUpdate,
                  onVerticalDragEnd: _onDragEnd,
                  child: AnimatedBuilder(
                    animation: _reveal,
                    builder: (context, _) =>
                        _buildLayers(constraints.biggest, bottomInset),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  /// The hero centred in the space the sheet leaves, the swipe hint at the
  /// bottom while the form is hidden, and the sheet sliding up from below.
  Widget _buildLayers(Size size, double bottomInset) {
    final reveal = _reveal.value;
    final shown = _sheetHeight * reveal;
    // While the spring carries the sheet past fully open, white fills the
    // gap it leaves at the bottom of the screen.
    final overshoot = shown - _sheetHeight;

    return Stack(
      children: [
        Positioned(
          left: 0,
          right: 0,
          top: 0,
          bottom: shown,
          child: FadeTransition(
            opacity: _heroFade,
            alwaysIncludeSemantics: true,
            // Shrinks the hero rather than overflowing when the keyboard
            // leaves little room above the sheet.
            child: Center(
              child: FittedBox(
                fit: BoxFit.scaleDown,
                child: SizedBox(
                  width: size.width,
                  child: _buildHero(size.height),
                ),
              ),
            ),
          ),
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 20 + bottomInset,
          child: IgnorePointer(
            ignoring: reveal > 0,
            child: FadeTransition(
              opacity: _heroFade,
              child: Opacity(
                opacity: (1 - reveal * 2).clamp(0.0, 1.0),
                child: _SwipeHint(onTap: _showForm),
              ),
            ),
          ),
        ),
        if (overshoot > 0)
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: overshoot + _sheetRadius,
            child: const ColoredBox(color: AppColors.white),
          ),
        Positioned(
          left: 0,
          right: 0,
          bottom: overshoot,
          // Kept laid out while hidden so its height is known before the
          // first swipe.
          child: Visibility(
            visible: reveal > 0,
            maintainState: true,
            child: _MeasureSize(
              onChange: (sheetSize) {
                if (sheetSize.height != _sheetHeight) {
                  setState(() => _sheetHeight = sheetSize.height);
                }
              },
              child: ConstrainedBox(
                constraints: BoxConstraints(maxHeight: size.height),
                child: _buildSheet(context),
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// [height] is the height of the screen below the status bar.
  Widget _buildHero(double height) {
    final compact = VerificationScaffold.isCompact(context);
    final logoSize = (height * 0.17).clamp(84.0, 150.0);

    return Padding(
      padding: EdgeInsets.fromLTRB(32, 16, 32, compact ? 20 : 28),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _PulsingLogo(size: logoSize),
          SizedBox(height: compact ? 14 : 20),
          Text(
            'Welcome back',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 28,
              lineHeight: 34,
              weight: FontWeight.w800,
              color: AppColors.white,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Log in to continue to your CAPartner account.',
            textAlign: TextAlign.center,
            style: appTextStyle(
              fontSize: 14,
              lineHeight: 20,
              weight: FontWeight.w400,
              color: AppColors.white.withValues(alpha: 0.75),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSheet(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;
    final compact = VerificationScaffold.isCompact(context);
    final identifierError = _showErrors ? _identifierError : null;
    final passwordError = _showErrors ? _passwordError : null;

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(_sheetRadius)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildHandle(),
          // Scrolls only when the keyboard or a short screen leaves too
          // little room; the handle above can always swipe the sheet away.
          Flexible(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                VerificationScaffold.horizontalPadding,
                compact ? 12 : 20,
                VerificationScaffold.horizontalPadding,
                20 + bottomInset,
              ),
              child: _buildForm(identifierError, passwordError, compact),
            ),
          ),
        ],
      ),
    );
  }

  /// Grab bar at the top of the sheet; tapping it also hides the form.
  Widget _buildHandle() {
    return Semantics(
      button: true,
      label: 'Hide login form',
      onTap: _hideForm,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _hideForm,
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.only(top: 12, bottom: 4),
          alignment: Alignment.center,
          child: Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.outline,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildForm(
    String? identifierError,
    String? passwordError,
    bool compact,
  ) {
    return AutofillGroup(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const VerificationLabel('Email or username'),
          const SizedBox(height: 8),
          _LoginField(
            controller: _identifierController,
            focusNode: _identifierFocusNode,
            icon: Icons.person_outline_rounded,
            hintText: 'you@gmail.com',
            hasError: identifierError != null || _loginError != null,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            autofillHints: const [AutofillHints.username, AutofillHints.email],
            inputFormatters: [
              FilteringTextInputFormatter.deny(RegExp(r'\s')),
              LengthLimitingTextInputFormatter(254),
            ],
            onEditingComplete: _passwordFocusNode.requestFocus,
          ),
          _FieldMessage(message: identifierError),
          const VerificationLabel('Password'),
          const SizedBox(height: 8),
          _LoginField(
            controller: _passwordController,
            focusNode: _passwordFocusNode,
            icon: Icons.lock_outline_rounded,
            hintText: 'Enter your password',
            hasError: passwordError != null || _loginError != null,
            obscurable: true,
            keyboardType: TextInputType.visiblePassword,
            textInputAction: TextInputAction.done,
            autofillHints: const [AutofillHints.password],
            inputFormatters: [LengthLimitingTextInputFormatter(64)],
            onEditingComplete: _submit,
          ),
          _FieldMessage(message: passwordError),
          _buildOptionsRow(),
          _buildLoginError(),
          const SizedBox(height: 16),
          _buildLoginButton(),
          SizedBox(height: compact ? 16 : 20),
          const VerificationNote(
            icon: Icons.verified_user_outlined,
            text: 'Your data is encrypted and kept private.',
          ),
          const SizedBox(height: 6),
          _buildPolicyLink(),
        ],
      ),
    );
  }

  Widget _buildOptionsRow() {
    return Row(
      children: [
        _RememberMe(
          value: _rememberMe,
          onChanged: (value) => setState(() => _rememberMe = value),
        ),
        const SizedBox(width: 8),
        // Shrinks the link instead of overflowing at large text sizes.
        Expanded(
          child: Align(
            alignment: Alignment.centerRight,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: TextButton(
                onPressed: widget.onForgotPassword,
                style: TextButton.styleFrom(
                  foregroundColor: AppColors.green,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  textStyle: appTextStyle(
                    fontSize: 13,
                    weight: FontWeight.w700,
                    color: AppColors.green,
                  ),
                ),
                child: const Text('Forgot Password?'),
              ),
            ),
          ),
        ),
      ],
    );
  }

  /// Banner shown when the credentials were rejected, so the message is not
  /// tied to either field.
  Widget _buildLoginError() {
    final error = _loginError;
    return AnimatedSize(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      alignment: Alignment.topCenter,
      child: error == null
          ? const SizedBox(width: double.infinity)
          : Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Semantics(
                liveRegion: true,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: AppColors.error.withValues(alpha: 0.25),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.error_outline_rounded,
                        size: 20,
                        color: AppColors.error,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          error,
                          style: appTextStyle(
                            fontSize: 13,
                            lineHeight: 18,
                            weight: FontWeight.w600,
                            color: AppColors.error,
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

  Widget _buildLoginButton() {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: _submit,
        style: FilledButton.styleFrom(
          backgroundColor: _isFilled || _signingIn
              ? AppColors.darkGreen
              : AppColors.darkGreen.withValues(alpha: 0.5),
          foregroundColor: AppColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          textStyle: appTextStyle(
            fontSize: 16,
            weight: FontWeight.w700,
            color: AppColors.white,
          ),
        ),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 200),
          child: _signingIn
              ? const SizedBox.square(
                  key: ValueKey('signing-in'),
                  dimension: 22,
                  child: CircularProgressIndicator(
                    strokeWidth: 2.5,
                    color: AppColors.white,
                    semanticsLabel: 'Logging in',
                  ),
                )
              : const Text('Log In', key: ValueKey('label')),
        ),
      ),
    );
  }

  Widget _buildPolicyLink() {
    return Center(
      child: TextButton(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => const PrivacyPolicyScreen()),
        ),
        style: TextButton.styleFrom(
          foregroundColor: AppColors.mutedText,
          visualDensity: VisualDensity.compact,
          textStyle: appTextStyle(
            fontSize: 12,
            weight: FontWeight.w600,
            color: AppColors.mutedText,
          ).copyWith(decoration: TextDecoration.underline),
        ),
        child: const Text('Privacy Policy'),
      ),
    );
  }
}

/// "Swipe up to log in" with a chevron that floats up and down; tapping it
/// also opens the form.
class _SwipeHint extends StatefulWidget {
  const _SwipeHint({required this.onTap});

  final VoidCallback onTap;

  @override
  State<_SwipeHint> createState() => _SwipeHintState();
}

class _SwipeHintState extends State<_SwipeHint>
    with SingleTickerProviderStateMixin {
  late final AnimationController _float = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      _float.stop();
    } else if (!_float.isAnimating) {
      _float.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _float.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final color = AppColors.white.withValues(alpha: 0.8);

    return Center(
      child: Semantics(
        button: true,
        label: 'Show login form',
        excludeSemantics: true,
        onTap: widget.onTap,
        child: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: widget.onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 8),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                AnimatedBuilder(
                  animation: _float,
                  builder: (context, child) => Transform.translate(
                    offset: Offset(
                      0,
                      -6 * Curves.easeInOut.transform(_float.value),
                    ),
                    child: child,
                  ),
                  child: Icon(
                    Icons.keyboard_arrow_up_rounded,
                    size: 32,
                    color: color,
                  ),
                ),
                Text(
                  'Swipe up to log in',
                  style: appTextStyle(
                    fontSize: 13,
                    weight: FontWeight.w600,
                    color: color,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Lets the login screen know the size of [child] after each layout that
/// changes it.
class _MeasureSize extends SingleChildRenderObjectWidget {
  const _MeasureSize({required this.onChange, required super.child});

  final ValueChanged<Size> onChange;

  @override
  RenderObject createRenderObject(BuildContext context) =>
      _RenderMeasureSize(onChange);

  @override
  void updateRenderObject(
    BuildContext context,
    _RenderMeasureSize renderObject,
  ) {
    renderObject.onChange = onChange;
  }
}

class _RenderMeasureSize extends RenderProxyBox {
  _RenderMeasureSize(this.onChange);

  ValueChanged<Size> onChange;
  Size? _lastSize;

  @override
  void performLayout() {
    super.performLayout();
    if (size == _lastSize) return;
    _lastSize = size;
    // Layout is no place to rebuild; report once the frame is done.
    WidgetsBinding.instance.addPostFrameCallback((_) => onChange(size));
  }
}

/// The logo in a glowing badge that slowly breathes and sends out soft rings,
/// a calmer take on the [PulsingEmblem] of the verification screens.
class _PulsingLogo extends StatefulWidget {
  const _PulsingLogo({required this.size});

  /// Size of the badge; the rings spread out to 1.3 times this.
  final double size;

  @override
  State<_PulsingLogo> createState() => _PulsingLogoState();
}

class _PulsingLogoState extends State<_PulsingLogo>
    with SingleTickerProviderStateMixin {
  static const int _rippleCount = 2;
  static const double _spread = 1.3;

  /// One slow cycle sends out every ring; the badge breathes once per ring.
  late final AnimationController _pulse = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 7000),
  );

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (MediaQuery.disableAnimationsOf(context)) {
      // A still frame that shows the rings mid-way out.
      _pulse
        ..stop()
        ..value = 0.2;
    } else if (!_pulse.isAnimating) {
      _pulse.repeat();
    }
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final badge = Container(
      width: widget.size,
      height: widget.size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.white.withValues(alpha: 0.08),
        border: Border.all(
          color: AppColors.white.withValues(alpha: 0.18),
          width: 1.5,
        ),
      ),
      child: ClipOval(
        child: Image.asset(
          'assets/images/cap_logo.png',
          fit: BoxFit.cover,
          semanticLabel: 'CAPartner logo',
        ),
      ),
    );

    return SizedBox.square(
      dimension: widget.size * _spread,
      child: AnimatedBuilder(
        animation: _pulse,
        builder: (context, child) {
          // 0 to 1 and back once per ring, eased so it lingers at each end.
          final breath = Curves.easeInOut.transform(
            1 - (2 * (_pulse.value * _rippleCount % 1) - 1).abs(),
          );
          return Stack(
            alignment: Alignment.center,
            children: [
              for (var i = 0; i < _rippleCount; i++)
                _buildRipple((_pulse.value + i / _rippleCount) % 1),
              DecoratedBox(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.green.withValues(
                        alpha: 0.4 + 0.3 * breath,
                      ),
                      blurRadius: 32 + 16 * breath,
                    ),
                  ],
                ),
                child: Transform.scale(scale: 1 + 0.03 * breath, child: child),
              ),
            ],
          );
        },
        child: badge,
      ),
    );
  }

  /// One ring, [progress] of the way from the badge's edge to the outer
  /// circle.
  Widget _buildRipple(double progress) {
    final grow = Curves.easeOut.transform(progress);
    final size = widget.size * (1 + (_spread - 1) * grow);
    final alpha = 1 - progress;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: AppColors.green.withValues(alpha: 0.12 * alpha),
        border: Border.all(
          color: AppColors.white.withValues(alpha: 0.25 * alpha),
          width: 1.5,
        ),
      ),
    );
  }
}

/// Text input styled like the verification fields: a leading icon, a pale fill
/// that turns white with a green border while focused, and an optional eye
/// icon that shows or hides what was typed.
class _LoginField extends StatefulWidget {
  const _LoginField({
    required this.controller,
    required this.focusNode,
    required this.icon,
    required this.hintText,
    required this.hasError,
    required this.keyboardType,
    required this.textInputAction,
    required this.autofillHints,
    required this.inputFormatters,
    required this.onEditingComplete,
    this.obscurable = false,
  });

  final TextEditingController controller;
  final FocusNode focusNode;
  final IconData icon;
  final String hintText;
  final bool hasError;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final Iterable<String> autofillHints;
  final List<TextInputFormatter> inputFormatters;
  final VoidCallback onEditingComplete;
  final bool obscurable;

  @override
  State<_LoginField> createState() => _LoginFieldState();
}

class _LoginFieldState extends State<_LoginField> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    final focused = widget.focusNode.hasFocus;
    final borderColor = widget.hasError
        ? AppColors.error
        : focused
        ? AppColors.green
        : AppColors.outline;
    final iconColor = widget.hasError
        ? AppColors.error
        : focused
        ? AppColors.green
        : AppColors.mutedText;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      height: 56,
      padding: EdgeInsets.only(left: 14, right: widget.obscurable ? 4 : 14),
      decoration: BoxDecoration(
        color: focused ? AppColors.white : AppColors.paleMint,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: focused ? 2 : 1.5),
      ),
      child: Row(
        children: [
          Icon(widget.icon, size: 22, color: iconColor),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: widget.controller,
              focusNode: widget.focusNode,
              obscureText: widget.obscurable && _obscure,
              keyboardType: widget.keyboardType,
              textInputAction: widget.textInputAction,
              autocorrect: false,
              enableSuggestions: false,
              autofillHints: widget.autofillHints,
              inputFormatters: widget.inputFormatters,
              cursorColor: AppColors.green,
              onEditingComplete: widget.onEditingComplete,
              style: appTextStyle(
                fontSize: 15,
                weight: FontWeight.w500,
                color: AppColors.ink,
              ),
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                hintText: widget.hintText,
                hintStyle: appTextStyle(
                  fontSize: 15,
                  weight: FontWeight.w500,
                  color: AppColors.grey,
                ),
              ),
            ),
          ),
          if (widget.obscurable)
            Semantics(
              button: true,
              label: _obscure ? 'Show password' : 'Hide password',
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: () => setState(() => _obscure = !_obscure),
                child: SizedBox(
                  width: 44,
                  height: double.infinity,
                  child: Icon(
                    _obscure
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    size: 22,
                    color: AppColors.mutedText,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

/// Validation message under a field. Keeps a fixed gap when empty so the
/// form does not jump while typing.
class _FieldMessage extends StatelessWidget {
  const _FieldMessage({required this.message});

  final String? message;

  @override
  Widget build(BuildContext context) {
    final message = this.message;
    return ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 18),
      child: message == null
          ? null
          : Padding(
              padding: const EdgeInsets.only(top: 6, left: 4, bottom: 6),
              child: Semantics(
                liveRegion: true,
                child: Text(
                  message,
                  style: appTextStyle(
                    fontSize: 12,
                    lineHeight: 16,
                    weight: FontWeight.w500,
                    color: AppColors.error,
                  ),
                ),
              ),
            ),
    );
  }
}

/// "Remember me" with a rounded checkbox that fills green when ticked.
class _RememberMe extends StatelessWidget {
  const _RememberMe({required this.value, required this.onChanged});

  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      checked: value,
      child: InkWell(
        onTap: () => onChanged(!value),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 2),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  color: value ? AppColors.green : AppColors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: value ? AppColors.green : AppColors.outline,
                    width: 1.5,
                  ),
                ),
                child: value
                    ? const Icon(
                        Icons.check_rounded,
                        size: 15,
                        color: AppColors.white,
                      )
                    : null,
              ),
              const SizedBox(width: 8),
              Text(
                'Remember me',
                style: appTextStyle(
                  fontSize: 13,
                  weight: FontWeight.w600,
                  color: AppColors.bodyText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
