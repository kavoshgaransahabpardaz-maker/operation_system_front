#!/usr/bin/env bash
# deploy.sh — build and deploy the full BrokerAI stack on a production server
#
# Usage:
#   chmod +x deploy.sh
#   ./deploy.sh           # pull, build, migrate, restart
#   ./deploy.sh --build   # force full rebuild of images

set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.prod"
FORCE_BUILD=${1:-}

echo "==> Checking .env.prod exists..."
if [ ! -f .env.prod ]; then
  echo "ERROR: .env.prod not found. Copy .env.prod.example and fill in secrets."
  exit 1
fi

echo "==> Pulling base images..."
$COMPOSE pull postgres redis minio

echo "==> Building application images..."
if [ "$FORCE_BUILD" = "--build" ]; then
  $COMPOSE build --no-cache
else
  $COMPOSE build
fi

echo "==> Starting infrastructure (postgres, redis, minio)..."
$COMPOSE up -d postgres redis minio

echo "==> Waiting for postgres to be healthy..."
until $COMPOSE exec -T postgres pg_isready -U "$(grep ^POSTGRES_USER .env.prod | cut -d= -f2)" -q; do
  sleep 2
done

echo "==> Running database migrations..."
$COMPOSE run --rm api alembic upgrade head

echo "==> Starting all services..."
$COMPOSE up -d

echo "==> Removing dangling images..."
docker image prune -f

echo ""
echo "✓ Deployment complete."
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):$(grep ^FRONTEND_PORT .env.prod | cut -d= -f2 || echo 80)"
echo "  MinIO console: http://127.0.0.1:9001  (SSH tunnel to access)"
echo ""
echo "  View logs:  docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop stack: docker compose -f docker-compose.prod.yml down"
