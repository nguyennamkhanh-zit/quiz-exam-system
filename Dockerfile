# Stage 1: Build & Dependencies
FROM node:24-bookworm-slim AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --ignore-scripts

COPY . .

# Stage 2: Runtime Production
FROM node:24-bookworm-slim AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=18095
ENV LOG_DIR=/var/log/app

# Tạo thư mục log và cấp quyền cho user node
RUN mkdir -p /var/log/app && chown -R node:node /var/log/app

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

COPY --chown=node:node src/ ./src/
COPY --chown=node:node public/ ./public/
COPY --chown=node:node db/ ./db/
COPY --chown=node:node tests/ ./tests/

USER node

EXPOSE 18095

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:18095/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "src/server.js"]
