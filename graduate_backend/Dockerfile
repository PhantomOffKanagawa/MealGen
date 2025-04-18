FROM node:23-slim

WORKDIR /app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy app source
COPY . .

# Make entrypoint script executable
RUN chmod +x docker-entrypoint.sh

# Expose the API port
EXPOSE ${PORT:-4000}

# Set entrypoint to our custom script
ENTRYPOINT ["./docker-entrypoint.sh"]

# Command to run the application
CMD ["yarn", "start"]
