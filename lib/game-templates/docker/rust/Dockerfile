# Rust - Docker Image
# Linux native szerver
# 
# Build: docker build -t rust:latest -f Dockerfile .
# Use: docker run -d --name rust-server -v /path/to/server:/rust -p 28015:28015/udp -p 28016:28016/udp rust:latest

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
    lib32gcc-s1 \
    && rm -rf /var/lib/apt/lists/*

# SteamCMD telepítése (32-bit support szükséges)
RUN dpkg --add-architecture i386 && \
    apt-get update && apt-get install -y libc6:i386 && \
    mkdir -p /steamcmd && \
    cd /steamcmd && \
    curl -sqL 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz' | tar xvzf - && \
    chmod +x /steamcmd/steamcmd.sh && \
    rm -rf /var/lib/apt/lists/*

# Rust szerver könyvtár
RUN mkdir -p /rust && chmod 777 /rust

# WORKDIR
WORKDIR /rust

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:28016 || exit 1

# Startup script
COPY start-server.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 28015/udp 28016/udp 28017/tcp

ENTRYPOINT ["/entrypoint.sh"]
