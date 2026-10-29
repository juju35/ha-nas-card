#!/usr/bin/env bash
# Installs Chromium's system libraries (and any extra apt packages given as arguments) for the
# Playwright browser tests. Every apt call is time-boxed and the whole sequence retried 3 times,
# so a flaky mirror is abandoned instead of hanging; the script fails loudly if every attempt failed.
# Usage: .github/scripts/install-browser-deps.sh [extra apt packages...]
set -u
ok=
for i in 1 2 3; do
  timeout 150 sudo apt-get update \
    && { [ "$#" -eq 0 ] || timeout 300 sudo apt-get install -y "$@"; } \
    && timeout 300 npx playwright install-deps chromium \
    && { ok=1; break; }
  echo "apt attempt $i failed or timed out, retrying in 15s"
  sleep 15
done
[ -n "$ok" ] || { echo "::error::apt failed 3 times"; exit 1; }
