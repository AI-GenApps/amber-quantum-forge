#!/bin/sh
# Write a ready-to-use subagent prompt file for one wave-2 task stage and print its path.
# usage: .claude/workflows/games-wave2-prompt.sh <taskId> <implement|verify|fix> [failures.json]
# The subagent is then told: "Your complete instructions are in <path>; read it first."
set -e
dir=$(cd "$(dirname "$0")" && pwd)
out_dir="${TMPDIR:-/tmp}/games-wave2-prompts-$(id -un)"
mkdir -p "$out_dir"
out="$out_dir/$1-$2.txt"
node "$dir/games-wave2-render-prompt.mjs" "$1" "$2" "$3" > "$out"
cat >> "$out" <<'EXTRA'

Orchestrator notes for this run:
- Parallel lane: another agent may be writing ONLY under .agents/resources/2026-09-25/pocket-biome-art/ or .agents/resources/2026-09-25/merge-relay-art/set-1/. Ignore those paths; never edit, stage, or judge them.
- Bash heredocs can hang in this sandbox's shell; create multi-line files with the Write tool instead of heredocs.
- When you finish, end your final message with the JSON object for your stage:
  implement/fix: {"status":"done|blocked","summary":"...","filesChanged":["..."],"verification":[{"command":"...","result":"pass|fail|not_run","note":"..."}],"blockers":["..."]}
  verify: {"pass":true|false,"failures":["..."],"criteria":[{"criterion":"...","met":true|false,"evidence":"..."}],"notes":"..."}
EXTRA
echo "$out"
