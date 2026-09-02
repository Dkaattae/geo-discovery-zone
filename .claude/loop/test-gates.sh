#!/usr/bin/env bash
#
# test-gates.sh — exercises run-loop.sh's gates against briefs in the real
# TEMPLATE.md format. Invokes no model: every case ends at --dry-run or earlier.
#
# It exists because a gate that silently passes looks exactly like a gate that
# has nothing to complain about. G2 shipped that way — it globbed 'pending*'
# against a field the template writes as `pending`, backticks included, so it
# never fired on an unapproved brief and never said anything about it.
#
# Run from anywhere:  .claude/loop/test-gates.sh
#
set -uo pipefail

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

DRIVER=.claude/loop/run-loop.sh
WORK=$(mktemp -d)
BRIEF=tasks/T-999-gate-test.md
pass=0; fail=0

# G4 does not merely report a branch mismatch -- it CHECKS THE BRANCH OUT. So
# every fixture below names the branch we are already on, and this trap puts it
# back if anything slips through. A fixture that named a real branch would move
# your checkout as a side effect of running the tests, which is how this guard
# came to exist.
START_BRANCH=$(git branch --show-current)

cleanup() {
  rm -rf "$WORK"; rm -f "$BRIEF"
  local now; now=$(git branch --show-current)
  if [[ -n $START_BRANCH && $now != "$START_BRANCH" ]]; then
    echo "restoring checkout: $now -> $START_BRANCH" >&2
    git checkout -q "$START_BRANCH"
  fi
}
trap cleanup EXIT

[[ -n $START_BRANCH ]] || { echo "cannot test: detached HEAD"; exit 2; }

[[ -e $BRIEF ]] && { echo "refusing to run: $BRIEF already exists"; exit 2; }

# run-loop.sh refuses to start on a dirty tree, and it refuses before it reaches
# a single gate -- so every case would fail identically and for the wrong reason.
# Say so instead. The test brief itself is untracked and does not count.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "cannot test: the working tree is dirty, and the driver refuses to start."
  echo "Commit or stash first -- every gate would report a false failure."
  exit 2
fi

# A copy of the driver with G1's path list neutered, so the later gates are
# reachable. G1 itself is tested against the real driver.
UNGATED="$WORK/ungated.sh"
sed "s|^GATED_PATHS=.*|GATED_PATHS='^ZZZ_NEVER_MATCHES'|" "$DRIVER" > "$UNGATED"
chmod +x "$UNGATED"

# write_brief <status> <next> <approved> <branch>
write_brief() {
  cat > "$BRIEF" <<EOF
# T-999 — gate test

**Status:** \`$1\`
**Next step:** \`$2\`
**Approved:** $3
**Branch:** \`$4\`
**PR:** #999
**Fault:**
EOF
}

# check <name> <driver> <expect-substring>
check() {
  local name=$1 driver=$2 want=$3 out
  out=$("$driver" --dry-run 2>&1)
  if grep -qF -- "$want" <<<"$out"; then
    printf '  ok    %s\n' "$name"; pass=$((pass+1))
  else
    local got
    got=$(grep -m1 -E 'STOPPED|FATAL|dry run|next role' <<<"$out")
    [[ -n $got ]] || got="(no output)"
    printf '  FAIL  %s\n     wanted: %s\n     got:    %s\n' \
      "$name" "$want" "$got"
    fail=$((fail+1))
  fi
}

echo "gates:"

# G1 — the real driver, on this repo's actual diff. Only meaningful on a branch
# that touches the process files, which is where it matters.
if git diff --name-only origin/main...HEAD 2>/dev/null \
   | grep -qE '^(process\.md|process-decisions\.md|CLAUDE\.md|\.claude/)'; then
  write_brief 'awaiting verification' 'tester' "Kate, 2026-08-25" "$START_BRANCH"
  check "G1  process files stop the run" "$DRIVER" "changes the process itself"
else
  echo "  skip  G1  (this branch touches no process file)"
fi

# G0 — two roles named is the dangerous case; one is fine.
write_brief 'awaiting verification' 'tester` then `reviewer' "Kate, 2026-08-25" "$START_BRANCH"
check "G0  two roles in Next step stop the run" "$UNGATED" "names 2 roles"

# G2 — the regression. Backticked placeholder must still stop.
write_brief 'awaiting approval' 'worker' "\`pending\` — replace with who approved" "$START_BRANCH"
check "G2  backticked \`pending\` stops the run" "$UNGATED" "awaiting your approval"

write_brief 'awaiting approval' 'worker' "pending" "$START_BRANCH"
check "G2  bare pending stops the run" "$UNGATED" "awaiting your approval"

write_brief 'awaiting approval' 'worker' "" "$START_BRANCH"
check "G2  missing Approved stops the run" "$UNGATED" "no Approved: line"

write_brief 'awaiting verification' 'tester' "Kate, 2026-08-25" "$START_BRANCH"
check "G2  a real name passes" "$UNGATED" "dry run"

write_brief 'awaiting verification' 'tester' "orchestrator — 2026-08-25, unattended run. See \`runs/T-999.md\`." "$START_BRANCH"
check "G2  the orchestrator's line passes" "$UNGATED" "dry run"

# G4 — a missing Branch header has no default to fall back on.
cat > "$BRIEF" <<'EOF'
# T-999 — gate test

**Status:** `awaiting verification`
**Next step:** `tester`
**Approved:** Kate, 2026-08-25
**PR:** #999
EOF
check "G4  missing Branch stops the run" "$UNGATED" "no Branch: header"

# Routing — an unknown Next step is never guessed at.
write_brief 'awaiting verification' 'nobody' "Kate, 2026-08-25" "$START_BRANCH"
check "    unknown Next step stops the run" "$UNGATED" "unrecognised Next step"

write_brief 'blocked' 'human' "Kate, 2026-08-25" "$START_BRANCH"
check "    Next step: human stops the run" "$UNGATED" "asks for you"

echo
echo "$pass passed, $fail failed"
[[ $fail -eq 0 ]]
