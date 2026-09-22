import os

os.makedirs('src/app/api/deals/[dealId]', exist_ok=True)

deal_route = '''import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { deleteDeal } from '@/lib/zoho';

export async function DELETE(req: Request, { params }: { params: { dealId: string } }) {
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
    const result = await deleteDeal(params.dealId);
    return NextResponse.json({ success: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
'''

with open('src/app/api/deals/[dealId]/route.ts', 'w', encoding='utf-8') as f:
    f.write(deal_route)
