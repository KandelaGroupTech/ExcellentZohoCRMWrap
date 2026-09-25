import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { updateAccount } from '@/lib/zoho';

export async function PUT(req: Request, { params }: { params: { vendorId: string } }) {
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
    // Only allow updating Industry (Trade) and Description (Notes)
    const allowed: any = {};
    if (data.Industry !== undefined) allowed.Industry = data.Industry;
    if (data.Description !== undefined) allowed.Description = data.Description;
    const result = await updateAccount(params.vendorId, allowed);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
