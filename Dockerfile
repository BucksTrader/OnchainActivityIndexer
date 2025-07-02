FROM node:18-slim

WORKDIR /app

# Install dependencies needed for building native modules
RUN apt-get update && \
    apt-get install -y build-essential python3 git ca-certificates && \
    apt-get clean

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy project files
COPY . .

# Build the project
RUN npm run build

# Start the indexer
CMD ["node", "-r", "dotenv/config", "lib/main.js"]