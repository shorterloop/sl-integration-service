#!/bin/sh
set -e  # Exit on error

# Set default values if not provided
export AP_APP_TITLE="${AP_APP_TITLE:-Activepieces}"
export AP_FAVICON_URL="${AP_FAVICON_URL:-https://cdn.activepieces.com/brand/favicon.ico}"

# Debug: Print environment variables
echo "AP_APP_TITLE: $AP_APP_TITLE"
echo "AP_FAVICON_URL: $AP_FAVICON_URL"

# Process environment variables in index.html BEFORE starting services
if [ -f /usr/share/nginx/html/index.html ]; then
    echo "Processing index.html with environment variables..."
    envsubst '${AP_APP_TITLE} ${AP_FAVICON_URL}' < /usr/share/nginx/html/index.html > /usr/share/nginx/html/index.html.tmp && \
    mv /usr/share/nginx/html/index.html.tmp /usr/share/nginx/html/index.html
    echo "index.html processed successfully"
else
    echo "WARNING: /usr/share/nginx/html/index.html not found, skipping envsubst"
fi

# Test Nginx configuration
echo "Testing Nginx configuration..."
nginx -t

# Start Nginx server
echo "Starting Nginx on port 80..."
nginx -g "daemon off;" &
NGINX_PID=$!
echo "Nginx started with PID: $NGINX_PID"

# Wait a moment for Nginx to start
sleep 2

# Verify Nginx is running
if ! kill -0 $NGINX_PID 2>/dev/null; then
    echo "ERROR: Nginx failed to start!"
    exit 1
fi

echo "Nginx is running successfully"

# Start backend server
if [ "$AP_CONTAINER_TYPE" = "APP" ] && [ "$AP_PM2_ENABLED" = "true" ]; then
    echo "Starting backend server with PM2 (APP mode)"
    pm2-runtime start dist/packages/server/api/main.cjs --name "activepieces-app" --node-args="--enable-source-maps" -i 0
else
    echo "Starting backend server with Node.js (WORKER mode or default)"
    node --enable-source-maps dist/packages/server/api/main.cjs
fi