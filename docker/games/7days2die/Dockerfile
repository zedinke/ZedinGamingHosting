# 7 Days to Die Dedicated Server Docker Image
# Steam App ID: 251570

FROM ubuntu:22.04

# Környezeti változók
ENV DEBIAN_FRONTEND=noninteractive
ENV STEAMCMD_DIR=/opt/steamcmd
ENV SERVER_DIR=/opt/7days2die
ENV STEAM_APP_ID=251570
ENV STEAM_APP_NAME=7DaysToDie

# Szükséges csomagok telepítése
RUN apt-get update && \
    apt-get install -y \
    curl \
    lib32gcc-s1 \
    lib32stdc++6 \
    libc6-i386 \
    locales \
    wget \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Locale beállítás
RUN locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

# SteamCMD telepítés
RUN mkdir -p ${STEAMCMD_DIR} && \
    cd ${STEAMCMD_DIR} && \
    curl -sqL "https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz" | tar zxvf - && \
    chmod +x steamcmd.sh

# Szerver könyvtár létrehozása
RUN mkdir -p ${SERVER_DIR}

# Entrypoint script
COPY docker/games/7days2die/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Munkakönyvtár
WORKDIR ${SERVER_DIR}

# Portok (game, telnet, webmap)
EXPOSE 26900/udp 8081/tcp 8080/tcp

# Entrypoint
ENTRYPOINT ["/entrypoint.sh"]

