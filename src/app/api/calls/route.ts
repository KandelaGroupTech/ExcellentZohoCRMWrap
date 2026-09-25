import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { createCall, createNote } from '@/lib/zoho';

export async function POST(req: Request) {
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
    
    // Extract custom properties used by the backend
    const entityType = data.Entity_Type;
    delete data.Entity_Type;

    const result = await createCall(data);

    // If there is a note/description, create a Note record attached to the call or entity
    if (data.Description && data.Description.trim() !== '') {
      try {
        let parentId = result.id;
        let seModule = 'Calls';
        
        if (entityType) {
          seModule = entityType;
          if (data.What_Id?.id) parentId = data.What_Id.id;
          else if (data.Who_Id?.id) parentId = data.Who_Id.id;
        }

        await createNote({
          Parent_Id: parentId,
          se_module: seModule,
          Note_Title: `Call Notes: ${data.Call_Result || 'Outbound'}`,
          Note_Content: data.Description.trim()
        });
      } catch (noteErr) {
        console.error("Failed to create note for call:", noteErr);
      }
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
