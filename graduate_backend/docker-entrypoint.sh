#!/bin/sh
set -e

# Check if SEED is set to true
if [ "${SEED:-false}" = "true" ]; then
    echo "🌱 Seeding database..."
    node utils/seedDatabase.js
    echo "✅ Database seeding complete."
fi

# Execute the main command (usually yarn start)
exec "$@"
