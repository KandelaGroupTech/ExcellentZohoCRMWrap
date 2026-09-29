import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { downloadDealAttachment, deleteDealAttachment } from '@/lib/zoho';

export async function GET(req: Request, { params }: { params: { dealId: string, attachmentId: string } }) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    const zohoRes = await downloadDealAttachment(params.dealId, params.attachmentId);
    
    const headers = new Headers(zohoRes.headers);
    headers.delete('content-encoding');
    
    // Zoho adds restrictive headers that prevent browsers from viewing files inline
    headers.delete('content-security-policy');
    headers.delete('x-content-type-options');
    headers.delete('x-frame-options');
    headers.delete('strict-transport-security');
    
    // Change 'attachment' to 'inline' so browser views the file instead of downloading it
    const cd = headers.get('content-disposition');
    if (cd) {
      headers.set('content-disposition', cd.replace('attachment', 'inline'));
    }
    
    return new Response(zohoRes.body, {
      status: zohoRes.status,
      headers
    });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { dealId: string, attachmentId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await deleteDealAttachment(params.dealId, params.attachmentId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
