import os

os.makedirs('src/app/api/leads/[leadId]', exist_ok=True)
os.makedirs('src/app/api/contacts/[contactId]', exist_ok=True)

lead_route = '''import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { deleteLead } from '@/lib/zoho';

export async function DELETE(req: Request, { params }: { params: { leadId: string } }) {
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
    const result = await deleteLead(params.leadId);
    return NextResponse.json({ success: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
'''

contact_route = lead_route.replace('deleteLead', 'deleteContact').replace('leadId', 'contactId')

with open('src/app/api/leads/[leadId]/route.ts', 'w', encoding='utf-8') as f:
    f.write(lead_route)
    
with open('src/app/api/contacts/[contactId]/route.ts', 'w', encoding='utf-8') as f:
    f.write(contact_route)
