#!/usr/bin/env bash
#
# deploy-qa-report.sh
#
# Publishes the DEX Quality Report app (this folder) to the QA-report GitHub
# repo. Pushing to that repo's `main` triggers the GitHub Pages deploy workflow,
# which rebuilds and redeploys the live site automatically.
#
# Prerequisite: commit your changes in the Alfred repo FIRST. This script only
# pushes already-committed work — it does not stage or commit for you.
#
# Usage:
#   ./deploy-qa-report.sh
#
set -euo pipefail

PREFIX="projects/code-quality-poc/quality-report-app"
REMOTE="https://github.com/Isaac-kps/QA-report.git"
SITE="https://isaac-kps.github.io/QA-report/"

# Always operate from the Alfred repo root, wherever the script is called from.
cd "$(git rev-parse --show-toplevel)"

# Warn (don't block) if there are uncommitted changes under the app folder —
# subtree only publishes committed history.
if ! git diff --quiet -- "$PREFIX" || ! git diff --cached --quiet -- "$PREFIX"; then
  echo "⚠️  Uncommitted changes detected under $PREFIX."
  echo "    Commit them first, or they won't be included in this deploy."
  read -r -p "    Continue with the last committed version anyway? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || { echo "Aborted."; exit 1; }
fi

echo "🚀 Pushing $PREFIX → QA-report (main)…"
git subtree push --prefix="$PREFIX" "$REMOTE" main

echo ""
echo "✅ Pushed. GitHub Pages will redeploy in ~1 minute:"
echo "   $SITE"
