import 'package:flutter_test/flutter_test.dart';
import 'package:merge_relay/src/merge_relay_gateway.dart';

import 'merge_relay_route_fixture_support.dart';

const _optionalKeys = {
  'payload_hash',
  'challenge_payload_hash',
  'max_legal_moves',
  'content_id',
  'content_version',
  'spawn_two_weight',
  'spawn_four_weight',
};

Iterable<_Site> _sites(Object? node, [List<Object> path = const []]) sync* {
  if (node is Map) {
    yield _Site(path, node, null);
    for (final entry in node.entries) {
      final next = [...path, entry.key as Object];
      if (entry.value is Map || entry.value is List) {
        yield* _sites(entry.value, next);
      } else {
        yield _Site(next, node, entry.key as String);
      }
    }
  } else if (node is List) {
    for (var i = 0; i < node.length; i++) {
      final next = [...path, i];
      if (node[i] is Map || node[i] is List) {
        yield* _sites(node[i], next);
      }
    }
  }
}

final class _Site {
  const _Site(this.path, this.map, this.leafKey);

  final List<Object> path;
  final Map<dynamic, dynamic> map;
  final String? leafKey;
}

Object? _at(Object? root, List<Object> path) {
  var node = root;
  for (final step in path) {
    node = step is int ? (node! as List)[step] : (node! as Map)[step];
  }
  return node;
}

Future<void> _expectProtocol(RouteCase item, Json body, [String where = '']) =>
    expectLater(
      item.call(gatewayFor(body, item.status)),
      throwsA(isA<MergeRelayProtocolException>()),
      reason: '${item.name} $where',
    );

void main() {
  final cases = routeCases();
  final matrix = loadRouteMatrix();
  final errors = (matrix['errors']! as Json).cast<String, Json>();

  test('route fixture covers every documented success outcome', () {
    expect(
      cases.map((item) => item.name),
      containsAll(<String>[
        'create_challenge',
        'resolve_challenge',
        'reserve_attempt',
        'submit_moves',
        'finalize_attempt',
        'daily',
        'create_daily_origin',
        'create_endless_origin',
        'create_child',
        'reserve_replay',
        'finalize_replay',
        'finalize_terminal',
        'finalize_early_finish',
        'finalize_complete_with_return',
      ]),
    );
    expect(errors.length, greaterThanOrEqualTo(45));
  });

  group('strict codecs decode the exact route-produced responses', () {
    for (final item in cases) {
      test(item.name, () async {
        final value = await item.call(
          gatewayFor(deepCopy(item.body), item.status),
        );
        expect(value, isNotNull);
      });
    }
  });

  group('shape drift is rejected', () {
    for (final item in cases) {
      test('${item.name} envelope', () async {
        await _expectProtocol(item, {...item.body, 'unexpected': true});
        await _expectProtocol(item, {...item.body, 'contract_version': 'v2'});
        await _expectProtocol(item, {
          'contract_version': item.body['contract_version'],
        });
      });

      test('${item.name} extra, missing, and mistyped fields', () async {
        final data = item.body['data'];
        for (final site in _sites(data)) {
          final extra = deepCopy(item.body)! as Json;
          final target = _at(extra['data'], site.path);
          if (site.leafKey == null && target is Map) {
            target['drift_extra'] = 1;
            await _expectProtocol(item, extra, 'extra ${site.path}');
          }
          final leafKey = site.leafKey;
          if (leafKey != null) {
            final typed = deepCopy(item.body)! as Json;
            final parent = _at(
              typed['data'],
              site.path.sublist(0, site.path.length - 1),
            );
            (parent! as Map)[leafKey] = <String, Object?>{'drift': true};
            await _expectProtocol(item, typed, 'type ${site.path}');
            if (!_optionalKeys.contains(leafKey)) {
              final missing = deepCopy(item.body)! as Json;
              final holder = _at(
                missing['data'],
                site.path.sublist(0, site.path.length - 1),
              );
              (holder! as Map).remove(leafKey);
              await _expectProtocol(item, missing, 'missing ${site.path}');
            }
          }
        }
      });
    }
  });

  group('every documented error code decodes losslessly', () {
    for (final entry in errors.entries) {
      test(entry.key, () async {
        final reply = entry.value;
        final body = reply['body']! as Json;
        final details = body['error']! as Json;
        final gateway = gatewayFor(body, reply['status']! as int);
        await expectLater(
          gateway.getDaily('2026-01-01'),
          throwsA(
            isA<MergeRelayApiException>()
                .having((e) => e.statusCode, 'status', reply['status'])
                .having((e) => e.code, 'code', entry.key)
                .having((e) => e.message, 'message', details['message'])
                .having(
                  (e) => e.diagnosticId,
                  'diagnostic',
                  details['diagnostic_id'],
                ),
          ),
        );
      });
    }

    test('error shape drift is not trusted as a server code', () async {
      final sample = errors.values.first;
      final status = sample['status']! as int;
      final base = sample['body']! as Json;
      final drifted = <Json>[
        {...base, 'unexpected': true},
        {...base, 'contract_version': 'v2'},
        {
          'contract_version': base['contract_version'],
          'error': {...(base['error']! as Json), 'extra': 1},
        },
        {
          'contract_version': base['contract_version'],
          'error': <String, Object?>{'code': 'x', 'message': 'm'},
        },
      ];
      for (final body in drifted) {
        await expectLater(
          gatewayFor(body, status).getDaily('2026-01-01'),
          throwsA(
            isA<MergeRelayApiException>().having(
              (e) => e.code,
              'code',
              anyOf('invalid_error_response', 'unsupported_contract'),
            ),
          ),
        );
      }
    });
  });
}
