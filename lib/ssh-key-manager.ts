import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';

const execAsync = promisify(exec);

interface GenerateSSHKeyResult {
  success: boolean;
  keyPath?: string;
  publicKey?: string;
  error?: string;
}

interface CopyPublicKeyResult {
  success: boolean;
  error?: string;
}

/**
 * SSH kulcs generálása egyedi névvel
 */
export async function generateSSHKey(
  machineId: string,
  ipAddress: string
): Promise<GenerateSSHKeyResult> {
  try {
    // SSH könyvtár ellenőrzése/létrehozása
    const sshDir = join(homedir() || '/root', '.ssh');
    const keyName = `machine_${machineId}_${ipAddress.replace(/\./g, '_')}`;
    const keyPath = join(sshDir, keyName);

    // Ellenőrizzük, hogy létezik-e már a kulcs
    if (existsSync(keyPath)) {
      // Ha létezik, olvassuk be a publikus kulcsot
      try {
        const publicKey = await readFile(`${keyPath}.pub`, 'utf-8');
        return {
          success: true,
          keyPath,
          publicKey: publicKey.trim(),
        };
      } catch (error) {
        // Ha nincs publikus kulcs, generáljunk újat
      }
    }

    // SSH könyvtár létrehozása, ha nem létezik
    try {
      await mkdir(sshDir, { recursive: true, mode: 0o700 });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    // SSH kulcs generálása (ed25519, passphrase nélkül)
    const generateCommand = `ssh-keygen -t ed25519 -f "${keyPath}" -N "" -C "zedingaming-${machineId}" -q`;
    
    await execAsync(generateCommand, {
      timeout: 30000, // 30 másodperc timeout
    });

    // Publikus kulcs olvasása
    const publicKey = await readFile(`${keyPath}.pub`, 'utf-8');

    // Jogosultságok beállítása
    await execAsync(`chmod 600 "${keyPath}"`);
    await execAsync(`chmod 644 "${keyPath}.pub"`);

    return {
      success: true,
      keyPath,
      publicKey: publicKey.trim(),
    };
  } catch (error: any) {
    console.error('SSH kulcs generálási hiba:', error);
    return {
      success: false,
      error: error.message || 'SSH kulcs generálás sikertelen',
    };
  }
}

/**
 * Publikus kulcs másolása a cél szerverre SSH password authentication használatával
 */
export async function copyPublicKeyToServer(
  publicKey: string,
  host: string,
  port: number,
  user: string,
  password: string
): Promise<CopyPublicKeyResult> {
  try {
    // Publikus kulcs hozzáadása a remote authorized_keys fájlhoz
    // sshpass használata a jelszó átadásához
    const command = `sshpass -p '${password.replace(/'/g, "'\\''")}' ssh -p ${port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${user}@${host} "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '${publicKey.replace(/'/g, "'\\''")}' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000, // 30 másodperc timeout
    });

    if (stderr && !stderr.includes('Warning: Permanently added')) {
      // Ha van hiba (kivéve a known_hosts warning), akkor sikertelen
      return {
        success: false,
        error: stderr || 'Publikus kulcs másolás sikertelen',
      };
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Publikus kulcs másolási hiba:', error);
    
    // Próbáljuk meg kinyerni a hibaüzenetet
    let errorMessage = error.message || 'Publikus kulcs másolás sikertelen';
    if (error.stderr) {
      errorMessage = error.stderr;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * SSH kapcsolat tesztelése kulcs alapú autentikációval
 */
export async function testSSHKeyConnection(
  keyPath: string,
  host: string,
  port: number,
  user: string
): Promise<boolean> {
  try {
    const command = `ssh -i "${keyPath}" -p ${port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 ${user}@${host} "echo 'SSH key connection successful'"`;

    const { stdout } = await execAsync(command, {
      timeout: 15000, // 15 másodperc timeout
    });

    return stdout.includes('SSH key connection successful');
  } catch (error) {
    return false;
  }
}

