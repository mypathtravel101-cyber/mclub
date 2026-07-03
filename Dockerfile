FROM node:20-slim AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV DATABASE_URL="file:/app/data/custom.db"
ENV JWT_SECRET="mclub-crm-dev-secret-change-in-production"
RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV DATABASE_URL="file:/app/data/custom.db"
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV JWT_SECRET="mclub-crm-dev-secret-change-in-production"

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build (includes server.js, .next, node_modules, package.json)
COPY --from=builder /app/.next/standalone ./
# Copy static assets (required by Next.js)
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets
COPY --from=builder /app/public ./public
# Copy Prisma schema (for runtime migrations if needed)
COPY --from=builder /app/prisma ./prisma

# Create persistent data directory (NOT copying db from build)
# Database will be created here on first run via prisma db push
RUN mkdir -p /app/data /app/uploads/events && chown -R nextjs:nodejs /app/data /app/uploads

# Ensure all files are owned by nextjs user
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s--start-period=10s--retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]