import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = `data:${file.type};base64,${buffer.toString('base64')}`;

    const folder = formData.get('folder') as string || 'rooms';
    const uploadResult = await uploadImage(base64Data, folder);

    return NextResponse.json({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
    });
  } catch (err) {
    console.error('[Admin Upload API] Error:', err);
    return NextResponse.json({ error: 'Image upload failed' }, { status: 500 });
  }
}
