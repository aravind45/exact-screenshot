# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install openssl for Prisma (needed during build)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source files
COPY . .

# Build server
RUN npm run build:server

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Install openssl for Prisma runtime
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY --from=builder /app/package*.json ./

# Copy Prisma schema
COPY --from=builder /app/prisma ./prisma/

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts

# Copy the generated Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy built app
COPY --from=builder /app/dist ./dist

# Copy startup script
COPY --from=builder /app/server/startup.sh ./server/startup.sh
RUN chmod +x ./server/startup.sh

# Expose port (Cloud Run uses 8080)
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the application using startup script
CMD ["sh", "./server/startup.sh"]
