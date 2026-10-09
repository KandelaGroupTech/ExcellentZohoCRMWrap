import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchDeals, updateDealStage, updateDeal } from '@/lib/zoho';

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

  let isAdmin = orgRole === 'org:admin';

  if (!isAdmin) {
    try {
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({ userId });
      isAdmin = memberships.data.some((m: any) => m.role === 'org:admin');
    } catch (e) {
      console.error('Failed to fetch memberships:', e);
    }
  }

  if (!isAdmin) return NextResponse.json({ error: \Forbidden: Admins only.\ }, { status: 403 });

  try {
    const body = await req.json();
    const { dealId, stage, description } = body;
    if (!dealId) {
      return NextResponse.json({ error: 'Missing dealId' }, { status: 400 });
    }

    if (description !== undefined) {
      const result = await updateDeal(dealId, { Description: description });
      return NextResponse.json(result);
    } else if (stage) {
      const result = await updateDealStage(dealId, stage);
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authData = auth();
  const { userId, orgRole } = authData;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let isAdmin = orgRole === 'org:admin';

  if (!isAdmin) {
    try {
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({ userId });
      isAdmin = memberships.data.some((m: any) => m.role === 'org:admin');
    } catch (e) {}
  }

  if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admins only.' }, { status: 403 });

  try {
    const data = await req.json();
    const { createDeal } = await import('@/lib/zoho');
    const result = await createDeal(data);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
