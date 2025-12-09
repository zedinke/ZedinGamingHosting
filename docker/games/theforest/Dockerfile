FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    lib32gcc-s1 \
    curl \
    wget \
    ca-certificates \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Create steamcmd user
RUN useradd -m -d /opt/steamcmd steamcmd

# Install SteamCMD
USER steamcmd
WORKDIR /opt/steamcmd
RUN curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -

# Create The Forest server directory
RUN mkdir -p /opt/theforest

# Install The Forest Server (AppID: 556450)
RUN /opt/steamcmd/steamcmd.sh +force_install_dir /opt/theforest +login anonymous +app_update 556450 validate +quit

# Set working directory
WORKDIR /opt/theforest

# Expose ports
# 27015 UDP - Game Port
# 27016 UDP - Query Port
# 8766 TCP - Steam Port
EXPOSE 27015/udp 27016/udp 8766/tcp

# Default startup command
CMD ["xvfb-run", "/opt/theforest/TheForestDedicatedServer.exe"]
