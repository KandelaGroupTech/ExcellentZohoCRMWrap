import os
import re

utils_import = "import { formatPhoneNumber } from '@/lib/utils';\n"

def add_import(text):
    if 'formatPhoneNumber' in text:
        return text
    if "import { parseLastConnection } from '@/lib/utils';" in text:
        return text.replace("import { parseLastConnection } from '@/lib/utils';", "import { parseLastConnection, formatPhoneNumber } from '@/lib/utils';")
    elif 'import { formatPhoneNumber' not in text:
        if "'use client';" in text:
            return text.replace("'use client';", "'use client';\n" + utils_import)
        elif '"use client";' in text:
            return text.replace('"use client";', '"use client";\n' + utils_import)
        else:
            return utils_import + text
    return text

files = [
    r'src/app/(dashboard)/dashboard/contacts/page.tsx',
    r'src/app/(dashboard)/dashboard/leads/page.tsx',
    r'src/app/(dashboard)/dashboard/accounts/page.tsx',
    r'src/app/(dashboard)/dashboard/contacts/components/ContactSidePanel.tsx',
    r'src/app/(dashboard)/dashboard/leads/components/LeadSidePanel.tsx',
    r'src/app/(dashboard)/dashboard/accounts/components/AccountSlideOver.tsx',
    r'src/app/(dashboard)/dashboard/vendors/page.tsx'
]

for file in files:
    if not os.path.exists(file):
        print(f"Not found: {file}")
        continue
    
    with open(file, 'r', encoding='utf-8') as f:
        text = f.read()
    
    text = add_import(text)
    
    # 1. Replace table column definitions
    text = re.sub(r'\{\s*key:\s*\'Phone\',\s*label:\s*\'Phone\'\s*\}', r"{ key: 'Phone', label: 'Phone', render: (row: any) => formatPhoneNumber(row.Phone) }", text)
    
    # 2. Replace side panel and vendor rendering
    text = re.sub(r'\{contact\.Phone\}', r'{formatPhoneNumber(contact.Phone)}', text)
    text = re.sub(r'\{lead\.Phone\}', r'{formatPhoneNumber(lead.Phone)}', text)
    text = re.sub(r'\{vendor\.Phone\}', r'{formatPhoneNumber(vendor.Phone)}', text)
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f'Processed {file}')
