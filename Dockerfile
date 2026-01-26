# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma (needed during build)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY . .

# Build frontend
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY --from=builder /app/package*.json ./

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma/

# Install production dependencies (this includes @prisma/client)
RUN npm ci --only=production

# Install prisma CLI and tsx for running the server
RUN npm install prisma tsx

# Copy the generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source (TypeScript)
COPY --from=builder /app/server ./server

# Expose port (Cloud Run uses 8080)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production

# Start the application using tsx
CMD ["npx", "tsx", "server/index.ts"]
