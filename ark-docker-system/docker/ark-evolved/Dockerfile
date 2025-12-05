FROM ubuntu:22.04

# Set non-interactive installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    lib32gcc-s1 \
    lib32stdc++6 \
    wget \
    curl \
    gzip \
    tar \
    bzip2 \
    unzip \
    iputils-ping \
    dnsutils \
    telnet \
    ca-certificates \
    software-properties-common \
    build-essential \
    locales \
    tzdata \
    && rm -rf /var/lib/apt/lists/*

# Set locale
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# Create app user
RUN useradd -m -s /bin/bash ark

# Create directories
RUN mkdir -p /ark/server \
    && mkdir -p /ark/data \
    && mkdir -p /ark/logs \
    && mkdir -p /ark/backups \
    && mkdir -p /ark/steamcmd \
    && chown -R ark:ark /ark

# Install SteamCMD
RUN cd /tmp && \
    wget -q 'https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz' && \
    tar -xzf steamcmd_linux.tar.gz -C /ark/steamcmd && \
    rm steamcmd_linux.tar.gz && \
    chmod +x /ark/steamcmd/steamcmd.sh && \
    chown -R ark:ark /ark/steamcmd

# Copy start script
COPY start-server.sh /ark/start-server.sh
RUN chmod +x /ark/start-server.sh && \
    chown ark:ark /ark/start-server.sh

WORKDIR /ark/server

# Switch to ark user
USER ark

# Expose ports
EXPOSE 7777/udp 7778/udp 27015 32330 32331 32332

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=300s --retries=3 \
    CMD curl -f http://localhost:27015/health || exit 1

# Entry point
ENTRYPOINT ["/ark/start-server.sh"]
