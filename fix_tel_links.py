import os
import re

# 1. LeadSidePanel.tsx
path_lead = r'src/app/(dashboard)/dashboard/leads/components/LeadSidePanel.tsx'
with open(path_lead, 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('href={`tel:`}', 'href={`tel:${lead.Phone.replace(/\\D/g, \'\')}`}')
with open(path_lead, 'w', encoding='utf-8') as f:
    f.write(text)

# 2. ContactSidePanel.tsx
path_contact = r'src/app/(dashboard)/dashboard/contacts/components/ContactSidePanel.tsx'
with open(path_contact, 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('href={`tel:`}', 'href={`tel:${contact.Phone.replace(/\\D/g, \'\')}`}')
with open(path_contact, 'w', encoding='utf-8') as f:
    f.write(text)

# 3. Vendors/page.tsx
path_vendors = r'src/app/(dashboard)/dashboard/vendors/page.tsx'
with open(path_vendors, 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('href={`tel:`}', 'href={`tel:${vendor.Phone.replace(/\\D/g, \'\')}`}')
with open(path_vendors, 'w', encoding='utf-8') as f:
    f.write(text)

# Let's double check Accounts/page.tsx just in case
path_accounts = r'src/app/(dashboard)/dashboard/accounts/page.tsx'
if os.path.exists(path_accounts):
    with open(path_accounts, 'r', encoding='utf-8') as f:
        text = f.read()
    if 'href={`tel:`}' in text:
        text = text.replace('href={`tel:`}', 'href={`tel:${account.Phone.replace(/\\D/g, \'\')}`}')
        with open(path_accounts, 'w', encoding='utf-8') as f:
            f.write(text)
