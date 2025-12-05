# ARK: Survival Ascended Docker Image
# Uses Wine to run Windows binaries on Linux
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    WINE_CPU_TOPOLOGY=2 \
    WINEARCH=win64 \
    WINEPREFIX=/wine

# Install dependencies
RUN apt-get update && apt-get install -y \
    wine-stable \
    wine64 \
    xvfb \
    curl \
    wget \
    ca-certificates \
    lib32gcc-s1 \
    lib32stdc++6 \
    && rm -rf /var/lib/apt/lists/*

# Create necessary directories
RUN mkdir -p /opt/servers \
    && mkdir -p /wine \
    && mkdir -p /steamcmd

# Download and install SteamCMD
RUN cd /steamcmd && \
    wget -q https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz && \
    tar -xzf steamcmd_linux.tar.gz && \
    rm steamcmd_linux.tar.gz && \
    chmod +x /steamcmd/steamcmd.sh

# Create start script
COPY start-server.sh /opt/servers/start-server.sh
RUN chmod +x /opt/servers/start-server.sh

# Create wine prefix
RUN export DISPLAY=:99 && \
    Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 & \
    XVFB_PID=$! && \
    wineboot -i && \
    kill $XVFB_PID 2>/dev/null || true

# Volume mount points
VOLUME ["/data", "/cluster"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:27015/health || exit 1

WORKDIR /opt/servers

ENTRYPOINT ["/opt/servers/start-server.sh"]
