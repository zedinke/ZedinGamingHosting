FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    lib32gcc-s1 \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create directories and user with proper permissions BEFORE switching user
RUN mkdir -p /opt/dayz && \
    mkdir -p /opt/steamcmd && \
    useradd -m -d /opt/steamcmd steamcmd && \
    chown -R steamcmd:steamcmd /opt/steamcmd /opt/dayz

# Install SteamCMD
USER steamcmd
WORKDIR /opt/steamcmd
RUN curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -

# Install DayZ Server (AppID: 223350)
RUN /opt/steamcmd/steamcmd.sh +force_install_dir /opt/dayz +login anonymous +app_update 223350 validate +quit

# Set working directory
WORKDIR /opt/dayz

# Expose ports
# 2302 UDP - Game Port
# 2303 UDP - Query Port
# 2304 UDP - Steam Query Port
EXPOSE 2302/udp 2303/udp 2304/udp

# Default startup command
CMD ["/opt/dayz/DayZServer", "-config=serverDZ.cfg", "-port=2302", "-profiles=/opt/dayz/profiles"]
