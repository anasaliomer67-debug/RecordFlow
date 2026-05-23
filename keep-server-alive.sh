#!/bin/bash
# Keep the Next.js dev server alive
cd /home/z/my-project
while true; do
  if ! pgrep -f "next-server" > /dev/null 2>&1; then
    echo "$(date): Starting Next.js dev server..." >> /home/z/my-project/server-watchdog.log
    node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1 &
    sleep 10
  else
    sleep 5
  fi
done
