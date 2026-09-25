import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchAccounts, createAccount } from '@/lib/zoho';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const accounts = await fetchAccounts();
    return NextResponse.json(accounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const authData = auth();
  const { userId, orgRole } = authData;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  let isAdmin = orgRole === 'org:admin';

  // Fallback: if orgRole is null (which happens with some proxy setups), check Clerk API directly
  if (!isAdmin) {
    try {
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({ userId });
      isAdmin = memberships.data.some((m: any) => m.role === 'org:admin');
    } catch (e) {
      console.error('Failed to fetch memberships:', e);
    }
  }

  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const data = await req.json();
    const result = await createAccount(data);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
