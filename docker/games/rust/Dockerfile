FROM debian:bookworm-slim

# Install dependencies
RUN apt-get update && apt-get install -y \
    lib32gcc-s1 \
    curl \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create Rust server directory and set permissions BEFORE switching user
RUN mkdir -p /opt/rust && \
    mkdir -p /opt/steamcmd && \
    useradd -m -d /opt/steamcmd steamcmd && \
    chown -R steamcmd:steamcmd /opt/steamcmd /opt/rust

# Install SteamCMD
USER steamcmd
WORKDIR /opt/steamcmd
RUN curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf -

# Install Rust Server (AppID: 258550)
RUN /opt/steamcmd/steamcmd.sh +force_install_dir /opt/rust +login anonymous +app_update 258550 validate +quit

# Set working directory
WORKDIR /opt/rust

# Expose ports
# 28015 TCP/UDP - Game Port
# 28016 TCP - RCON Port
EXPOSE 28015/tcp 28015/udp 28016/tcp

# Default startup command
CMD ["/opt/rust/RustDedicated", "-batchmode", "+server.port", "28015", "+rcon.port", "28016", "+rcon.password", "changeme"]
