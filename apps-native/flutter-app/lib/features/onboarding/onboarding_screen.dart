import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Storage key mirroring the `onboarding_seen` UserDefaults key in
/// `OnboardingViewModel.swift`.
const String onboardingSeenKey = 'onboarding_seen';

Future<bool> isOnboardingComplete() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(onboardingSeenKey) ?? false;
}

Future<void> markOnboardingComplete() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setBool(onboardingSeenKey, true);
}

class _Slide {
  const _Slide({
    required this.emoji,
    required this.title,
    required this.body,
  });

  final String emoji;
  final String title;
  final String body;
}

const List<_Slide> _slides = [
  _Slide(
    emoji: '👋',
    title: 'Welcome',
    body: 'Your AI-powered starter app.',
  ),
  _Slide(
    emoji: '💬',
    title: 'Chat',
    body: 'Ask anything, get instant answers.',
  ),
  _Slide(
    emoji: '🚀',
    title: 'Get Started',
    body: 'Sign in to unlock all features.',
  ),
];

/// Onboarding carousel. Mirrors
/// `apps-native/ios-app/Starter/Features/Onboarding/OnboardingView.swift`.
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key, required this.onComplete});

  final VoidCallback onComplete;

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();

  Future<void> _complete() async {
    await markOnboardingComplete();
    widget.onComplete();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: PageView.builder(
          controller: _controller,
          itemCount: _slides.length,
          itemBuilder: (context, index) {
            final slide = _slides[index];
            final isLast = index == _slides.length - 1;
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(slide.emoji, style: const TextStyle(fontSize: 64)),
                  const SizedBox(height: 16),
                  Text(slide.title, style: Theme.of(context).textTheme.headlineMedium),
                  const SizedBox(height: 8),
                  Text(slide.body, textAlign: TextAlign.center),
                  if (isLast) ...[
                    const SizedBox(height: 24),
                    FilledButton(
                      onPressed: _complete,
                      child: const Text('Get Started'),
                    ),
                  ],
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
