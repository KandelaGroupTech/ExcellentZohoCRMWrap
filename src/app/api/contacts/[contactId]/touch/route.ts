import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { updateContact, createNote } from '@/lib/zoho';

export async function POST(req: Request, { params }: { params: { contactId: string } }) {
  const authData = auth();
  const { userId, orgRole } = authData;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let isAdmin = orgRole === 'org:admin';
  if (!isAdmin && userId) {
    try {
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({ userId });
      isAdmin = memberships.data.some((m: any) => m.role === 'org:admin');
    } catch (e) {}
  }

  if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admins only.' }, { status: 403 });

  try {
    const { type = 'Email', notes = '', initials = '' } = await req.json();
    const dateStr = new Date().toISOString().split('T')[0];
    const skypeVal = `${type} | ${dateStr}`;

    // 1. Update contact Skype_ID for last touch tracking
    await updateContact(params.contactId, { Skype_ID: skypeVal });

    // 2. Create Note attached to contact if notes exist
    if (notes && notes.trim() !== '') {
      try {
        await createNote({
          Parent_Id: params.contactId,
          se_module: 'Contacts',
          Note_Title: `${type} from ${initials || 'User'}`,
          Note_Content: notes.trim()
        });
      } catch (noteErr) {
        console.error('Failed to create note for contact touch:', noteErr);
      }
    }

    return NextResponse.json({ success: true, skypeVal });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
