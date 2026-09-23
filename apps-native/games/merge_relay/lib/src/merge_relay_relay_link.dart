final class MergeRelayChallengeLink {
  const MergeRelayChallengeLink._();

  static String? parse(String raw, {Uri? publicOrigin, String? environment}) {
    final value = raw.trim();
    if (value.isEmpty ||
        value.length > 512 ||
        RegExp(r'(^|/)\.\.?(/|$)').hasMatch(value)) {
      return null;
    }
    if (_id.hasMatch(value)) return value;
    final uri = Uri.tryParse(value);
    if (uri == null || uri.hasFragment || uri.userInfo.isNotEmpty) {
      return null;
    }
    if (uri.scheme == 'mergerelay' &&
        uri.host == 'challenge' &&
        uri.pathSegments.length == 1 &&
        !uri.hasQuery) {
      return _readId(uri.pathSegments.single);
    }
    if (publicOrigin == null ||
        !_isAcceptedOrigin(publicOrigin) ||
        uri.scheme != publicOrigin.scheme ||
        uri.host != publicOrigin.host ||
        uri.port != publicOrigin.port ||
        !_matchesEnvironment(uri, environment) ||
        uri.pathSegments.length != 4 ||
        uri.pathSegments[0] != 'games' ||
        uri.pathSegments[1] != 'merge-relay' ||
        uri.pathSegments[2] != 'challenges' ||
        uri.pathSegments[3].isEmpty) {
      return null;
    }
    return _readId(uri.pathSegments[3]);
  }

  static String? _readId(String value) => _id.hasMatch(value) ? value : null;

  static bool _isAcceptedOrigin(Uri value) =>
      value.scheme.toLowerCase() == 'https' &&
      value.host.isNotEmpty &&
      value.userInfo.isEmpty &&
      value.query.isEmpty &&
      value.fragment.isEmpty &&
      (value.path.isEmpty || value.path == '/');

  static bool _matchesEnvironment(Uri uri, String? environment) {
    if (environment == null) return !uri.hasQuery;
    if (!_environments.contains(environment)) return false;
    final values = uri.queryParametersAll['environment'];
    return uri.queryParametersAll.length == 1 &&
        values?.length == 1 &&
        values!.single == environment;
  }

  static final _id = RegExp(r'^[A-Za-z0-9_-]{1,128}$');
  static const _environments = {'debug', 'staging', 'production'};
}
