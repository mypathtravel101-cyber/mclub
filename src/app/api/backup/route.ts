import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/auth-helpers';
import { copyFileSync, mkdirSync, existsSync, readdirSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

const DB_PATH = join(process.cwd(), 'db', 'custom.db');
const BACKUP_DIR = join(process.cwd(), 'db', 'backups');
const MAX_BACKUPS = 20;

function getTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').replace('T', '_').slice(0, 19);
}

function cleanupOldBackups(): number {
  if (!existsSync(BACKUP_DIR)) return 0;

  const files = readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
    .map(f => ({ name: f, mtime: statSync(join(BACKUP_DIR, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  let deleted = 0;
  for (let i = MAX_BACKUPS; i < files.length; i++) {
    try {
      unlinkSync(join(BACKUP_DIR, files[i].name));
      deleted++;
    } catch { /* ignore */ }
  }
  return deleted;
}

// GET /api/backup — list backups (admin only)
export async function GET(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    if (!existsSync(BACKUP_DIR)) {
      return NextResponse.json({ backups: [], totalSize: 0 });
    }

    const files = readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .map(f => {
        const stat = statSync(join(BACKUP_DIR, f));
        return {
          filename: f,
          size: stat.size,
          createdAt: stat.mtime.toISOString(),
          sizeLabel: stat.size > 1024 * 1024
            ? `${(stat.size / 1024 / 1024).toFixed(1)} MB`
            : `${(stat.size / 1024).toFixed(1)} KB`,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    return NextResponse.json({
      backups: files,
      totalSize,
      totalSizeLabel: totalSize > 1024 * 1024
        ? `${(totalSize / 1024 / 1024).toFixed(1)} MB`
        : `${(totalSize / 1024).toFixed(1)} KB`,
    });
  } catch {
    return NextResponse.json({ error: '讀取備份列表失敗' }, { status: 500 });
  }
}

// POST /api/backup — manual backup (admin only)
export async function POST(request: Request) {
  try {
    const auth = requireAuth(request);
    if (auth instanceof NextResponse) return auth;
    const roleCheck = requireRole(auth, 'admin');
    if (roleCheck instanceof NextResponse) return roleCheck;

    if (!existsSync(DB_PATH)) {
      return NextResponse.json({ error: '數據庫文件不存在' }, { status: 404 });
    }

    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const filename = `backup_${getTimestamp()}.db`;
    const backupPath = join(BACKUP_DIR, filename);

    copyFileSync(DB_PATH, backupPath);

    const deletedCount = cleanupOldBackups();

    const stat = statSync(backupPath);
    console.log(`[Backup] Created ${filename} (${(stat.size / 1024).toFixed(1)} KB), cleaned ${deletedCount} old`);

    return NextResponse.json({
      success: true,
      message: '備份成功',
      filename,
      size: stat.size,
      sizeLabel: stat.size > 1024 * 1024
        ? `${(stat.size / 1024 / 1024).toFixed(1)} MB`
        : `${(stat.size / 1024).toFixed(1)} KB`,
      deletedOldBackups: deletedCount,
    });
  } catch (error) {
    console.error('[Backup] Failed:', error);
    return NextResponse.json({ error: '備份失敗' }, { status: 500 });
  }
}