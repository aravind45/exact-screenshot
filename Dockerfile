# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for Prisma (needed during build)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install ALL dependencies (including devDependencies for build)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copy source files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build frontend
RUN npm run build

# Production stage
FROM node:20-slim AS runner

WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY --from=builder /app/package*.json ./

# Install ONLY production dependencies
RUN npm ci --only=production

# Install tsx for running TypeScript server
RUN npm install tsx

# Copy built frontend
COPY --from=builder /app/dist ./dist

# Copy server source (TypeScript)
COPY --from=builder /app/server ./server

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Expose port (Cloud Run uses 8080)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the application using tsx
CMD ["npx", "tsx", "server/index.ts"]
