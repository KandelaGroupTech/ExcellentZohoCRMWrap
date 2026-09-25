import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { updateAccount } from '@/lib/zoho';

export async function PUT(req: Request, { params }: { params: { vendorId: string } }) {
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
    const data = await req.json();
    // Allow updating Trade (Industry), Notes (Description), Phone, Email, and new custom fields
    const allowed: any = {};
    if (data.Industry !== undefined) allowed.Industry = data.Industry;
    if (data.Description !== undefined) allowed.Description = data.Description;
    if (data.Phone !== undefined) allowed.Phone = data.Phone;
    if (data.Email !== undefined) allowed.Email = data.Email;
    if (data.Vendor_Status !== undefined) allowed.Vendor_Status = data.Vendor_Status;
    if (data.POC_Name !== undefined) allowed.POC_Name = data.POC_Name;
    if (data.POC_Phone !== undefined) allowed.POC_Phone = data.POC_Phone;
    const result = await updateAccount(params.vendorId, allowed);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
