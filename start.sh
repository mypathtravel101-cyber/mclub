#!/bin/bash
while true; do
  echo "Starting Next.js dev server..."
  npx next dev -p 3000 -H 0.0.0.0 2>&1
  echo "Server exited with code $?. Restarting in 3 seconds..."
  sleep 3
done
