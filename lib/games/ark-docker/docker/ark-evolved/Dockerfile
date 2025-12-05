# ARK: Survival Evolved Docker Image
# Linux native binary
FROM ubuntu:22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    lib32gcc-s1 \
    lib32stdc++6 \
    libfontconfig1 \
    libcurl4 \
    build-essential \
    glibc-source \
    && rm -rf /var/lib/apt/lists/*

# Create necessary directories
RUN mkdir -p /opt/servers \
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

# Volume mount points
VOLUME ["/data", "/cluster"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD curl -f http://localhost:27015/health || exit 1

WORKDIR /opt/servers

ENTRYPOINT ["/opt/servers/start-server.sh"]
