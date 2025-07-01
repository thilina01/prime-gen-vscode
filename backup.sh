#!/bin/sh

# Exit immediately on error
set -e

# === CONFIGURATION ===
DEFAULT_TZ="Asia/Kolkata"
: "${TZ_OVERRIDE:=$DEFAULT_TZ}"
export TZ="$TZ_OVERRIDE"

# Use ISO format without colons for filename safety
TIMESTAMP=$(date +"%Y-%m-%dT%H%M%S%z")
PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
PROJECT_NAME=$(basename "$PROJECT_ROOT")
BACKUP_FILE="${PROJECT_NAME}-${TIMESTAMP}.txt"

cd "$PROJECT_ROOT"

echo "Creating backup: $BACKUP_FILE"
echo "Project: $PROJECT_NAME"
echo "Timestamp: $TIMESTAMP (TZ=$TZ)"

# Handle .backupignore
IGNORE_FILE=".backupignore"
IGNORE_PATTERNS=""
if [ -f "$IGNORE_FILE" ]; then
  IGNORE_PATTERNS=$(grep -v '^\s*#' "$IGNORE_FILE" | sed '/^\s*$/d')
fi

# Use git if available
if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  FILES=$(git ls-files --cached --others --exclude-standard)
else
  FILES=$(find . -type f | sed 's|^\./||')  # Remove leading ./
fi

TMP_FILE=$(mktemp)

# Process each file
for FILE in $FILES; do
  # Skip backup file itself
  [ "$FILE" = "$BACKUP_FILE" ] && continue

  # Skip patterns from .backupignore
  SKIP=0
  for PATTERN in $IGNORE_PATTERNS; do
    case "$FILE" in
      $PATTERN|$PATTERN/*)
        SKIP=1
        break
        ;;
    esac
  done
  [ "$SKIP" -eq 1 ] && continue

  # Skip binary files (basic check)
  if file "$FILE" | grep -qiE 'binary|executable'; then
    continue
  fi

  # Append file with delimiter
  printf "\n==== %s ====\n" "$FILE" >> "$TMP_FILE"
  cat "$FILE" >> "$TMP_FILE" 2>/dev/null || echo "[Error reading $FILE]" >> "$TMP_FILE"
done

mv "$TMP_FILE" "$BACKUP_FILE"
echo "Backup completed: $BACKUP_FILE"

# === Ensure .gitignore ignores backup files ===
GITIGNORE_FILE=".gitignore"
BACKUP_PATTERN="*-[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9][0-9][0-9][0-9][0-9]+[0-9][0-9][0-9][0-9].txt"

if [ -f "$GITIGNORE_FILE" ]; then
  if ! grep -qF "$BACKUP_PATTERN" "$GITIGNORE_FILE"; then
    echo "\n# Ignore project backup files\n$BACKUP_PATTERN" >> "$GITIGNORE_FILE"
    echo "Appended backup ignore pattern to .gitignore"
  fi
else
  echo "# Ignore project backup files\n$BACKUP_PATTERN" > "$GITIGNORE_FILE"
  echo "Created .gitignore and added backup ignore pattern"
fi