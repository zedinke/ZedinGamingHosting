FROM mcr.microsoft.com/windows/servercore:ltsc2022

# Set error action preference
ENV ErrorActionPreference=Stop

# Install Chocolatey
RUN powershell -Command \
    iex ((New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072); \
    iex (New-Object Net.WebClient).DownloadString('https://chocolatey.org/install.ps1')

# Install required packages via Chocolatey
RUN choco install -y \
    wine-staging \
    winetricks \
    dotnet-desktop-runtime \
    vcredist-all \
    directx-runtime

# Install DXVK for better graphics support
RUN powershell -Command \
    $ProgressPreference = 'SilentlyContinue'; \
    wget -Uri 'https://github.com/doitsujin/dxvk/releases/download/v1.10.3/dxvk-1.10.3.tar.gz' -OutFile 'C:\dxvk.tar.gz'; \
    tar -xzf 'C:\dxvk.tar.gz' -C 'C:\' ; \
    Remove-Item 'C:\dxvk.tar.gz'

# Create ARK directories
RUN powershell -Command \
    New-Item -ItemType Directory -Force -Path 'C:\ark\server' ; \
    New-Item -ItemType Directory -Force -Path 'C:\ark\data' ; \
    New-Item -ItemType Directory -Force -Path 'C:\ark\logs' ; \
    New-Item -ItemType Directory -Force -Path 'C:\ark\backups' ; \
    New-Item -ItemType Directory -Force -Path 'C:\steam'

# Set up Wine environment
ENV WINE_CPU_TOPOLOGY=4:2
ENV WINE_SHARED_MEMORY=1
ENV DXVK_HUD=memory,fps
ENV WINEPREFIX=C:\wine

# Copy start script
COPY start-server.sh /ark/start-server.sh

WORKDIR C:\ark\server

# Expose game ports
EXPOSE 7777/udp 7778/udp 27015 32330 32331 32332

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=300s --retries=3 \
    CMD powershell -Command \
    if ((Get-Process ArkAscendedServer -ErrorAction SilentlyContinue) -ne $null) { exit 0 } else { exit 1 }

# Set entrypoint
ENTRYPOINT ["powershell", "-Command", "cd C:\\ark && bash start-server.sh"]
