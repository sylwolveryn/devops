FROM node:24-alpine

ARG TZ=Europe/London
ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    TZ=${TZ} \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser

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
        cairo \
        && corepack enable && corepack prepare pnpm@latest --activate

# Create pwuser
RUN adduser -D pwuser && \
    mkdir -p /ms-playwright && \
    chown -R pwuser:pwuser /ms-playwright

USER pwuser
WORKDIR /home/pwuser

# Create app directory with dependencies (NO browser download)
RUN mkdir -p /home/pwuser/app && \
    cd /home/pwuser/app && \
    pnpm init && \
    pnpm add playwright dotenv jwt-decode uuid && \
    # Fix any vulnerabilities in the dependency tree
    cd /home/pwuser/app && \
    pnpm audit fix || true

ENV NODE_PATH="/home/pwuser/app/node_modules"

# Cleanup
USER root
RUN rm -rf /tmp/* /home/pwuser/.cache /home/pwuser/.local && \
    chmod -R 777 /ms-playwright

RUN apk del --no-cache \
    avahi \
    avahi-libs \
    libsndfile \
    curl \
    2>/dev/null || true

USER pwuser
WORKDIR /home/pwuser

CMD ["sh"]