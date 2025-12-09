import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env') });

import { generateSSHKey, copyPublicKeyToServer, testSSHKeyConnection } from '@/lib/ssh-key-manager';
import { prisma } from '@/lib/prisma';

async function setupGameServer1SSH() {
  try {
    console.log('=== GameServer-1 SSH Kulcs Beállítás ===\n');

    // 1. GameServer-1 gép keresése vagy létrehozása az adatbázisban
    let machine = await prisma.serverMachine.findFirst({
      where: {
        ipAddress: '95.217.194.148',
      },
    });

    if (!machine) {
      console.log('GameServer-1 gép létrehozása az adatbázisban...');
      machine = await prisma.serverMachine.create({
        data: {
          name: 'GameServer-1',
          ipAddress: '95.217.194.148',
          sshPort: 22,
          sshUser: 'root',
          status: 'ONLINE',
        },
      });
      console.log('✅ GameServer-1 gép létrehozva az adatbázisban\n');
    } else {
      console.log('✅ GameServer-1 gép megtalálva az adatbázisban\n');
    }

    // 2. SSH kulcs generálása
    console.log('SSH kulcs generálása...');
    const keyResult = await generateSSHKey(machine.id, machine.ipAddress);

    if (!keyResult.success || !keyResult.publicKey || !keyResult.keyPath) {
      throw new Error(`SSH kulcs generálás sikertelen: ${keyResult.error}`);
    }

    console.log('✅ SSH kulcspár generálva\n');

    // 3. Publikus kulcs másolása a GameServer-1-re
    console.log('Publikus kulcs másolása GameServer-1-re...');
    const copyResult = await copyPublicKeyToServer(
      keyResult.publicKey,
      machine.ipAddress,
      machine.sshPort,
      machine.sshUser,
      ':2hJsXmJVTTx3Aw' // GameServer-1 root jelszó
    );

    if (!copyResult.success) {
      throw new Error(`Publikus kulcs másolás sikertelen: ${copyResult.error}`);
    }

    console.log('✅ Publikus kulcs másolva\n');

    // 4. SSH kulcs elérési út frissítése az adatbázisban
    await prisma.serverMachine.update({
      where: { id: machine.id },
      data: {
        sshKeyPath: keyResult.keyPath,
      },
    });

    console.log('✅ Adatbázis frissítve\n');

    // 5. SSH kulcs beállítás ellenőrzése
    console.log('SSH kulcs beállítás ellenőrzése...');
    const testResult = await testSSHKeyConnection(
      keyResult.keyPath,
      machine.ipAddress,
      machine.sshPort,
      machine.sshUser
    );

    if (testResult) {
      console.log('✅ SSH kulcs beállítás ellenőrzés sikeres!\n');
    } else {
      console.warn('⚠️  SSH kulcs beállítás ellenőrzés sikertelen\n');
    }

    console.log('=== GameServer-1 SSH Kulcs Beállítás Kész ===');
  } catch (error: any) {
    console.error('❌ Hiba:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupGameServer1SSH();

