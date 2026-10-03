import sys
with open('src/lib/zoho.ts', 'r', encoding='utf8') as f:
    text = f.read()

# Update fetchTasks
text = text.replace(
    'fields=Subject,Status,What_Id,Who_Id,SEMODULE_ID,SE_Module',
    'fields=Subject,Status,What_Id,Who_Id,SEMODULE_ID,SE_Module,Due_Date'
)

# Update createTask signature and payload
old_create = """export async function createTask(data: { Subject: string, What_Id: string }) {
  return createRecord('Tasks', { 
    Subject: data.Subject, 
    $se_module: 'Deals',
    What_Id: { id: data.What_Id }, // Enforce object format or { id: data.What_Id }. The API often accepts just the ID string for What_Id in POST.
    Status: 'Not Started'
  });
}"""

new_create = """export async function createTask(data: { Subject: string, What_Id: string, Due_Date?: string }) {
  const payload: any = { 
    Subject: data.Subject, 
    $se_module: 'Deals',
    What_Id: { id: data.What_Id },
    Status: 'Not Started'
  };
  if (data.Due_Date) {
    payload.Due_Date = data.Due_Date;
  }
  return createRecord('Tasks', payload);
}"""

if old_create in text:
    text = text.replace(old_create, new_create)
else:
    print("WARNING: Could not find exact match for createTask. Trying softer replace.")
    text = text.replace('export async function createTask(data: { Subject: string, What_Id: string }) {', 'export async function createTask(data: { Subject: string, What_Id: string, Due_Date?: string }) {')
    # Use regex or simple replace for payload if needed, but the exact match usually works if I copied it right.

with open('src/lib/zoho.ts', 'w', encoding='utf8') as f:
    f.write(text)
