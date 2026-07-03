import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

// Same path resolution as upload route
function getUploadDir(): string {
  const envDir = process.env.UPLOAD_DIR;
  if (envDir) return path.join(envDir, 'events');
  const cwd = process.cwd();
  const projectRoot = cwd.endsWith('.next/standalone') || cwd.endsWith('.next\\standalone')
    ? path.resolve(cwd, '..', '..')
    : cwd;
  return path.join(projectRoot, 'uploads', 'events');
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Security: only allow image extensions, prevent path traversal
    const ext = path.extname(filename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json({ error: '不支援的檔案類型' }, { status: 400 });
    }

    const safeName = path.basename(filename);
    const filepath = path.join(getUploadDir(), safeName);

    // Verify file exists
    const fileStat = await stat(filepath).catch(() => null);
    if (!fileStat) {
      return NextResponse.json({ error: '檔案不存在' }, { status: 404 });
    }

    const buffer = await readFile(filepath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: '讀取失敗' }, { status: 500 });
  }
}
