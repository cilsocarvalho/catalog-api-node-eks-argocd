# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
WORKDIR /srv
ENV NODE_ENV=production
COPY package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /srv
RUN adduser -D -u 10001 appuser
COPY --from=deps /srv/node_modules ./node_modules
COPY . .
USER 10001
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget -qO- http://127.0.0.1:8080/health || exit 1
CMD ["node","src/index.js"]
