FROM node:24-alpine

ARG TZ=Europe/London
ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    TZ=${TZ} \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    COREPACK_ENABLE=0 \
    PNPM_VERSION=11.0.5

# Install Alpine's native Chromium and dependencies
RUN apk update && \
    apk upgrade --no-cache --available && \
    apk add --no-cache \
        ca-certificates \
        curl \
        bash \
        chromium \
        nss \
        freetype \
        harfbuzz \
        ttf-freefont \
        fontconfig \
        dbus \
        mesa-gl \
        mesa-dri-gallium \
        libxcb \
        libxshmfence \
        libxrandr \
        libxdamage \
        libxcomposite \
        libxfixes \
        alsa-lib \
        at-spi2-core \
        cups-libs \
        libdrm \
        gtk+3.0 \
        pango \
        cairo

# Install pnpm directly via npm (bypass Corepack completely)
RUN npm install -g pnpm@11.0.5 && \
    pnpm --version

# Completely remove Corepack if it exists
RUN rm -f /usr/local/bin/corepack && \
    rm -rf /usr/local/lib/node_modules/corepack 2>/dev/null || true

# Create pwuser
RUN adduser -D pwuser && \
    mkdir -p /ms-playwright && \
    chown -R pwuser:pwuser /ms-playwright

USER pwuser
WORKDIR /home/pwuser

# Create app directory with all dependencies pre-baked
RUN mkdir -p /home/pwuser/app && \
    cd /home/pwuser/app && \
    pnpm init && \
    pnpm add \
        playwright \
        @playwright/test \
        typescript \
        playwright-ctrf-json-reporter \
        dotenv \
        jwt-decode \
        uuid && \
    pnpm audit fix || true

ENV NODE_PATH="/home/pwuser/app/node_modules" \
    PATH="/home/pwuser/app/node_modules/.bin:${PATH}"

# Cleanup
USER root
RUN rm -rf /tmp/* /home/pwuser/.cache /home/pwuser/.local && \
    chmod -R 777 /ms-playwright && \
    apk del --no-cache curl 2>/dev/null || true

USER pwuser
WORKDIR /home/pwuser

CMD ["sh"]