import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchDeals, updateDealStage } from '@/lib/zoho';

export async function GET() {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const deals = await fetchDeals();
    return NextResponse.json(deals);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  const authData = auth();
  const { userId, orgRole } = authData;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (orgRole !== 'org:admin') return NextResponse.json({ error: `Forbidden: Admins only. Debug: ${JSON.stringify(authData)}` }, { status: 403 });

  try {
    const { dealId, stage } = await req.json();
    if (!dealId || !stage) {
      return NextResponse.json({ error: 'Missing dealId or stage' }, { status: 400 });
    }

    const result = await updateDealStage(dealId, stage);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
