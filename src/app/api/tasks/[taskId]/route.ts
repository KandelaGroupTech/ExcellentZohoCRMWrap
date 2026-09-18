import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { updateTaskStatus } from '@/lib/zoho';

export async function PUT(req: Request, { params }: { params: { taskId: string } }) {
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
    const { status } = await req.json();
    if (!status) return NextResponse.json({ error: 'Missing status' }, { status: 400 });

    const result = await updateTaskStatus(params.taskId, status);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
