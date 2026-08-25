#!/usr/bin/env bash
#
# run-loop.sh — drives process.md's loop with no human in the middle.
#
# This is NOT an agent. decisions.md D-1 rejected an orchestrator agent and
# predicted this instead: "a shell script that reads Next step and invokes
# claude --agent <name>. Fifteen lines, no model, no drift." It came out longer
# than fifteen, because the gates turned out to be the whole value. The
# principle holds: there is no model in this file, so there is nothing here to
# drift, and every decision it makes is one you can read.
#
# WHAT IT CATCHES — structural faults, all mechanical:
#   * a brief that was never approved, or that auto-approval does not cover
#   * a task that touches the process files — never runs unattended, ever
#   * a role that changed nothing, or changed files without updating Status
#   * a role that pushed to the wrong branch
#   * the verify round bound, so a fail/fix cycle cannot spin forever
#   * a session dying mid-step: EVERY exit is committed and pushed
#
# WHAT IT DOES NOT CATCH: whether the criteria are any good, or whether the code
# is right. Those are the tester's and the reviewer's jobs. A driver that judged
# would be an orchestrator agent again, which is the thing D-1 said not to build.
#
# Usage:
#   .claude/loop/run-loop.sh              # run until blocked, finished, or capped
#   .claude/loop/run-loop.sh status       # where does the task stand? invokes nothing
#   .claude/loop/run-loop.sh --dry-run    # print the plan, invoke nothing
#
set -euo pipefail

# ---------------------------------------------------------------- configuration

REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT"

# Per-step spend cap. The one reliable brake: it is enforced by the CLI, not by
# the model's opinion of how much budget it has left. See README "On limits".
: "${LOOP_BUDGET_USD:=5}"
# Per-step wall clock cap, seconds. Backstop for a step that hangs rather than spends.
: "${LOOP_TIMEOUT:=3600}"
# Stop after this many steps no matter what. Backstop for a livelock the other
# guards somehow miss.
: "${LOOP_MAX_STEPS:=20}"
# Verify-round bounds. process.md says "two full fail->fix->verify rounds without
# a pass" and then escalate. These are counted SEPARATELY on purpose — see README
# "The round bound, and what T-003 says about it".
: "${LOOP_MAX_FAIL:=2}"
: "${LOOP_MAX_BLOCKED:=2}"
# acceptEdits still prompts for Bash, so a genuinely unattended run needs either
# a permission allowlist in .claude/settings.json or bypassPermissions in a
# sandbox. Defaulting to the safe one deliberately; see README "Permissions".
: "${LOOP_PERMISSION_MODE:=acceptEdits}"
: "${LOOP_PUSH:=1}"
: "${CLAUDE_BIN:=claude}"

LEDGER="runs/ledger.tsv"

# Paths the loop may never touch unattended. A task that changes how the loop
# works does not get to run through the loop.
GATED_PATHS='^(process\.md|decisions\.md|CLAUDE\.md|\.claude/)'
# Paths that fall outside the reviewer's envelope (D-4) and therefore
# outside auto-approval too.
GATED_CONTENT='^(openapi\.yaml|geoquizdataplan\.md)'

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

# ---------------------------------------------------------------------- helpers

say()  { printf '%s\n' "$*" >&2; }
bar()  { say "────────────────────────────────────────────────────────"; }
die()  { say "FATAL: $*"; exit 2; }

# Stop the loop and tell the human why. Exit 0: stopping on purpose is a normal
# outcome, not a failure. Only a broken driver exits non-zero.
stop() {
  local reason=$1 detail=${2:-}
  bar
  say "STOPPED: $reason"
  [[ -n $detail ]] && say "$detail"
  say ""
  say "Task:   ${TASK_ID:-none}"
  say "Status: $(header_field Status | head -c 120)"
  say "Next:   $(header_field 'Next step' | head -c 120)"
  [[ -f $LEDGER ]] && say "Log:    runs/${TASK_ID:-unknown}.md"
  bar
  exit 0
}

# The single live brief. tasks/ holds one task at a time, by design.
find_brief() {
  local -a briefs
  mapfile -t briefs < <(find tasks -maxdepth 1 -name 'T-*.md' ! -name 'TEMPLATE.md' | sort)
  case ${#briefs[@]} in
    0) echo "" ;;
    1) echo "${briefs[0]}" ;;
    *) die "tasks/ holds ${#briefs[@]} briefs; process.md says one task at a time: ${briefs[*]}" ;;
  esac
}

# Header fields look like:  **Status:** `pass` — round 3. ...
header_field() {
  [[ -n ${BRIEF:-} && -f ${BRIEF:-} ]] || { echo ""; return; }
  grep -m1 -E "^\*\*$1:\*\*" "$BRIEF" 2>/dev/null | sed -E "s/^\*\*$1:\*\*[[:space:]]*//" || true
}

# ...and their machine-readable part is the first `backticked` token.
header_token() {
  header_field "$1" | sed -n 's/.*`\([^`]*\)`.*/\1/p' | head -1
}

# Status/Next-step, normalised. Falls back to the raw first word when a role
# wrote it without backticks.
status_now()  { local v; v=$(header_token Status);      [[ -n $v ]] || v=$(header_field Status      | awk '{print $1}'); echo "${v,,}"; }
next_now()    { local v; v=$(header_token 'Next step'); [[ -n $v ]] || v=$(header_field 'Next step' | awk '{print $1}'); echo "${v,,}"; }

# How many roles does the Next step line name? Exactly one is the only legal
# answer. Zero routes to you. TWO IS THE DANGEROUS CASE: the parser would take
# the first and route there silently, which is the D-8 failure shape — nothing
# errors, a wrong path is taken, and the task drifts without a red anything.
# The `|| true` is load-bearing. Under `set -euo pipefail` a grep that matches
# nothing fails the whole pipeline, the assignment in gate_next_unambiguous
# inherits that status, and `set -e` kills the driver where it stands -- with no
# message at all. Which meant the one input this function exists to catch, a
# Next step naming no known role, was the one input that produced silence.
next_role_count() {
  local roles
  roles=$(header_field 'Next step' \
    | grep -oiE '\b(task-expander|expander|worker|tester|reviewer|human)\b' \
    | sort -u) || true
  [[ -n $roles ]] || { echo 0; return; }
  wc -l <<<"$roles" | tr -d ' '
}

# G0. Route on an unambiguous field or do not route at all.
gate_next_unambiguous() {
  local n; n=$(next_role_count)
  (( n <= 1 )) || stop "the brief names $n roles in Next step" \
"Next step: $(header_field 'Next step')

The driver routes on that field and will not pick one for you. process.md hands
the task to exactly one role at a time — if two genuinely have work, they are two
steps, and the first one goes in the header."
}

new_session_id() { cat /proc/sys/kernel/random/uuid; }

# Files this branch has changed relative to the default branch.
changed_files() { git diff --name-only origin/main...HEAD 2>/dev/null || true; }

# --------------------------------------------------------------------- the gates

# G1. The loop may never change its own rules. Checked against the real diff,
# not against what the brief claims — a brief cannot talk its way past this.
gate_process_files() {
  local hits
  hits=$(changed_files | grep -E "$GATED_PATHS" || true)
  [[ -z $hits ]] || stop "this task changes the process itself" \
"Changed under a gated path:
$(sed 's/^/  /' <<<"$hits")

A task that rewrites process.md, decisions.md, CLAUDE.md or .claude/ does not
run unattended — that is the one change the loop must not make to itself.
Review it by hand and merge it yourself."
}

# G2. Nothing is built against an unapproved brief. Auto-approval is allowed,
# but only the expander's own stamp inside the envelope, and the reviewer
# re-checks it against the diff at step 6.
gate_approval() {
  local approved; approved=$(header_field Approved)
  [[ -n $approved ]] || stop "the brief has no Approved: line" "process.md step 2: the header is load-bearing."
  # TEMPLATE.md writes the placeholder backticked -- **Approved:** `pending` -- so
  # compare with the backticks stripped. Globbing the raw field against 'pending*'
  # never matched, which made this gate pass silently on every unapproved brief.
  local bare=${approved//\`/}
  if [[ ${bare,,} == pending* ]]; then
    stop "the brief is awaiting your approval" \
"Read it, then replace 'pending' in the Approved: header with your name and the
date:  $BRIEF

Auto-approval did not cover this one, which usually means its Constraints name
a gated path. That is the gate working, not a bug."
  fi
}

# G3. The verify bound. Without this a fail/fix cycle spins until the budget dies.
gate_rounds() {
  local fails blocked
  fails=$(ledger_count_status fail)
  blocked=$(ledger_count_status blocked)
  (( fails < LOOP_MAX_FAIL )) || stop "$fails failed verify rounds" \
"process.md step 4: after two fail->fix->verify rounds without a pass, the brief
is more likely wrong than the code, and the loop cannot tell the difference on
its own. Over to you."
  (( blocked < LOOP_MAX_BLOCKED )) || stop "$blocked blocked verify rounds" \
"The criteria have been sent back to the expander $blocked times. Another rewrite
is unlikely to be the answer."
}

# G4. The branch. Locally the driver owns the checkout, so a mismatch is a bug
# in the driver rather than the harness problem D-8 describes — but the check is
# cheap and D-8 cost a cycle.
gate_branch() {
  local want have
  want=$(header_token Branch)
  have=$(git branch --show-current)
  [[ -n $want ]] || stop "the brief has no Branch: header" "decisions.md D-8: that header is where every role pushes."
  if [[ $want != "$have" ]]; then
    say "  branch: on '$have', brief says '$want' — checking it out"
    git checkout -q "$want" 2>/dev/null || git checkout -qb "$want"
  fi
}

# ------------------------------------------------------------------- the ledger

ledger_init() {
  mkdir -p runs
  [[ -f $LEDGER ]] && return
  printf 'ts_start\tts_end\ttask\tstep\tround\trole\tsession\tturns\tcost_usd\twall_s\texit\tstatus_after\tnext_after\tfault\n' > "$LEDGER"
}

ledger_rows_for_task() {
  [[ -f $LEDGER ]] || return 0
  awk -F'\t' -v t="${TASK_ID:-}" 'NR>1 && $3==t' "$LEDGER"
}

ledger_count_status() {
  ledger_rows_for_task | awk -F'\t' -v s="$1" '$12==s' | wc -l | tr -d ' '
}

ledger_next_step_n() {
  local n; n=$(ledger_rows_for_task | wc -l | tr -d ' '); echo $(( n + 1 ))
}

# A round is one trip through the tester.
ledger_round() {
  local n; n=$(ledger_rows_for_task | awk -F'\t' '$6=="tester"' | wc -l | tr -d ' '); echo $(( n + 1 ))
}

ledger_append() {
  printf '%s\n' "$(IFS=$'\t'; echo "$*")" >> "$LEDGER"
}

# ------------------------------------------------------------ the human-readable log

# runs/T-0xx-slug.md is regenerated from the ledger every step, never appended
# to. One writer, one source of truth, and a human editing the markdown cannot
# corrupt the driver's state.
render_log() {
  local out="runs/${TASK_ID}.md"
  local rows; rows=$(ledger_rows_for_task)
  [[ -n $rows ]] || return 0

  {
    echo "# ${TASK_ID} — run log"
    echo
    echo "Written by \`.claude/loop/run-loop.sh\`. Regenerated from \`runs/ledger.tsv\` on"
    echo "every step — edit the ledger, not this file."
    echo

    local steps rounds fails blocks cost turns first last outcome
    steps=$(wc -l <<<"$rows" | tr -d ' ')
    rounds=$(awk -F'\t' '$6=="tester"' <<<"$rows" | wc -l | tr -d ' ')
    fails=$(awk -F'\t' '$12=="fail"' <<<"$rows" | wc -l | tr -d ' ')
    blocks=$(awk -F'\t' '$12=="blocked"' <<<"$rows" | wc -l | tr -d ' ')
    cost=$(awk -F'\t' '{s+=$9} END {printf "%.2f", s}' <<<"$rows")
    turns=$(awk -F'\t' '{s+=$8} END {print s+0}' <<<"$rows")
    first=$(head -1 <<<"$rows" | cut -f1)
    last=$(tail -1 <<<"$rows" | cut -f2)
    outcome=$(tail -1 <<<"$rows" | cut -f12)

    echo "**Rounds:** $rounds · **Steps:** $steps · **Turns:** $turns · **Cost:** \$$cost"
    echo "**Sent back:** $fails on the code, $blocks on the criteria"
    echo "**Started:** $first · **Last step:** $last · **Status:** \`$outcome\`"
    echo

    echo "## Path"
    echo
    echo '```'
    awk -F'\t' '{
      label = $6
      sub(/task-/, "", label)
      if ($6 == "tester") label = "verify(" $12 ")"
      printf "%s%s", (NR>1 ? " → " : ""), label
    } END { print "" }' <<<"$rows"
    echo '```'
    echo

    echo "## Steps"
    echo
    echo "| # | Round | Role | Turns | Cost | Wall | Exit | Status after | Next |"
    echo "|---|---|---|---|---|---|---|---|---|"
    awk -F'\t' '{ printf "| %s | %s | `%s` | %s | $%s | %ss | %s | `%s` | `%s` |\n", \
                  $4, $5, $6, $8, $9, $10, $11, $12, $13 }' <<<"$rows"
    echo

    local faults; faults=$(awk -F'\t' '$12=="fail" || $12=="blocked"' <<<"$rows")
    if [[ -n $faults ]]; then
      echo "## Faults"
      echo
      echo "What went wrong, and who owned it. Lifted from the brief's \`Fault:\` header —"
      echo "an em dash means the role did not write one."
      echo
      echo "| Round | Verdict | Sent back to | Why |"
      echo "|---|---|---|---|"
      awk -F'\t' '{
        owner = ($12=="blocked") ? "task-expander" : "worker"
        why = ($14 == "" ? "—" : $14)
        printf "| %s | `%s` | `%s` | %s |\n", $5, $12, owner, why
      }' <<<"$faults"
      echo
    fi

    echo "## Sessions"
    echo
    echo "One session per step, minted by the driver. This is what makes the tester's"
    echo "independence checkable rather than promised (\`process.md\` step 4)."
    echo
    echo "| # | Role | Session |"
    echo "|---|---|---|"
    awk -F'\t' '{ printf "| %s | `%s` | `%s` |\n", $4, $6, $7 }' <<<"$rows"
  } > "$out"
}

# ---------------------------------------------------------------- the checkpoint

# Called after EVERY step, whatever the exit code — success, budget cap, timeout,
# crash, Ctrl-C. This is the piece that makes "what if I hit the limit" a
# non-question: nothing is ever only in a dead session's head.
checkpoint() {
  local role=$1 rc=$2
  git add -A
  if ! git diff --cached --quiet; then
    local kind="WIP"
    (( rc == 0 )) && kind="checkpoint"
    git commit -q -m "$kind ${TASK_ID}: ${role} step ${STEP_N} (exit ${rc})

Written by .claude/loop/run-loop.sh. A '${kind}' commit is the driver's, not the
role's — the role's own work is finished only when its section of the brief is
complete. Do not read this as a handoff or a verdict."
    say "  checkpoint: committed"
  fi
  if (( LOOP_PUSH )); then
    local br; br=$(git branch --show-current)
    git push -qu origin "$br" 2>/dev/null && say "  checkpoint: pushed to $br" \
      || say "  checkpoint: push failed (work is committed locally)"
  fi
}

# ------------------------------------------------------------------ running a role

run_role() {
  local role=$1
  local sid; sid=$(new_session_id)
  local t0 t1 wall rc=0 out turns cost
  STEP_N=$(ledger_next_step_n)
  local round; round=$(ledger_round)

  bar
  say "step $STEP_N · round $round · $role"
  say "  session $sid"
  say "  cap \$$LOOP_BUDGET_USD / ${LOOP_TIMEOUT}s"

  if (( DRY_RUN )); then
    say "  --dry-run: not invoking"
    stop "dry run" "The next role would be '$role'."
  fi

  local status_before next_before
  status_before=$(status_now); next_before=$(next_now)

  t0=$(date -u +%FT%TZ)
  out=$(mktemp)
  set +e
  LOOP_SESSION_ID="$sid" timeout "$LOOP_TIMEOUT" \
    "$CLAUDE_BIN" -p \
      --agent "$role" \
      --session-id "$sid" \
      --output-format json \
      --max-budget-usd "$LOOP_BUDGET_USD" \
      --permission-mode "$LOOP_PERMISSION_MODE" \
      "Run your role on the task brief in tasks/. Follow process.md. Your session id is $sid — record it in the brief's Sessions table. End the way every role ends: commit, push to the brief's Branch: header, update Status and Next step, stop." \
      > "$out" 2>&1
  rc=$?
  set -e
  t1=$(date -u +%FT%TZ)
  wall=$(( $(date -u -d "$t1" +%s) - $(date -u -d "$t0" +%s) ))

  turns=$(jq -r '.num_turns // 0' "$out" 2>/dev/null || echo 0)
  cost=$(jq -r '.total_cost_usd // 0 | . * 100 | round / 100' "$out" 2>/dev/null || echo 0)
  [[ $turns == null ]] && turns=0
  [[ $cost  == null ]] && cost=0
  mkdir -p runs/transcripts
  cp "$out" "runs/transcripts/${TASK_ID}-step${STEP_N}-${role}.json"
  rm -f "$out"

  say "  exit $rc · $turns turns · \$$cost · ${wall}s"

  # Always, before anything else can go wrong.
  checkpoint "$role" "$rc"

  local status_after next_after fault
  status_after=$(status_now); next_after=$(next_now)
  fault=$(header_field Fault)

  local exit_label="ok"
  case $rc in
    0)   exit_label="ok" ;;
    124) exit_label="timeout" ;;
    *)   exit_label="err$rc" ;;
  esac

  ledger_append "$t0" "$t1" "$TASK_ID" "$STEP_N" "$round" "$role" "$sid" \
                "$turns" "$cost" "$wall" "$exit_label" "${status_after:-unknown}" \
                "${next_after:-unknown}" "$fault"
  render_log
  git add runs && git commit -q -m "run log: ${TASK_ID} step ${STEP_N} (${role})" || true

  # G5. The silent stall. A role that returns having moved nothing is the
  # failure D-8 describes: nothing errors, and the task quietly stops existing.
  if [[ $status_after == "$status_before" && $next_after == "$next_before" ]]; then
    stop "'$role' changed nothing" \
"Status and Next step are what they were before the step ran:
  Status: $status_before
  Next:   $next_before

Nothing errored, which is exactly why this guard exists. Read
runs/transcripts/${TASK_ID}-step${STEP_N}-${role}.json before re-running."
  fi

  (( rc == 0 )) || stop "'$role' exited $rc ($exit_label)" \
"Its work is committed and pushed — nothing is lost. If this was the budget cap,
raise LOOP_BUDGET_USD and run again; the next session picks the task up from the
brief. Transcript: runs/transcripts/${TASK_ID}-step${STEP_N}-${role}.json"
}

# ------------------------------------------------------------------------- status

show_status() {
  BRIEF=$(find_brief)
  TASK_ID=$([[ -n $BRIEF ]] && basename "$BRIEF" .md || echo "")
  bar
  if [[ -z $BRIEF ]]; then
    say "No live brief. The next step is 'task-expander' — it sweeps the last"
    say "cycle and picks the next task from tasks.md."
  else
    say "Task:     $TASK_ID"
    say "Status:   $(header_field Status | head -c 200)"
    say "Next:     $(header_field 'Next step' | head -c 200)"
    say "Approved: $(header_field Approved | head -c 200)"
    say "Branch:   $(header_token Branch)"
    if [[ -f $LEDGER ]]; then
      say "Steps:    $(ledger_rows_for_task | wc -l | tr -d ' ') · rounds: $(( $(ledger_round) - 1 ))"
      say "Spent:    \$$(ledger_rows_for_task | awk -F'\t' '{s+=$9} END {printf "%.2f", s}')"
    fi
  fi
  bar
}

# --------------------------------------------------------------------------- main

[[ "${1:-}" == "status" ]] && { show_status; exit 0; }

command -v "$CLAUDE_BIN" >/dev/null || die "'$CLAUDE_BIN' not on PATH"
command -v jq >/dev/null || die "jq not on PATH"
git diff --quiet && git diff --cached --quiet \
  || die "working tree is dirty — commit or stash before starting the loop"

ledger_init
git fetch -q origin main 2>/dev/null || say "warning: could not fetch origin/main"

STEP_N=0
steps_run=0

while (( steps_run < LOOP_MAX_STEPS )); do
  BRIEF=$(find_brief)

  # No brief: the cycle is between tasks. The expander sweeps and picks.
  if [[ -z $BRIEF ]]; then
    TASK_ID="between-tasks"
    say ""
    say "No live brief — starting a cycle with task-expander."
    run_role task-expander
    steps_run=$(( steps_run + 1 ))
    continue
  fi

  TASK_ID=$(basename "$BRIEF" .md)

  gate_process_files
  gate_branch
  gate_next_unambiguous

  next=$(next_now)
  case $next in
    task-expander|expander)
      gate_rounds
      run_role task-expander ;;
    worker)
      gate_approval
      gate_rounds
      run_role worker ;;
    tester)
      gate_approval
      gate_rounds
      run_role tester ;;
    reviewer)
      gate_approval
      run_role reviewer ;;
    human|"")
      stop "the brief asks for you" "Next step: $(header_field 'Next step')" ;;
    *)
      stop "unrecognised Next step: '$next'" \
"The driver routes on that field and does not guess. Set it to one of:
task-expander, worker, tester, reviewer, human." ;;
  esac

  steps_run=$(( steps_run + 1 ))
done

stop "step cap reached ($LOOP_MAX_STEPS)" \
"Not necessarily wrong — a task genuinely can take this many steps — but at this
point the loop has stopped being cheaper than reading it yourself."
