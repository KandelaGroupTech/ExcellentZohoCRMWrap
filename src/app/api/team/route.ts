import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const { orgId } = auth();
  if (!orgId) {
    return NextResponse.json({ error: 'No organization' }, { status: 400 });
  }
  
  try {
    const client = await clerkClient();
    const memberships = await client.organizations.getOrganizationMembershipList({ organizationId: orgId });
    const users = memberships.data.map((m: any) => ({
      id: m.publicUserData.userId,
      firstName: m.publicUserData.firstName,
      lastName: m.publicUserData.lastName,
      initials: ((m.publicUserData.firstName?.charAt(0) || '') + (m.publicUserData.lastName?.charAt(0) || '')).toUpperCase()
    }));
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}