import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, orgId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const client = await clerkClient();
    
    let targetOrgId = orgId;
    if (!targetOrgId) {
      // If no active org selected in context, fetch user's first org membership
      const userOrgs = await client.users.getOrganizationMembershipList({ userId });
      if (userOrgs.data?.length > 0) {
        targetOrgId = userOrgs.data[0].organization.id;
      }
    }

    if (targetOrgId) {
      const memberships = await client.organizations.getOrganizationMembershipList({ organizationId: targetOrgId });
      const users = memberships.data.map((m: any) => {
        const fn = m.publicUserData?.firstName || '';
        const ln = m.publicUserData?.lastName || '';
        const initials = ((fn.charAt(0) || '') + (ln.charAt(0) || '')).toUpperCase() || (m.publicUserData?.identifier?.slice(0, 2).toUpperCase() || 'U');
        return {
          id: m.publicUserData?.userId,
          firstName: fn,
          lastName: ln,
          name: `${fn} ${ln}`.trim() || m.publicUserData?.identifier || 'Team Member',
          initials
        };
      });
      return NextResponse.json(users);
    }

    // Fallback: list users in the Clerk app if no organization exists
    const allUsers = await client.users.getUserList({ limit: 50 });
    const users = allUsers.data.map((u: any) => {
      const fn = u.firstName || '';
      const ln = u.lastName || '';
      const initials = ((fn.charAt(0) || '') + (ln.charAt(0) || '')).toUpperCase() || (u.emailAddresses?.[0]?.emailAddress?.slice(0, 2).toUpperCase() || 'U');
      return {
        id: u.id,
        firstName: fn,
        lastName: ln,
        name: `${fn} ${ln}`.trim() || u.emailAddresses?.[0]?.emailAddress || 'Team Member',
        initials
      };
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}