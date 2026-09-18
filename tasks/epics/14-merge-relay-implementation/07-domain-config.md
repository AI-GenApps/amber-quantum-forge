---
epic: 14-merge-relay-implementation
task: 07-domain-config
status: in-progress
commit_scope: merge-relay-domain
depends_on: [14-merge-relay-implementation/00-contracts]
estimate: M
---

# Reconcile Merge Relay domain and configuration fixtures

## Ownership

The domain owner owns this task and publishes fixtures consumed by TypeScript,
Dart, and the HTTP route tests. Source MR-2D-1 semantics and 90/10 legacy
behavior remain stable.

## Checklist

- [ ] Apply frozen spawn weights before both initial tiles are generated.
- [ ] Version the full challenge payload, rules, content, origin mode, and
  config revision; old records remain immutable when tuning rolls back.
- [ ] Publish UTC daily fixtures using the agreed 17*31 seed derivation and
  separate practice, daily, endless, and rescue origin metadata.
- [ ] Verify replay, terminal, early-finish, rescue, and custom-weight fixtures
  in Dart VM, compiled Dart, and the Bun service runtime.
- [ ] Add negative fixtures for numeric limits, foreign config/content, hash
  mismatch, and inconsistent result relations.

## Acceptance

The same fixture bytes and versioned rules produce the same checkpoint and
outcome across runtimes. This is a domain/config gate, not a claim that the
full authored MR content or ranked product is complete.
