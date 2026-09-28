import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDealAttachments, getAccessToken } from '@/lib/zoho';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: { dealId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await getDealAttachments(params.dealId);
    return NextResponse.json(res);
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

    // Log what we received
    console.log('[ATTACH] file.name:', file.name, 'file.size:', file.size, 'file.type:', file.type);

    const token = await getAccessToken();
    const domain = 'https://www.zohoapis.com';

    // Build a fresh FormData manually using raw buffer → Blob
    const buffer = Buffer.from(await file.arrayBuffer());
    const blob = new Blob([buffer], { type: file.type || 'application/octet-stream' });

    const uploadForm = new FormData();
    uploadForm.append('file', blob, file.name);

    const zohoRes = await fetch(`${domain}/crm/v6/Deals/${params.dealId}/Attachments`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        // Do NOT set Content-Type — fetch sets it with the multipart boundary automatically
      },
      body: uploadForm,
    });

    const responseText = await zohoRes.text();
    console.log('[ATTACH] Zoho status:', zohoRes.status, 'body:', responseText);

    if (!zohoRes.ok) {
      return NextResponse.json({ error: `Zoho rejected upload: ${responseText}` }, { status: zohoRes.status });
    }

    let parsed: any;
    try { parsed = JSON.parse(responseText); } catch { parsed = { raw: responseText }; }

    // Zoho returns 200 but hides errors inside the payload
    if (parsed?.data?.[0]?.status === 'error') {
      return NextResponse.json({ error: parsed.data[0].message || 'Zoho upload failed' }, { status: 400 });
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('[ATTACH] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
