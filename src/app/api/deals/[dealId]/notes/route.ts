import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { fetchNotesForDeal, createNote } from '@/lib/zoho';



export async function GET(req: Request, { params }: { params: { dealId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const notes = await fetchNotesForDeal(params.dealId);
    return NextResponse.json(notes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { dealId: string } }) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { content, initials } = await req.json();
    if (!content) return NextResponse.json({ error: 'Missing content' }, { status: 400 });

    const noteTitle = initials ? `Note from ${initials}` : 'Note';

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
