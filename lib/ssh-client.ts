import { exec } from 'child_process';
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
  command: string
): Promise<SSHCommandResult> {
  try {
    let sshCommand: string;

    if (config.keyPath) {
      // SSH kulcs használata
      sshCommand = `ssh -i ${config.keyPath} -p ${config.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${config.user}@${config.host} "${command}"`;
    } else if (config.password) {
      // Jelszó használata (sshpass szükséges)
      sshCommand = `sshpass -p '${config.password}' ssh -p ${config.port} -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null ${config.user}@${config.host} "${command}"`;
    } else {
      throw new Error('SSH kulcs vagy jelszó szükséges');
    }

    const { stdout, stderr } = await execAsync(sshCommand, {
      timeout: 30000, // 30 másodperc timeout
    });

    return {
      stdout,
      stderr,
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      stdout: '',
      stderr: error.message || 'SSH hiba',
      exitCode: error.code || 1,
    };
  }
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

