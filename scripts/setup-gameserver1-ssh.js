const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();
const host = '95.217.194.148';
const user = 'root';
const password = ':2hJsXmJVTTx3Aw';
const publicKeyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'gameserver1_key.pub');

async function setupSSHKey() {
  try {
    console.log('Csatlakozás a GameServer-1-hez...');
    await ssh.connect({
      host,
      username: user,
      password,
    });

    console.log('Publikus kulcs beolvasása...');
    const publicKey = fs.readFileSync(publicKeyPath, 'utf-8').trim();

    console.log('authorized_keys frissítése...');
    const result = await ssh.execCommand(
      `mkdir -p ~/.ssh && ` +
      `grep -q "${publicKey.split(' ')[1]}" ~/.ssh/authorized_keys 2>/dev/null || ` +
      `echo "${publicKey}" >> ~/.ssh/authorized_keys && ` +
      `chmod 600 ~/.ssh/authorized_keys && ` +
      `chmod 700 ~/.ssh && ` +
      `echo "SSH kulcs hozzáadva"`
    );

    if (result.code === 0) {
      console.log('✅ SSH kulcs sikeresen beállítva!');
    } else {
      console.error('Hiba:', result.stderr);
    }

    console.log('Tesztelés jelszó nélküli kapcsolattal...');
    ssh.dispose();

    // Újra csatlakozás kulccsal
    const privateKeyPath = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'gameserver1_key');
    const privateKey = fs.readFileSync(privateKeyPath, 'utf-8');

    await ssh.connect({
      host,
      username: user,
      privateKey,
    });

    const testResult = await ssh.execCommand('echo "SSH kulcs működik!"');
    if (testResult.code === 0) {
      console.log('✅ SSH kulcs teszt sikeres!');
      console.log('Kimenet:', testResult.stdout);
    }

    ssh.dispose();
  } catch (error) {
    console.error('❌ Hiba:', error.message);
    process.exit(1);
  }
}

setupSSHKey();

