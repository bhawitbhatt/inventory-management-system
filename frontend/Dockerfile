# =============================================================================
# Stage 1 — Build the React app with Vite
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps using lockfile if present
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --no-audit --no-fund; \
    else npm install --no-audit --no-fund; fi

COPY . .

# Vite bakes VITE_* env vars into the built bundle at build time
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

# =============================================================================
# Stage 2 — Serve the static bundle with nginx
# =============================================================================
FROM nginx:alpine AS runtime

RUN apk add --no-cache curl

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
