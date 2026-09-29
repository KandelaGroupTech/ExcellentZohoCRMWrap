import { NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/zoho';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const entityId = searchParams.get('entityId');
  const entityType = searchParams.get('entityType'); // 'Accounts', 'Contacts', 'Leads', 'Deals'

  if (!entityId || !entityType) {
    return NextResponse.json({ error: 'Missing entityId or entityType' }, { status: 400 });
  }

  try {
    const token = await getAccessToken();
    const domain = 'https://www.zohoapis.com';

    // 1. Fetch Calls
    const criteriaKey = (entityType === 'Accounts' || entityType === 'Deals') ? 'What_Id' : 'Who_Id';
    const callsUrl = `${domain}/crm/v6/Calls/search?criteria=(${criteriaKey}:equals:${entityId})&fields=Subject,Call_Start_Time,Call_Result,Outgoing_Call_Status,Description,Created_Time`;
    
    // 2. Fetch Notes
    const notesUrl = `${domain}/crm/v6/${entityType}/${entityId}/Notes?fields=Note_Title,Note_Content,Created_Time,Owner`;

    const [callsRes, notesRes] = await Promise.all([
      fetch(callsUrl, { headers: { 'Authorization': `Zoho-oauthtoken ${token}` }, cache: 'no-store' }),
      fetch(notesUrl, { headers: { 'Authorization': `Zoho-oauthtoken ${token}` }, cache: 'no-store' })
    ]);

    let calls: any[] = [];
    if (callsRes.status === 200) {
      const callsData = await callsRes.json();
      calls = callsData.data || [];
    }

    let notes: any[] = [];
    if (notesRes.status === 200) {
      const notesData = await notesRes.json();
      notes = notesData.data || [];
    }

    // Merge and format
    const activities = [
      ...calls.map(c => ({
        id: c.id,
        type: 'call',
        title: c.Subject || 'Call',
        result: c.Call_Result,
        status: c.Outgoing_Call_Status,
        description: c.Description,
        date: c.Call_Start_Time || c.Created_Time,
        createdTime: c.Created_Time
      })),
      ...notes.map(n => ({
        id: n.id,
        type: 'note',
        title: n.Note_Title || 'Note',
        description: n.Note_Content,
        date: n.Created_Time,
        createdTime: n.Created_Time,
        owner: n.Owner?.name
      }))
    ];

    // Sort descending by date
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error("Failed to fetch activities:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
