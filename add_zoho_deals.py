import os

with open('src/lib/zoho.ts', 'r', encoding='utf-8') as f:
    content = f.read()
    
replacement = '''export async function deleteContact(id: string) {
  return deleteRecord('Contacts', id);
}

export async function createDeal(data: { Deal_Name: string, Account_Name?: string, Amount: number, Stage: string, Closing_Date: string }) {
  return createRecord('Deals', data);
}

export async function deleteDeal(id: string) {
  return deleteRecord('Deals', id);
}'''

content = content.replace(\"export async function deleteContact(id: string) {\\n  return deleteRecord('Contacts', id);\\n}\", replacement)

with open('src/lib/zoho.ts', 'w', encoding='utf-8') as f:
    f.write(content)
