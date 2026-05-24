#!/bin/bash
# Keep the Next.js dev server alive
cd "$(dirname "$0")"
while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "$(date): Starting Next.js dev server..." >> server-watchdog.log
    node node_modules/next/dist/bin/next dev -p 3000 >> dev.log 2>&1 &
    sleep 10
  else
    sleep 5
  fi
done
