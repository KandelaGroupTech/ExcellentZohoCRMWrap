import os
import re

with open(r'src/lib/zoho.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to replace the garbled code at the end of the file.
# The garbled code starts from "export async function uploadDealAttachment(dealId: string, formData: FormData) {"

start_index = text.find('export async function uploadDealAttachment(dealId: string, formData: FormData) {')
if start_index != -1:
    text = text[:start_index]

new_code = '''export async function uploadDealAttachment(dealId: string, formData: FormData) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments`, {
    method: 'POST',
    headers: {
      'Authorization': `Zoho-oauthtoken ${token}`
    },
    body: formData
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload attachment: ${text}`);
  }
  return res.json();
}

export async function getDealAttachments(dealId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments`, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
  });
  // Return empty array if not found or no attachments
  if (!res.ok) {
    return { data: [] };
  }
  return res.json();
}

export async function deleteDealAttachment(dealId: string, attachmentId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments/${attachmentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete attachment');
  return res.json();
}

export async function downloadDealAttachment(dealId: string, attachmentId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  const res = await fetch(`${domain}/crm/v6/Deals/${dealId}/Attachments/${attachmentId}`, {
    headers: { 'Authorization': `Zoho-oauthtoken ${token}` }
  });
  if (!res.ok) throw new Error('Failed to download attachment');
  return res;
}
'''

text += new_code

with open(r'src/lib/zoho.ts', 'w', encoding='utf-8') as f:
    f.write(text)
