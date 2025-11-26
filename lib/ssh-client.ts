import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { readFile } from 'fs/promises';

const execAsync = promisify(exec);

interface SSHConfig {
  host: string;
  port: number;
  user: string;
  keyPath?: string;
  password?: string;
}

interface SSHCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/**
 * SSH parancs végrehajtása
 */
export async function executeSSHCommand(
  config: SSHConfig,
  command: string,
  timeout: number = 300000 // 5 perc timeout (agent telepítés hosszú lehet)
): Promise<SSHCommandResult> {
  return new Promise((resolve) => {
    let sshArgs: string[];
    let sshCommand: string;

    if (config.keyPath) {
      // SSH kulcs használata
      sshCommand = 'ssh';
      sshArgs = [
        '-i', config.keyPath,
        '-p', config.port.toString(),
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'ConnectTimeout=10',
        `${config.user}@${config.host}`,
        command
      ];
    } else if (config.password) {
      // Jelszó használata (sshpass szükséges)
      sshCommand = 'sshpass';
      sshArgs = [
        '-p', config.password,
        'ssh',
        '-p', config.port.toString(),
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-o', 'ConnectTimeout=10',
        `${config.user}@${config.host}`,
        command
      ];
    } else {
      resolve({
        stdout: '',
        stderr: 'SSH kulcs vagy jelszó szükséges',
        exitCode: 1,
      });
      return;
    }

    const child = spawn(sshCommand, sshArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timeoutId: NodeJS.Timeout | null = null;

    // Timeout beállítása
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          stdout,
          stderr: stderr || 'SSH parancs timeout',
          exitCode: 124, // timeout exit code
        });
      }, timeout);
    }

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });

    child.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      resolve({
        stdout,
        stderr: stderr || error.message || 'SSH hiba',
        exitCode: 1,
      });
    });
  });
}

/**
 * Fájl másolása SSH-n keresztül (SCP)
 */
export async function copyFileViaSSH(
  config: SSHConfig,
  localPath: string,
  remotePath: string
): Promise<SSHCommandResult> {
  try {
    let scpCommand: string;

    if (config.keyPath) {
      scpCommand = `scp -i ${config.keyPath} -P ${config.port} -o StrictHostKeyChecking=no ${localPath} ${config.user}@${config.host}:${remotePath}`;
    } else if (config.password) {
      scpCommand = `sshpass -p '${config.password}' scp -P ${config.port} -o StrictHostKeyChecking=no ${localPath} ${config.user}@${config.host}:${remotePath}`;
    } else {
      throw new Error('SSH kulcs vagy jelszó szükséges');
    }

    const { stdout, stderr } = await execAsync(scpCommand, {
      timeout: 60000, // 60 másodperc timeout
    });

    return {
      stdout,
      stderr,
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      stdout: '',
      stderr: error.message || 'SCP hiba',
      exitCode: error.code || 1,
    };
  }
}

/**
 * Fájl letöltése SSH-n keresztül (SCP)
 */
export async function downloadFileViaSSH(
  config: SSHConfig,
  remotePath: string,
  localPath: string
): Promise<SSHCommandResult> {
  try {
    let scpCommand: string;

    if (config.keyPath) {
      scpCommand = `scp -i ${config.keyPath} -P ${config.port} -o StrictHostKeyChecking=no ${config.user}@${config.host}:${remotePath} ${localPath}`;
    } else if (config.password) {
      scpCommand = `sshpass -p '${config.password}' scp -P ${config.port} -o StrictHostKeyChecking=no ${config.user}@${config.host}:${remotePath} ${localPath}`;
    } else {
      throw new Error('SSH kulcs vagy jelszó szükséges');
    }

    const { stdout, stderr } = await execAsync(scpCommand, {
      timeout: 60000,
    });

    return {
      stdout,
      stderr,
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      stdout: '',
      stderr: error.message || 'SCP hiba',
      exitCode: error.code || 1,
    };
  }
}

/**
 * SSH kapcsolat tesztelése
 */
export async function testSSHConnection(config: SSHConfig): Promise<boolean> {
  const result = await executeSSHCommand(config, 'echo "SSH connection successful"');
  return result.exitCode === 0 && result.stdout.includes('SSH connection successful');
}

