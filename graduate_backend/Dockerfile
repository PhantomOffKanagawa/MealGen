FROM node:23-slim

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy app source
COPY . .

# Expose the API port
EXPOSE ${PORT:-4000}

# Use a shell form CMD to run your logic before starting the app
# This will create a warning in the logs, but it will not affect the execution of the container
# This was a necessary last minute hotfix to ensure the database is seeded before starting the app
CMD set -e; \
    if [ "${SEED:-false}" = "true" ]; then \
        echo "🌱 Seeding database..."; \
        node utils/seedDatabase.js; \
        echo "✅ Database seeding complete."; \
    fi; \
    exec yarn start
