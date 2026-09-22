import os

files = [
    'src/app/(dashboard)/dashboard/leads/page.tsx',
    'src/app/(dashboard)/dashboard/contacts/page.tsx'
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    content = content.replace('fetch(/website-demos/excellentzohocrm/api/leads/ + leadId', "fetch('/website-demos/excellentzohocrm/api/leads/' + leadId")
    content = content.replace('fetch(/website-demos/excellentzohocrm/api/contacts/ + contactId', "fetch('/website-demos/excellentzohocrm/api/contacts/' + contactId")
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
