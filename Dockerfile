# Use Debian-based image for stability (fixes Alpine exit 127 issues)
FROM node:20-slim

# Install system dependencies for Prisma
RUN apt-get update && apt-get install -y openssl wget && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --legacy-peer-deps

# Prisma client is generated via postinstall in package.json

# Copy source code
COPY . .

# Build-time variables
ARG DATABASE_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXTAUTH_SECRET

ENV DATABASE_URL=$DATABASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Build application
RUN npm run build

EXPOSE 3000

# Standalone mode startup
CMD ["node", ".next/standalone/server.js"]
