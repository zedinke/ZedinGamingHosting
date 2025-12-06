#!/usr/bin/env node

/**
 * Register GameServer-1 in database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function registerGameServer() {
  try {
    console.log('Registering GameServer-1...');
    
    const machine = await prisma.serverMachine.create({
      data: {
        name: 'GameServer-1',
        ipAddress: '95.217.194.148',
        sshPort: 22,
        sshUser: 'root',
        status: 'ONLINE',
      },
    });

    console.log('✅ GameServer-1 successfully registered!');
    console.log('Machine ID:', machine.id);
    console.log('IP Address:', machine.ipAddress);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error registering GameServer-1:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

registerGameServer();
