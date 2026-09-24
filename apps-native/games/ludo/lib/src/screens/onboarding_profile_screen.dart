/// Second onboarding step: name + avatar picker.
///
/// The picker grid shows every [ludoAvatars] entry (>= 8 distinct,
/// code-drawn avatars — see `lib/src/widgets/ludo_avatar.dart`), never a
/// photo upload. "Continue" persists the current name field (or the
/// generated default, if left blank) and selected avatar before moving to
/// the tutorial; "Skip" persists the still-default name/avatar and jumps
/// straight to the home lobby placeholder.
library;

import 'package:flutter/material.dart';

import 'home_lobby_screen.dart' show HomeLobbyScreen;
import '../state/ludo_profile_settings.dart';
import '../state/reduced_motion_setting.dart';
import '../telemetry/ludo_telemetry.dart';
import '../theme/ludo_background_painter.dart';
import '../theme/ludo_text_styles.dart';
import '../theme/ludo_theme_tokens.dart';
import '../widgets/ludo_avatar.dart';
import '../widgets/ludo_onboarding_controls.dart';
import '../widgets/ludo_panel.dart';
import 'onboarding_tutorial_screen.dart';

class OnboardingProfileScreen extends StatefulWidget {
  const OnboardingProfileScreen({
    super.key,
    required this.settings,
    required this.profileStore,
    this.reducedMotion,
    this.telemetry,
    this.diceSeed,
  });

  final LudoProfileSettings settings;
  final LudoProfileStore profileStore;

  /// Test seam threaded down to [OnboardingTutorialScreen]'s
  /// `reducedMotion`; see that screen's own doc.
  final ReducedMotionSetting? reducedMotion;

  /// Test seam: forwarded to [OnboardingTutorialScreen] and used directly
  /// by this screen's own Skip action. `null` (the default) resolves a
  /// fresh production [LudoTelemetry].
  final LudoTelemetry? telemetry;

  /// Test seam: forwarded all the way to `HomeLobbyScreen`'s started
  /// match. `null` (the default) in production.
  final int? diceSeed;

  @override
  State<OnboardingProfileScreen> createState() =>
      _OnboardingProfileScreenState();
}

class _OnboardingProfileScreenState extends State<OnboardingProfileScreen> {
  late final TextEditingController _nameController;
  late String _selectedAvatarId;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.settings.name);
    _selectedAvatarId = widget.settings.avatarId;
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _skip(BuildContext context) async {
    widget.settings.onboardingComplete = true;
    await widget.profileStore.save(widget.settings);
    (widget.telemetry ?? LudoTelemetry()).onboardingSkipped();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(
        builder: (_) => HomeLobbyScreen(
          telemetry: widget.telemetry,
          diceSeed: widget.diceSeed,
        ),
      ),
      (route) => false,
    );
  }

  void _continue(BuildContext context) {
    widget.settings.name = _nameController.text;
    widget.settings.avatarId = _selectedAvatarId;
    Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => OnboardingTutorialScreen(
          settings: widget.settings,
          profileStore: widget.profileStore,
          reducedMotion: widget.reducedMotion,
          telemetry: widget.telemetry,
          diceSeed: widget.diceSeed,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Set up your profile'),
        actions: [LudoSkipButton(onPressed: () => _skip(context))],
      ),
      body: LudoBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(24),
            children: [
              LudoPanel(
                child: Semantics(
                  textField: true,
                  label: 'Player name',
                  child: TextField(
                    controller: _nameController,
                    maxLength: 24,
                    style: LudoTextStyles.body,
                    decoration: const InputDecoration(
                      labelText: 'Player name',
                      labelStyle: TextStyle(color: LudoThemeTokens.textOnDark),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: LudoThemeTokens.spaceLg),
              LudoOutlinedTitle(
                'Choose an avatar',
                style: LudoTextStyles.displaySmall,
              ),
              const SizedBox(height: LudoThemeTokens.spaceMd),
              LudoPanel(
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: [
                    for (final avatarId in ludoAvatarIds)
                      LudoAvatarView(
                        avatarId: avatarId,
                        selected: avatarId == _selectedAvatarId,
                        onTap: () =>
                            setState(() => _selectedAvatarId = avatarId),
                      ),
                  ],
                ),
              ),
              const SizedBox(height: LudoThemeTokens.spaceXl),
              LudoPrimaryButton(
                label: 'Continue',
                onPressed: () => _continue(context),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
