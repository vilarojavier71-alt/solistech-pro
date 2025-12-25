FROM node:20-alpine

# CRITICAL: Ensure npm/node binaries exist (fixes exit code 127)
RUN apk add --no-cache openssl libc6-compat wget nodejs npm

WORKDIR /app

# Copy dependency files first for Docker cache optimization
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Verify npm exists then install dependencies
RUN which npm && npm ci --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy remaining source code
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
