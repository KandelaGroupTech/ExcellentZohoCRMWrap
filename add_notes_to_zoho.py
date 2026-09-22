import os

with open('src/lib/zoho.ts', 'r', encoding='utf-8') as f:
    content = f.read()

new_functions = '''
export async function fetchNotesForDeal(dealId: string) {
  const token = await getAccessToken();
  const domain = 'https://www.zohoapis.com';
  
  const response = await fetch(${domain}/crm/v6/Deals//Notes, {
    method: 'GET',
    headers: { 'Authorization': Zoho-oauthtoken  },
    cache: 'no-store'
  });

  if (response.status === 204) return [];
  if (!response.ok) throw new Error('Failed to fetch notes for deal');
  const data = await response.json();
  return data.data || [];
}

export async function createNote(data: { Parent_Id: string, Note_Content: string, Note_Title: string }) {
  return createRecord('Notes', { 
    Note_Title: data.Note_Title, 
    Note_Content: data.Note_Content,
    Parent_Id: data.Parent_Id,
    se_module: 'Deals'
  });
}
'''

content = content + new_functions

with open('src/lib/zoho.ts', 'w', encoding='utf-8') as f:
    f.write(content)
