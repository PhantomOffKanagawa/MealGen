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

# Command to run the application
CMD ["yarn", "start"]
