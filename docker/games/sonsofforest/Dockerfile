FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    lib32gcc-s1 \
    curl \
    wget \
    ca-certificates \
    wine64 \
    wine32 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Create directories and user with proper permissions BEFORE switching user
RUN mkdir -p /opt/sonsofforest && \
    mkdir -p /opt/steamcmd && \
    useradd -m -d /opt/steamcmd steamcmd && \
    chown -R steamcmd:steamcmd /opt/steamcmd /opt/sonsofforest

# Install SteamCMD
USER steamcmd
WORKDIR /opt/steamcmd
RUN curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -

# Install Sons of The Forest Server (AppID: 2465200)
RUN /opt/steamcmd/steamcmd.sh +force_install_dir /opt/sonsofforest +login anonymous +app_update 2465200 validate +quit

# Set working directory
WORKDIR /opt/sonsofforest

# Expose ports
# 8766 UDP - Game Port
# 27016 UDP - Query Port
EXPOSE 8766/udp 27016/udp

# Default startup command
CMD ["xvfb-run", "wine64", "/opt/sonsofforest/SonsOfTheForestDS.exe"]
