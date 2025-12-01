import { checkForUpdates } from '../lib/update-checker';

async function main() {
  console.log('Frissítések ellenőrzése...\n');
  
  const updateInfo = await checkForUpdates();
  
  console.log('Jelenlegi verzió:', updateInfo.currentVersion);
  console.log('Legújabb verzió:', updateInfo.latestVersion);
  console.log('Frissítési csatorna:', updateInfo.updateChannel);
  console.log('License érvényes:', updateInfo.licenseValid);
  
  if (updateInfo.available) {
    console.log('\n✅ Új frissítés elérhető!');
    if (updateInfo.changelog) {
      console.log('\nVáltozások:');
      console.log(updateInfo.changelog);
    }
  } else {
    console.log('\n✅ A rendszer naprakész.');
  }
  
  if (!updateInfo.licenseValid) {
    console.log('\n⚠️  Figyelem: License érvénytelen vagy lejárt. Frissítések nem elérhetők.');
  }
}

main()
  .catch((e) => {
    console.error('HIBA:', e);
    process.exit(1);
  });

