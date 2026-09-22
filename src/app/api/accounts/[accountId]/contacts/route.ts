import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request, { params }: { params: { accountId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { fetchContactsForAccount } = await import('@/lib/zoho');
    // Important: we have to decode the URI component in case the accountId has spaces/special chars
    const accountName = decodeURIComponent(params.accountId);
    const contacts = await fetchContactsForAccount(accountName);
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
