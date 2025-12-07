# ARK Survival Ascended - Docker Image
# UE5 alapú szerver, Windows binary emulációval Wine-on Linux-en
# 
# Build: docker build -t ark-ascended:latest -f Dockerfile .
# Uso: docker run -d --name ark-server -v /path/to/server:/ark -p 7777:7777/udp -p 27015:27015/udp ark-ascended:latest

FROM debian:bookworm-slim

# Alapvető csomagok
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    wget \
    git \
    ca-certificates \
    jq \
    tmux \
    screen \
    net-tools \
    telnet \
    htop \
    vim \
    nano \
    && rm -rf /var/lib/apt/lists/*

# SteamCMD telepítése
RUN mkdir -p /steamcmd && \
    cd /steamcmd && \
    curl -sqL 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz' | tar xvzf - && \
    chmod +x /steamcmd/steamcmd.sh

# ARK szerver könyvtár
RUN mkdir -p /ark && chmod 777 /ark

# WORKDIR
WORKDIR /ark

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:27015 || exit 1

# Startup script
COPY start-server.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 7777/udp 27015/udp 27020/tcp

ENTRYPOINT ["/entrypoint.sh"]
