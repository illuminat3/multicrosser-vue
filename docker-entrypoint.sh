#!/bin/sh
set -e
node /app/backend/dist/server.js &
exec nginx -g "daemon off;"
