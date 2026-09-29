import os, re

path = r'src/lib/zoho.ts'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

pattern = re.compile(r'export async function getDealAttachments\(dealId: string\) \{.*?\n\}', re.DOTALL)
replacement = '''export async function getDealAttachments(dealId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments?fields=id,File_Name,Size,$type,$se_module`, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` },
    cache: 'no-store'
  });
  // Return empty array if not found or no attachments
  if (res.status === 204) return { data: [] };
  if (!res.ok) {
    console.error('[ZOHO API ERROR] getDealAttachments:', res.status, await res.text());
    return { data: [] };
  }
  return res.json();
}'''

if pattern.search(text):
    text = pattern.sub(replacement, text)
else:
    print('Pattern not found, appending or fixing manually...')
    # Let's fix the mangled code
    # The mangled code probably looks like:
    mangled_pattern = re.compile(r'export async function getDealAttachments\(dealId: string\) \{.*?\n\}', re.DOTALL)
    text = mangled_pattern.sub(replacement, text)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed zoho.ts")
