import os

# Fix DealDetailModal.tsx
file_path = 'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const initials = user ? ${user.firstName?.charAt(0) || ''}.toUpperCase() : '';", "const initials = user ? `${user.firstName?.charAt(0) || ''}${user.lastName?.charAt(0) || ''}`.toUpperCase() : '';")
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Fix route.ts
file_path2 = 'src/app/api/deals/[dealId]/notes/route.ts'
with open(file_path2, 'r', encoding='utf-8') as f:
    content2 = f.read()

content2 = content2.replace("const noteTitle = initials ? Note from  : 'Note';", "const noteTitle = initials ? `Note from ${initials}` : 'Note';")
with open(file_path2, 'w', encoding='utf-8') as f:
    f.write(content2)

# Fix zoho.ts
file_path3 = 'src/lib/zoho.ts'
with open(file_path3, 'r', encoding='utf-8') as f:
    content3 = f.read()

content3 = content3.replace("const response = await fetch(${domain}/crm/v6/Deals//Notes, {", "const response = await fetch(`${domain}/crm/v6/Deals/${dealId}/Notes`, {")
content3 = content3.replace("headers: { 'Authorization': Zoho-oauthtoken  },", "headers: { 'Authorization': `Zoho-oauthtoken ${token}` },")
with open(file_path3, 'w', encoding='utf-8') as f:
    f.write(content3)

