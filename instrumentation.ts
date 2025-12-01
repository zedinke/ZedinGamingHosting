export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Importáljuk a cron executor inicializációt
    // Ez automatikusan elindítja a cron executor-t production módban
    await import('./lib/cron-executor-init');
  }
}

