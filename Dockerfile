FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openjdk-17-jdk ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN mkdir -p build/java && npm run build:java

ENV NODE_ENV=production
CMD ["npm", "start"]
