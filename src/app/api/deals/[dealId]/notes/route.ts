import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchNotesForDeal, createNote } from '@/lib/zoho';

async function checkAdmin(userId: string | null, orgRole: string | null | undefined) {
  if (!userId) return false;
  let isAdmin = orgRole === 'org:admin';
  if (!isAdmin) {
    try {
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({ userId });
      isAdmin = memberships.data.some((m: any) => m.role === 'org:admin');
    } catch (e) {}
  }
  return isAdmin;
}

export async function GET(req: Request, { params }: { params: { dealId: string } }) {
  const { userId, orgRole } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const isAdmin = await checkAdmin(userId, orgRole);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });

  try {
    const notes = await fetchNotesForDeal(params.dealId);
    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { dealId: string } }) {
  const { userId, orgRole } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const isAdmin = await checkAdmin(userId, orgRole);
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });

  try {
    const { content, initials } = await req.json();
    if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

    const noteTitle = initials ? Note from  : 'Note';

    const result = await createNote({
      Parent_Id: params.dealId,
      Note_Content: content,
      Note_Title: noteTitle
    });
    
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
