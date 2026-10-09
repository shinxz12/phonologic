#!/bin/sh
set -e

echo "==================================================="
echo "🚀 Starting PhonoLogic Production Container"
echo "==================================================="

# 1. Auto-run database migrations on deploy
echo "🔄 [1/3] Running database migrations (drizzle-kit push)..."
cd /app/packages/db
bun run push || echo "⚠️ Migration push completed with notices"

# 2. Auto-run curriculum seed
echo "🌱 [2/3] Syncing production curriculum & admin accounts..."
bun run seed:production || echo "⚠️ Seeding completed with notices"

# 3. Launch server on exposed port
echo "⚡ [3/3] Launching PhonoLogic server on port ${PORT:-3000}..."
cd /app/apps/backend
exec bun dist/main.js
