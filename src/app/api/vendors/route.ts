import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { fetchVendors } from '@/lib/zoho';

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const vendors = await fetchVendors();
    return NextResponse.json(vendors);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
