import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { executeSSHCommand } from './ssh-client';
import { logger } from './logger';

interface SSHConfig {
  host: string;
  port: number;
  user: string;
  keyPath?: string;
}

/**
 * Egyedi SFTP felhasználónév generálása
 */
export function generateSFTPUsername(serverId: string): string {
  // Rövidített server ID-t használunk (első 8 karakter)
  const shortId = serverId.substring(0, 8);
  return `sftp_${shortId}`;
}

/**
 * Erős jelszó generálása
 */
export function generateSFTPPassword(): string {
  // 20 karakteres véletlenszerű jelszó
  return randomBytes(16).toString('base64').slice(0, 20).replace(/[+/=]/g, (char) => {
    // Csere karakterek, hogy biztosan biztonságos legyen
    const replacements: Record<string, string> = {
      '+': 'A',
      '/': 'B',
      '=': 'C'
    };
    return replacements[char] || char;
  });
}

/**
 * SFTP felhasználó létrehozása a szerver gépen chroot jail-lel
 * A felhasználó csak a szerver könyvtárához férhet hozzá
 */
export async function createSFTPUser(
  serverId: string,
  serverPath: string,
  username: string,
  password: string,
  sshConfig: SSHConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Bash script, ami létrehozza az SFTP felhasználót és beállítja a chroot jail-t
    const setupScript = `
set -e

SFTP_USER="${username}"
SFTP_PASSWORD="${password}"
SERVER_PATH="${serverPath}"
SERVER_ID="${serverId}"

# Felhasználó létrehozása, ha nem létezik
if ! id -u "$SFTP_USER" >/dev/null 2>&1; then
  useradd -r -s /bin/bash -d "$SERVER_PATH" "$SFTP_USER"
  echo "Felhasználó létrehozva: $SFTP_USER"
else
  echo "Felhasználó már létezik: $SFTP_USER"
fi

# Jelszó beállítása (mindig frissítjük)
echo "$SFTP_USER:$SFTP_PASSWORD" | chpasswd
echo "Felhasználó jelszava beállítva: $SFTP_USER"

# Könyvtár létrehozása, ha nem létezik
mkdir -p "$SERVER_PATH"
chown "$SFTP_USER:$SFTP_USER" "$SERVER_PATH"
chmod 755 "$SERVER_PATH"

# Chroot jail beállítása SSH konfigban
SSH_CONFIG="/etc/ssh/sshd_config"
CHROOT_BLOCK="Match User $SFTP_USER
    ChrootDirectory $SERVER_PATH
    ForceCommand internal-sftp
    PasswordAuthentication yes
    PermitTunnel no
    AllowAgentForwarding no
    AllowTcpForwarding no
    X11Forwarding no"

# Ellenőrizzük, hogy már létezik-e a konfiguráció
if grep -q "Match User $SFTP_USER" "$SSH_CONFIG"; then
  echo "SSH konfiguráció már létezik a felhasználóhoz"
else
  # Hozzáadjuk a konfigurációt
  echo "" >> "$SSH_CONFIG"
  echo "# SFTP chroot jail for $SFTP_USER (Server: ${SERVER_ID})" >> "$SSH_CONFIG"
  echo "$CHROOT_BLOCK" >> "$SSH_CONFIG"
  
  # SSH daemon újraindítása
  if command -v systemctl >/dev/null 2>&1; then
    systemctl restart sshd || service sshd restart || true
  else
    service sshd restart || /etc/init.d/ssh restart || true
  fi
  echo "SSH konfiguráció frissítve és újraindítva"
fi

# Biztonság: A könyvtár feletti könyvtárak nem lehetnek írhatóak a felhasználó számára
# A chroot jail-nek szükséges, hogy a könyvtár feletti útvonal csak root tulajdonban legyen
PARENT_DIR=$(dirname "$SERVER_PATH")
while [ "$PARENT_DIR" != "/" ]; do
  chown root:root "$PARENT_DIR" 2>/dev/null || true
  chmod 755 "$PARENT_DIR" 2>/dev/null || true
  PARENT_DIR=$(dirname "$PARENT_DIR")
done

echo "SFTP felhasználó sikeresen beállítva: $SFTP_USER"
echo "Könyvtár: $SERVER_PATH"
`.trim();

    // SSH-n keresztül futtatjuk a scriptet
    const result = await executeSSHCommand(sshConfig, setupScript, 60000); // 60 másodperc timeout

    if (result.exitCode !== 0) {
      const errorMsg = result.stderr || result.stdout || 'Ismeretlen hiba';
      logger.error('SFTP felhasználó létrehozási hiba', new Error(errorMsg), {
        serverId,
        username,
        sshHost: sshConfig.host,
      });
      return {
        success: false,
        error: errorMsg,
      };
    }

    logger.info('SFTP felhasználó sikeresen létrehozva', {
      serverId,
      username,
      serverPath,
      sshHost: sshConfig.host,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('SFTP felhasználó létrehozási hiba', error, {
      serverId,
      username,
    });
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba',
    };
  }
}

/**
 * SFTP felhasználó törlése
 */
export async function deleteSFTPUser(
  username: string,
  sshConfig: SSHConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const deleteScript = `
set -e

SFTP_USER="${username}"
SSH_CONFIG="/etc/ssh/sshd_config"

# Felhasználó törlése
if id -u "$SFTP_USER" >/dev/null 2>&1; then
  userdel -r "$SFTP_USER" 2>/dev/null || userdel "$SFTP_USER" 2>/dev/null || true
  echo "Felhasználó törölve: $SFTP_USER"
else
  echo "Felhasználó nem létezik: $SFTP_USER"
fi

# SSH konfigurációból eltávolítás
if grep -q "Match User $SFTP_USER" "$SSH_CONFIG"; then
  # Megtaláljuk a Match User blokkot és töröljük
  # A sed parancs törli a Match User sortól a következő Match vagy a fájl végéig
  sed -i '/# SFTP chroot jail for $SFTP_USER/,/^$/d' "$SSH_CONFIG" 2>/dev/null || true
  sed -i '/Match User $SFTP_USER/,/X11Forwarding no/d' "$SSH_CONFIG" 2>/dev/null || true
  
  # SSH daemon újraindítása
  if command -v systemctl >/dev/null 2>&1; then
    systemctl restart sshd || service sshd restart || true
  else
    service sshd restart || /etc/init.d/ssh restart || true
  fi
  echo "SSH konfiguráció frissítve"
else
  echo "SSH konfiguráció nem található a felhasználóhoz"
fi

echo "SFTP felhasználó sikeresen törölve: $SFTP_USER"
`.trim();

    const result = await executeSSHCommand(sshConfig, deleteScript, 30000); // 30 másodperc timeout

    if (result.exitCode !== 0) {
      const errorMsg = result.stderr || result.stdout || 'Ismeretlen hiba';
      logger.warn('SFTP felhasználó törlési hiba', {
        username,
        error: errorMsg,
        sshHost: sshConfig.host,
      });
      // Még akkor is sikeresnek számítunk, ha a felhasználó már nem létezik
      if (errorMsg.includes('nem létezik') || errorMsg.includes('does not exist')) {
        return { success: true };
      }
      return {
        success: false,
        error: errorMsg,
      };
    }

    logger.info('SFTP felhasználó sikeresen törölve', {
      username,
      sshHost: sshConfig.host,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('SFTP felhasználó törlési hiba', error, {
      username,
    });
    return {
      success: false,
      error: error.message || 'Ismeretlen hiba',
    };
  }
}

/**
 * SFTP jelszó hash-elése bcrypt-tel
 */
export async function hashSFTPPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * SFTP jelszó ellenőrzése
 */
export async function verifySFTPPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

