#!/bin/sh
# usage: runall.sh P id...
P=$1; shift
printf '%s\n' "$@" | MAXACC=${MAXACC:-2} xargs -n1 -P"$P" sh -c 'bun run.ts $0 1 ${MAXSEED:-600} > logs/$0.log 2>&1'
