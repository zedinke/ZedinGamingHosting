import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RustProvisionParams {
  serverId: string;
  serverName: string;
  maxPlayers?: number;
  seed?: number;
  worldSize?: number;
  ports?: {
    game?: number;
    query?: number;
    rcon?: number;
  };
  rconPassword?: string;
}

export interface RustProvisionResult {
  containerId: string;
  containerName: string;
  image: string;
  dataPath: string;
  configPath: string;
  gamePort: number;
  queryPort: number;
  rconPort: number;
}

const DEFAULT_IMAGE = process.env.RUST_SERVER_IMAGE || 'rust:latest';
const SERVER_ROOT = process.env.GAME_SERVER_ROOT || '/opt/servers';

async function runCommand(command: string): Promise<string> {
  const { stdout, stderr } = await execAsync(command, { env: process.env });
  if (stderr && stderr.trim()) {
    console.warn(stderr.trim());
  }
  return stdout.trim();
}

async function ensureImage(imageTag: string, dockerfileDir: string): Promise<void> {
  try {
    await execAsync(`docker image inspect ${imageTag}`);
    return;
  } catch (error) {
    // Image hiányzik, buildeljük le
  }

  await execAsync(`docker build -t ${imageTag} ${dockerfileDir}`);
}

function resolveServerPath(serverId: string): string {
  const resolved = path.resolve(SERVER_ROOT, serverId);
  return resolved.replace(/\\/g, '/');
}

export async function provisionRustServer(
  params: RustProvisionParams
): Promise<RustProvisionResult> {
  const gamePort = params.ports?.game ?? 28015;
  const queryPort = params.ports?.query ?? 28016;
  const rconPort = params.ports?.rcon ?? 28017;
  const image = DEFAULT_IMAGE;
  const containerName = `rust-${params.serverId}`;
  const dockerfileDir = path.resolve(process.cwd(), 'lib', 'game-templates', 'docker', 'rust');

  // 1) Könyvtár + config
  const serverDir = resolveServerPath(params.serverId);
  await fs.mkdir(serverDir, { recursive: true });

  const config = {
    serverName: params.serverName,
    maxPlayers: params.maxPlayers ?? 100,
    seed: params.seed ?? 12345,
    worldSize: params.worldSize ?? 3500,
    rconPassword: params.rconPassword ?? 'change_me',
    ports: {
      game: gamePort,
      query: queryPort,
      rcon: rconPort,
    },
  };

  const configPath = path.join(serverDir, 'config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

  // 2) Image ellenőrzés/build
  await ensureImage(image, dockerfileDir);

  // 3) Létező container leállítása/törlése (ha van)
  try {
    await execAsync(`docker rm -f ${containerName}`);
  } catch (error) {
    // Ha nem létezik, nem baj
  }

  // 4) Container indítás
  const runCmd = [
    'docker run -d',
    `--name ${containerName}`,
    '--restart unless-stopped',
    `-v ${serverDir}:/rust`,
    `-p ${gamePort}:28015/udp`,
    `-p ${queryPort}:28016/udp`,
    `-p ${rconPort}:28017/tcp`,
    image,
  ].join(' ');

  const containerId = await runCommand(runCmd);

  return {
    containerId,
    containerName,
    image,
    dataPath: serverDir,
    configPath,
    gamePort,
    queryPort,
    rconPort,
  };
}
