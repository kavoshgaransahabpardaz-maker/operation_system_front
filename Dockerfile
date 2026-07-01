# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer-cached until package.json changes)
COPY package*.json ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY . .
# VITE_API_URL is intentionally left empty — Nginx proxies /api to the backend
# so the SPA uses the same origin (no CORS, no hardcoded host)
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our SPA-aware nginx config
COPY nginx.conf /etc/nginx/conf.d/app.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
