import 'package:flutter/material.dart';

import 'merge_relay_theme.dart';

String? mergeRelayManualCodeError(
  String raw,
  String? Function(String raw) parse,
) {
  if (raw.trim().isEmpty) return 'Enter a challenge code or link.';
  if (parse(raw) == null) {
    return 'That is not a valid challenge code or link.';
  }
  return null;
}

final class MergeRelayManualCodeEntry extends StatefulWidget {
  const MergeRelayManualCodeEntry({
    required this.theme,
    required this.onSubmit,
    required this.parse,
    this.initialCode = '',
    super.key,
  });

  final MergeRelayTheme theme;
  final String? Function(String raw) parse;
  final String initialCode;
  final Future<void> Function(String code) onSubmit;

  @override
  State<MergeRelayManualCodeEntry> createState() => _ManualCodeState();
}

final class _ManualCodeState extends State<MergeRelayManualCodeEntry> {
  late final TextEditingController _text;
  String? _error;

  @override
  void initState() {
    super.initState();
    _text = TextEditingController(text: widget.initialCode);
  }

  @override
  void dispose() {
    _text.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final error = mergeRelayManualCodeError(_text.text, widget.parse);
    setState(() => _error = error);
    if (error != null) return;
    FocusManager.instance.primaryFocus?.unfocus();
    await widget.onSubmit(_text.text);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextField(
          key: const ValueKey('mr-manual-code'),
          controller: _text,
          maxLength: 512,
          autocorrect: false,
          enableSuggestions: false,
          textInputAction: TextInputAction.go,
          onChanged: (_) {
            if (_error != null) setState(() => _error = null);
          },
          onSubmitted: (_) => _submit(),
          decoration: InputDecoration(
            labelText: 'Challenge code or link',
            hintText: 'ch_… or mergerelay://challenge/…',
            errorText: _error,
            border: const OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 8),
        FilledButton.icon(
          key: const ValueKey('mr-manual-code-submit'),
          onPressed: _submit,
          icon: const Icon(Icons.route_rounded),
          label: const Text('See challenge'),
        ),
      ],
    );
  }
}
