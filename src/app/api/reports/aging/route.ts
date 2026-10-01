import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { buildAgingReport } from '@/lib/reportDeals';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const report = await buildAgingReport();
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Aging report failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to build the aging report' },
      { status: 500 }
    );
  }
}
