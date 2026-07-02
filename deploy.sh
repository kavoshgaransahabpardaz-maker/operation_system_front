#!/usr/bin/env bash
# deploy.sh — build and start the BrokerAI frontend container

set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"
FORCE_BUILD=${1:-}

echo "==> Checking .env.prod exists..."
if [ ! -f .env.prod ]; then
  echo "ERROR: .env.prod not found. Copy .env.prod.example and fill in values."
  exit 1
fi

echo "==> Building frontend image..."
if [ "$FORCE_BUILD" = "--build" ]; then
  $COMPOSE build --no-cache
else
  $COMPOSE build
fi

echo "==> Starting frontend..."
$COMPOSE up -d

echo "==> Removing dangling images..."
docker image prune -f

echo ""
echo "✓ Frontend deployed."
PORT=$(grep ^FRONTEND_PORT .env.prod | cut -d= -f2 || echo 80)
echo "  http://$(hostname -I | awk '{print $1}'):${PORT}"
echo ""
echo "  Logs:  docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop:  docker compose -f docker-compose.prod.yml down"
