#!/usr/bin/env bash
# Baut die Web-App und veröffentlicht sie im gh-pages-Branch.
#
#   ./scripts/deploy-pages.sh git@github.com:Jolina2002/trainings-tracker.git
#
# dist/ bleibt gitignoriert – der Build bekommt hier ein eigenes Wegwerf-Repo,
# damit die Quellhistorie auf main sauber bleibt.
set -euo pipefail

REMOTE="${1:-}"
if [ -z "$REMOTE" ]; then
  echo "Bitte die Repo-URL angeben, z. B.:" >&2
  echo "  ./scripts/deploy-pages.sh git@github.com:Jolina2002/trainings-tracker.git" >&2
  exit 1
fi

# Commit-Identität nur für dieses Deploy – damit keine dienstliche
# Mailadresse in einem öffentlichen Repo landet.
NAME="${PAGES_NAME:-Jolina2002}"
MAIL="${PAGES_EMAIL:-Jolina2002@users.noreply.github.com}"

cd "$(dirname "$0")/.."
npx expo export -p web
node scripts/make-pwa.mjs

rm -rf dist/.git
git -C dist init -q
git -C dist config user.name "$NAME"
git -C dist config user.email "$MAIL"
git -C dist add -A
git -C dist commit -qm "Web-App-Build $(date +%Y-%m-%d)"
git -C dist push -f "$REMOTE" HEAD:gh-pages
rm -rf dist/.git

echo
echo "Veröffentlicht. Einmalig auf GitHub einstellen:"
echo "  Settings -> Pages -> Branch: gh-pages, Ordner: / (root)"
