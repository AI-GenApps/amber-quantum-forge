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
import '../widgets/ludo_avatar.dart';
import '../widgets/ludo_onboarding_controls.dart';
import 'onboarding_tutorial_screen.dart';

class OnboardingProfileScreen extends StatefulWidget {
  const OnboardingProfileScreen({
    super.key,
    required this.settings,
    required this.profileStore,
    this.reducedMotion,
  });

  final LudoProfileSettings settings;
  final LudoProfileStore profileStore;

  /// Test seam threaded down to [OnboardingTutorialScreen]'s
  /// `reducedMotion`; see that screen's own doc.
  final ReducedMotionSetting? reducedMotion;

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
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute<void>(builder: (_) => const HomeLobbyScreen()),
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
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Semantics(
              textField: true,
              label: 'Player name',
              child: TextField(
                controller: _nameController,
                maxLength: 24,
                decoration: const InputDecoration(
                  labelText: 'Player name',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Choose an avatar',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                for (final avatarId in ludoAvatarIds)
                  LudoAvatarView(
                    avatarId: avatarId,
                    selected: avatarId == _selectedAvatarId,
                    onTap: () => setState(() => _selectedAvatarId = avatarId),
                  ),
              ],
            ),
            const SizedBox(height: 32),
            LudoPrimaryButton(
              label: 'Continue',
              onPressed: () => _continue(context),
            ),
          ],
        ),
      ),
    );
  }
}
