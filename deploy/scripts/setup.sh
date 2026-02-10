#!/usr/bin/env bash
# =============================================================================
# Nimbus - Quick Setup Script
# Sets up the development environment
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "=== Nimbus Development Setup ==="
echo ""

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Error: Node.js >= 20 is required"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "Error: pnpm is required. Install: npm i -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is required"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "Error: Node.js >= 20 required. Current: $(node -v)"
  exit 1
fi

echo "[1/5] Creating .env from template..."
if [ ! -f "$ROOT_DIR/.env" ]; then
  cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
  # Generate secrets
  NEXTAUTH_SECRET=$(openssl rand -base64 32)
  ENCRYPTION_KEY=$(openssl rand -hex 32)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|generate-a-secret-with-openssl-rand-base64-32|$NEXTAUTH_SECRET|" "$ROOT_DIR/.env"
    sed -i '' "s|generate-a-64-char-hex-key|$ENCRYPTION_KEY|" "$ROOT_DIR/.env"
  else
    sed -i "s|generate-a-secret-with-openssl-rand-base64-32|$NEXTAUTH_SECRET|" "$ROOT_DIR/.env"
    sed -i "s|generate-a-64-char-hex-key|$ENCRYPTION_KEY|" "$ROOT_DIR/.env"
  fi
  echo "  .env created with generated secrets"
else
  echo "  .env already exists, skipping"
fi

echo "[2/5] Starting PostgreSQL and Redis..."
cd "$ROOT_DIR"
docker compose up -d

echo "[3/5] Installing dependencies..."
pnpm install

echo "[4/5] Running database migrations..."
pnpm db:migrate

echo "[5/5] Seeding database..."
pnpm db:seed

echo ""
echo "=== Setup Complete ==="
echo "Run 'pnpm dev' to start the development server"
echo "Open http://localhost:3000"
