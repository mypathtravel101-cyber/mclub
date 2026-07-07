import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

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
    if (!ALLOWED_MIME.includes(file.type)) {
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

    // 5. Convert to base64 data URL (works on Vercel serverless - no filesystem needed)
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      filename: file.name,
      size: buffer.length,
      mimeType: file.type,
    });
  } catch (err) {
    console.error('[Upload] Error processing file:', err);
    return NextResponse.json(
      { error: '檔案處理失敗，請重試' },
      { status: 500 }
    );
  }
}