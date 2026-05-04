FROM ubuntu:noble

ARG DEBIAN_FRONTEND=noninteractive
ARG TZ=Europe/London
ENV LANG=C.UTF-8 \
    LC_ALL=C.UTF-8 \
    TZ=${TZ} \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Update and install essentials (as root)
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gpg \
        tzdata \
        && \
    # Add NodeSource repository for Node.js 24
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | \
        gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" \
        > /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        nodejs \
        && \
    # Create pwuser
    useradd -m -s /bin/bash pwuser && \
    mkdir -p /ms-playwright && \
    chown -R pwuser:pwuser /ms-playwright && \
    # Enable corepack for pnpm
    corepack enable && corepack prepare pnpm@latest --activate && \
    # Remove build-only packages
    apt-get purge -y gpg curl && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Install Playwright system dependencies AS ROOT (avoids su issue)
RUN npx playwright install-deps chromium

# Switch to pwuser for the rest
USER pwuser
WORKDIR /home/pwuser

# Create a local app directory with dependencies
RUN mkdir -p /home/pwuser/app && \
    cd /home/pwuser/app && \
    pnpm init && \
    pnpm add playwright dotenv jwt-decode uuid

# Install Chromium browser ONLY (not deps, those were done as root)
RUN cd /home/pwuser/app && npx playwright install chromium

# Set NODE_PATH so modules are findable from anywhere
ENV NODE_PATH="/home/pwuser/app/node_modules"

# Cleanup as root
USER root
RUN rm -rf /tmp/* /home/pwuser/.cache && \
    chmod -R 777 /ms-playwright

USER pwuser
WORKDIR /home/pwuser

CMD ["/bin/bash"]