FROM node:23-slim

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy app source
COPY . .

# Remove any .env files that might have been copied
RUN rm -f .env .env.* .env.local .env.development .env.production

# Build the Next.js application
RUN yarn build

# Expose the frontend port
EXPOSE ${PORT:-3000}

# Command to start the application
CMD ["yarn", "start"]
