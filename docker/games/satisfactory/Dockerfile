FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    lib32gcc-s1 \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create steamcmd user
RUN useradd -m -d /opt/steamcmd steamcmd

# Install SteamCMD
USER steamcmd
WORKDIR /opt/steamcmd
RUN curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -

# Create Satisfactory server directory
RUN mkdir -p /opt/satisfactory

# Install Satisfactory Server (AppID: 1690800)
RUN /opt/steamcmd/steamcmd.sh +force_install_dir /opt/satisfactory +login anonymous +app_update 1690800 validate +quit

# Set working directory
WORKDIR /opt/satisfactory

# Expose ports
# 7777 UDP - Game Port
# 15000 UDP - Beacon Port
# 15777 UDP - Query Port
EXPOSE 7777/udp 15000/udp 15777/udp

# Default startup command
CMD ["/opt/satisfactory/FactoryServer.sh"]
