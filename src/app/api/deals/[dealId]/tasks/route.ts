import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchTasksForDeal, createTask } from '@/lib/zoho';

export async function GET(req: Request, { params }: { params: { dealId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tasks = await fetchTasksForDeal(params.dealId);
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { dealId: string } }) {
  const { userId, orgRole } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let isAdmin = orgRole === 'org:admin';
  if (!isAdmin && userId) {
    try {
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({ userId });
      isAdmin = memberships.data.some((m: any) => m.role === 'org:admin');
    } catch (e) {}
  }
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admins only. Please select an Organization in the sidebar.' }, { status: 403 });

  try {
    const data = await req.json();
    const result = await createTask({ ...data, What_Id: params.dealId });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
