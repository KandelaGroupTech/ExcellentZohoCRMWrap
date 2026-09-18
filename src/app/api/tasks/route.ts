import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchTasks } from '@/lib/zoho';

export async function GET() {
  const { userId, orgRole } = auth();
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
    const tasks = await fetchTasks();
    return NextResponse.json(tasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
