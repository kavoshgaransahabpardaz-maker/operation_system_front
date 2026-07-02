# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer-cached until package.json changes)
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
# VITE_API_URL is intentionally left empty — Nginx proxies /api to the backend
# so the SPA uses the same origin (no CORS, no hardcoded host)
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx config as a template (BACKEND_URL substituted at container start)
COPY nginx.conf /etc/nginx/conf.d/app.conf.template

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Substitute ${BACKEND_URL} from env, write final config, then start nginx
CMD ["/bin/sh", "-c", "envsubst '${BACKEND_URL}' < /etc/nginx/conf.d/app.conf.template > /etc/nginx/conf.d/app.conf && nginx -g 'daemon off;'"]
