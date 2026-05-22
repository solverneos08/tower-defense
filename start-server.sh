#!/bin/bash
# Start the tower defense game at http://localhost:3000
cd "$(dirname "$0")"
PORT=3000
if lsof -ti :$PORT >/dev/null 2>&1; then
  echo "Stopping old process on port $PORT..."
  kill $(lsof -t -i :$PORT) 2>/dev/null
  sleep 0.5
fi
echo "Serving at http://localhost:$PORT/ (Ctrl+C to stop)"
exec python3 -m http.server "$PORT"
