import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDealAttachments, getAccessToken } from '@/lib/zoho';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { dealId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await getDealAttachments(params.dealId);
    console.log('[GET ATTACHMENTS]', JSON.stringify(res));
    return NextResponse.json(res, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { dealId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    console.log('[ATTACH] name:', file.name, 'size:', file.size, 'type:', file.type);

    const token = await getAccessToken();

    // Build a raw multipart/form-data body using Buffers.
    // This is the most reliable approach in Node.js — it ensures the
    // Content-Disposition header always has the correct filename parameter,
    // which the Web FormData API sometimes drops in server environments.
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const boundary = '----ZohoCRMBoundary' + Date.now().toString(16);
    const filename = file.name.replace(/[^\w.\-]/g, '_'); // sanitize
    const mimeType = file.type || 'application/octet-stream';

    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: ${mimeType}\r\n` +
      `\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);

    console.log('[ATTACH] multipart body size:', body.length, 'boundary:', boundary);

    const zohoRes = await fetch(`https://www.zohoapis.com/crm/v6/Deals/${params.dealId}/Attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      body: body as any,
    });

    const responseText = await zohoRes.text();
    console.log('[ATTACH] Zoho status:', zohoRes.status, 'response:', responseText);

    if (!zohoRes.ok) {
      return NextResponse.json(
        { error: `Zoho rejected upload (${zohoRes.status}): ${responseText}` },
        { status: zohoRes.status }
      );
    }

    let parsed: any;
    try { parsed = JSON.parse(responseText); } catch { parsed = { raw: responseText }; }

    // Zoho returns HTTP 200 even for failures — check the inner status
    if (parsed?.data?.[0]?.status === 'error') {
      const msg = parsed.data[0].message || 'Zoho upload failed';
      console.error('[ATTACH] Zoho inner error:', msg);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('[ATTACH] Caught error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
