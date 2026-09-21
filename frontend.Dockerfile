FROM node:24-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# 2. Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY . ./
COPY --from=deps /app/node_modules ./node_modules
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ARG NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
ENV NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=${NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
ARG INTERNAL_API_URL
ENV INTERNAL_API_URL=${INTERNAL_API_URL}
# Ensure output: "standalone" is configured in next.config.ts before building
RUN npm run build

# 3. Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

# Set the correct permission for prerender cache
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output and static files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

CMD ["node", "server.js"]
