/**
 * ============================================================================
 * ARK: Survival Ascended Server Commands
 * ============================================================================
 * 
 * Start/Stop commands for ARK Ascended with Wine wrapper
 */

export const commands = {
  /**
   * Start ARK Ascended server with Wine wrapper
   * Runs Windows binary through Wine on Linux
   */
  startCommand: `
    #!/bin/bash
    set -e
    
    export WINEPREFIX="/opt/servers/{serverId}/wine"
    export WINEARCH=win64
    
    # Ensure Wine dependencies
    dpkg --add-architecture i386 2>/dev/null || true
    apt-get update 2>/dev/null || true
    apt-get install -y wine64 wine32:i386 2>/dev/null || true
    
    # Create wine prefix if needed
    if [ ! -d "$WINEPREFIX" ]; then
      wineboot -u
    fi
    
    # Navigate to server directory
    cd /opt/servers/{serverId}
    
    # Start ARK Ascended server with Wine
    # The server runs in the background, output to log file
    wine64 ./ShooterGame/Binaries/Win64/ArkAscendedServer.exe \
      -USEALTERNATESINPUT \
      -nosteamclient \
      -game \
      -log > /var/log/arkserver-{serverId}.log 2>&1 &
    
    # Write PID to file for tracking
    echo $! > /run/arkserver-{serverId}.pid
    
    echo "ARK Ascended server started (PID: $!)"
  `,

  /**
   * Stop ARK Ascended server gracefully
   * Sends SIGTERM to allow server to save and shutdown cleanly
   */
  stopCommand: `
    #!/bin/bash
    set -e
    
    PID_FILE="/run/arkserver-{serverId}.pid"
    
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      
      # Send SIGTERM for graceful shutdown
      if kill -0 "$PID" 2>/dev/null; then
        echo "Stopping ARK Ascended server (PID: $PID)..."
        kill -TERM "$PID"
        
        # Wait for server to shutdown (max 60 seconds)
        WAIT=0
        while kill -0 "$PID" 2>/dev/null && [ $WAIT -lt 60 ]; do
          sleep 1
          WAIT=$((WAIT+1))
        done
        
        # Force kill if still running
        if kill -0 "$PID" 2>/dev/null; then
          echo "Force killing ARK Ascended server..."
          kill -9 "$PID"
        fi
        
        rm -f "$PID_FILE"
        echo "ARK Ascended server stopped"
      else
        echo "Server process not found (PID: $PID)"
        rm -f "$PID_FILE"
      fi
    else
      echo "No PID file found for ARK server"
    fi
  `,

  /**
   * Restart ARK Ascended server
   * Stops and starts the server
   */
  restartCommand: `
    #!/bin/bash
    set -e
    
    PID_FILE="/run/arkserver-{serverId}.pid"
    
    # Stop server
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        kill -TERM "$PID"
        sleep 5
        if kill -0 "$PID" 2>/dev/null; then
          kill -9 "$PID"
        fi
      fi
      rm -f "$PID_FILE"
    fi
    
    # Wait before restart
    sleep 2
    
    # Start server (same as startCommand)
    export WINEPREFIX="/opt/servers/{serverId}/wine"
    export WINEARCH=win64
    
    cd /opt/servers/{serverId}
    wine64 ./ShooterGame/Binaries/Win64/ArkAscendedServer.exe \
      -USEALTERNATESINPUT \
      -nosteamclient \
      -game \
      -log > /var/log/arkserver-{serverId}.log 2>&1 &
    
    echo $! > "$PID_FILE"
    echo "ARK Ascended server restarted (PID: $!)"
  `,

  /**
   * Query server status
   * Check if server process is running
   */
  statusCommand: `
    #!/bin/bash
    
    PID_FILE="/run/arkserver-{serverId}.pid"
    
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 "$PID" 2>/dev/null; then
        echo "RUNNING"
        exit 0
      else
        echo "STOPPED"
        rm -f "$PID_FILE"
        exit 1
      fi
    else
      echo "STOPPED"
      exit 1
    fi
  `,
};
