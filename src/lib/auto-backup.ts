// Auto-backup scheduler for SQLite database
// Runs every 6 hours to create a backup of custom.db
// Keeps last 20 backups automatically

import { copyFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'db', 'custom.db');
const BACKUP_DIR = join(process.cwd(), 'db', 'backups');
const MAX_BACKUPS = 20;
const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function cleanupOldBackups(): number {
  if (!existsSync(BACKUP_DIR)) return 0;
  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_auto_') && f.endsWith('.db'))
    .map(f => ({ name: f, mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  let deleted = 0;
  for (let i = MAX_BACKUPS; i < files.length; i++) {
    try { unlinkSync(join(BACKUP_DIR, files[i].name)); deleted++; } catch { /* ignore */ }
  }
  return deleted;
}

function performBackup() {
  try {
    if (!existsSync(DB_PATH)) {
      console.log('[AutoBackup] DB file not found, skipping');
      return;
    }
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const filename = `backup_auto_${getTimestamp()}.db`;
    const backupPath = join(BACKUP_DIR, filename);

    copyFileSync(DB_PATH, backupPath);

    const deletedCount = cleanupOldBackups();
    const stat = statSync(backupPath);
    console.log(
      `[AutoBackup] Created ${filename} (${(stat.size / 1024).toFixed(1)} KB), cleaned ${deletedCount} old`
    );
  } catch (error) {
    console.error('[AutoBackup] Failed:', error);
  }
}

// Run immediately on module load (server startup), then every 6 hours
if (typeof window === 'undefined') {
  // Delay first backup by 30 seconds to avoid startup contention
  setTimeout(() => {
    performBackup();
    setInterval(performBackup, INTERVAL_MS);
  }, 30_000);
}