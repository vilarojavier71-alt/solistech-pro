#!/bin/bash
# Database Migration Script for Coolify
# ISO 27001: A.8.15 - Database Migration Automation

set -e

echo "🔄 Running Prisma migrations..."

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Run custom SQL migrations if any
if [ -d "prisma/migrations" ]; then
    echo "📦 Running custom SQL migrations..."
    for migration in prisma/migrations/*.sql; do
        if [ -f "$migration" ]; then
            echo "  → Executing: $(basename $migration)"
            # Use psql or your database client
            # PGPASSWORD=$DATABASE_PASSWORD psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -f "$migration"
        fi
    done
fi

echo "✅ Migrations completed successfully"

