import os
import re

files = [
    'src/app/api/leads/route.ts',
    'src/app/api/contacts/route.ts',
    'src/app/api/deals/[dealId]/tasks/route.ts',
    'src/app/api/calls/route.ts',
    'src/app/api/tasks/[taskId]/route.ts'
]

replacement = '''  let isAdmin = orgRole === 'org:admin';
  if (!isAdmin && userId) {
    try {
      const client = await clerkClient();
      const memberships = await client.users.getOrganizationMembershipList({ userId });
      isAdmin = memberships.data.some((m: any) => m.role === 'org:admin');
    } catch (e) {}
  }
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden: Admins only. Please select an Organization in the sidebar.' }, { status: 403 });'''

for file_path in files:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        content = re.sub(r'  if \(orgRole !== \'org:admin\'\) return NextResponse\.json\(\{ error: [^\}]+\}, \{ status: 403 \}\);', replacement, content)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
