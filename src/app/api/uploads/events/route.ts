import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/lib/auth-helpers';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Same path resolution logic as the GET route
function getUploadDir(): string {
  const envDir = process.env.UPLOAD_DIR;
  if (envDir) return path.join(envDir, 'events');
  const cwd = process.cwd();
  const projectRoot = cwd.endsWith('.next/standalone') || cwd.endsWith('.next\\standalone')
    ? path.resolve(cwd, '..', '..')
    : cwd;
  return path.join(projectRoot, 'uploads', 'events');
}

export async function POST(request: NextRequest) {
  // 1. Auth check
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    // 2. Parse multipart form
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: '未找到上傳檔案' },
        { status: 400 }
      );
    }

    // 3. Validate MIME type
    const ext = ALLOWED_MIME[file.type];
    if (!ext) {
      return NextResponse.json(
        { error: `不支援的檔案類型: ${file.type}。僅支援 JPEG/PNG/GIF/WebP。` },
        { status: 400 }
      );
    }

    // 4. Validate size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: '檔案過大，最大 5MB' },
        { status: 400 }
      );
    }

    // 5. Ensure upload dir exists
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    // 6. Generate unique filename (UUID + original extension)
    const filename = `${randomUUID()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    // 7. Write file
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // 8. Return the public URL (matches the GET route pattern)
    const url = `/api/uploads/events/${filename}`;

    return NextResponse.json({
      url,
      filename,
      size: buffer.length,
      mimeType: file.type,
    });
  } catch (err) {
    console.error('[Upload] Error saving file:', err);
    return NextResponse.json(
      { error: '檔案儲存失敗，請重試' },
      { status: 500 }
    );
  }
}
