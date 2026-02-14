#!/bin/bash
set -euo pipefail

# ── Configuration ──
TOOL="amp"
MAX_ITERATIONS=10

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --tool)
      TOOL="$2"
      shift 2
      ;;
    *)
      MAX_ITERATIONS="$1"
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "╔══════════════════════════════════════════════╗"
echo "║  Ralph — Autonomous Agent Loop               ║"
echo "║  Tool: $TOOL                                  "
echo "║  Max iterations: $MAX_ITERATIONS              "
echo "║  Project: $PROJECT_ROOT                       "
echo "╚══════════════════════════════════════════════╝"

# Verify prerequisites
if [[ "$TOOL" == "claude" ]]; then
  if ! command -v claude &> /dev/null; then
    echo "ERROR: claude command not found. Install with: npm install -g @anthropic-ai/claude-code"
    exit 1
  fi
fi

if ! command -v jq &> /dev/null; then
  echo "ERROR: jq not found. Install with: brew install jq"
  exit 1
fi

if [[ ! -f "$SCRIPT_DIR/prd.json" ]]; then
  echo "ERROR: $SCRIPT_DIR/prd.json not found"
  exit 1
fi

if [[ "$TOOL" == "claude" && ! -f "$SCRIPT_DIR/CLAUDE.md" ]]; then
  echo "ERROR: $SCRIPT_DIR/CLAUDE.md not found"
  exit 1
fi

# Check if all stories are already complete
REMAINING=$(jq '[.userStories[] | select(.passes == false)] | length' "$SCRIPT_DIR/prd.json")
if [[ "$REMAINING" -eq 0 ]]; then
  echo "All stories already pass! Nothing to do."
  exit 0
fi
echo "Stories remaining: $REMAINING"
echo ""

# ── Archive previous runs if branch changed ──
BRANCH_NAME=$(jq -r '.branchName' "$SCRIPT_DIR/prd.json")
LAST_BRANCH_FILE="$SCRIPT_DIR/.last-branch"

if [[ -f "$LAST_BRANCH_FILE" ]]; then
  LAST_BRANCH=$(cat "$LAST_BRANCH_FILE")
  if [[ "$LAST_BRANCH" != "$BRANCH_NAME" ]]; then
    ARCHIVE_DIR="$SCRIPT_DIR/archive/$(date +%Y-%m-%d)-${LAST_BRANCH##*/}"
    echo "Archiving previous run to $ARCHIVE_DIR"
    mkdir -p "$ARCHIVE_DIR"
    cp "$SCRIPT_DIR/prd.json" "$ARCHIVE_DIR/" 2>/dev/null || true
    cp "$SCRIPT_DIR/progress.txt" "$ARCHIVE_DIR/" 2>/dev/null || true
  fi
fi
echo "$BRANCH_NAME" > "$LAST_BRANCH_FILE"

# ── Main Loop ──
cd "$PROJECT_ROOT"

for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo ""
  echo "═══════════════════════════════════════════════"
  echo "  ITERATION $i of $MAX_ITERATIONS"
  echo "  $(date '+%Y-%m-%d %H:%M:%S')"
  echo "═══════════════════════════════════════════════"

  # Check remaining stories
  REMAINING=$(jq '[.userStories[] | select(.passes == false)] | length' "$SCRIPT_DIR/prd.json")
  if [[ "$REMAINING" -eq 0 ]]; then
    echo ""
    echo "✅ ALL STORIES COMPLETE!"
    exit 0
  fi

  NEXT_STORY=$(jq -r '[.userStories[] | select(.passes == false)] | sort_by(.priority) | .[0] | "\(.id): \(.title)"' "$SCRIPT_DIR/prd.json")
  echo "  Next story: $NEXT_STORY"
  echo "  Remaining: $REMAINING stories"
  echo ""

  # Run the AI tool
  OUTPUT=""
  if [[ "$TOOL" == "claude" ]]; then
    # Use -p flag with file contents as argument (avoids stdin hanging)
    PROMPT_CONTENT=$(cat "$SCRIPT_DIR/CLAUDE.md")
    OUTPUT=$(claude --dangerously-skip-permissions -p "$PROMPT_CONTENT" 2>&1 | tee /dev/stderr) || true
  else
    OUTPUT=$(cat "$SCRIPT_DIR/prompt.md" | amp --dangerously-allow-all 2>&1 | tee /dev/stderr) || true
  fi

  # Check for completion signal
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo ""
    echo "✅ Ralph reports ALL STORIES COMPLETE!"
    exit 0
  fi

  # Check for stuck signal
  if echo "$OUTPUT" | grep -q "STUCK\|BLOCKED\|FAILED"; then
    echo ""
    echo "⚠️  Ralph may be stuck. Check progress.txt and prd.json."
    echo "  Continuing to next iteration..."
  fi

  echo ""
  echo "  Iteration $i finished. Sleeping 3s..."
  sleep 3
done

echo ""
echo "═══════════════════════════════════════════════"
echo "  Max iterations ($MAX_ITERATIONS) reached."
echo "  Check progress:"
echo "    cat $SCRIPT_DIR/prd.json | jq '.userStories[] | {id, title, passes}'"
echo "═══════════════════════════════════════════════"
