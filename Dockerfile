# ==============================================================================
# Multi-Stage Dockerfile for SuPrabhaat (सुप्रभात)
# Includes Chromium dependencies for headless WhatsApp Web puppeteer session.
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies if needed
COPY package*.json ./
COPY scripts/ ./scripts/
RUN npm ci --omit=dev

# ------------------------------------------------------------------------------
# Stage 2: Minimal Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-slim AS runner

WORKDIR /app

# Install system libraries required for headless Chromium
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    fonts-noto-color-emoji \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    ca-certificates \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Environment variables for Puppeteer inside Linux container
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3000

# Create unprivileged application user
RUN groupadd -g 10001 suprabhaat && \
    useradd -u 10001 -g suprabhaat -m -s /bin/bash suprabhaat

# Copy production node_modules from builder
COPY --from=builder --chown=suprabhaat:suprabhaat /app/node_modules ./node_modules

# Copy application code
COPY --chown=suprabhaat:suprabhaat package*.json ./
COPY --chown=suprabhaat:suprabhaat scripts/ ./scripts/
COPY --chown=suprabhaat:suprabhaat src/ ./src/
COPY --chown=suprabhaat:suprabhaat public/ ./public/

# Ensure runtime directories exist with correct permissions
RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache /app/public/images /app/storage && \
    chown -R suprabhaat:suprabhaat /app

# Run as non-root user
USER suprabhaat

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health/liveness').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/index.js"]
