import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchLeads, createLead } from '@/lib/zoho';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const leads = await fetchLeads();
    return NextResponse.json(leads);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { userId, orgRole } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (orgRole !== 'org:admin') return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });

  try {
    const data = await req.json();
    const result = await createLead(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
