import os, re

pages = [
    (r'src/app/(dashboard)/dashboard/contacts/page.tsx',
     'contacts',
     'Error loading contacts.',
     "if (!res.ok) throw new Error('Failed to fetch contacts');"),

    (r'src/app/(dashboard)/dashboard/leads/page.tsx',
     'leads',
     'Error loading leads.',
     "if (!res.ok) throw new Error('Failed to fetch leads');"),

    (r'src/app/(dashboard)/dashboard/accounts/page.tsx',
     'accounts',
     'Error loading accounts.',
     "if (!res.ok) throw new Error('Failed to fetch accounts');"),
]

# Fix 1: improve error display to show actual error message + http status
error_replacement = '''    <div className="rounded-md bg-red-50 p-4 space-y-2">
        <p className="text-sm font-medium text-red-800">Error loading {label}: {(error as Error)?.message || 'Unknown error'}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs text-red-700 underline"
        >
          Tap to retry
        </button>
      </div>'''

for path, label, old_msg, fetch_line in pages:
    if not os.path.exists(path):
        print(f"SKIP (not found): {path}")
        continue

    with open(path, 'r', encoding='utf-8') as f:
        text = f.read()

    # Improve the error display
    old_error_block = f'''      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm font-medium text-red-800">{old_msg}</p>
      </div>'''
    new_error_block = f'''      <div className="rounded-md bg-red-50 p-4 space-y-2">
        <p className="text-sm font-medium text-red-800">Error: {{(error as Error)?.message || '{old_msg}'}}</p>
        <button
          onClick={{() => window.location.reload()}}
          className="text-xs text-red-700 underline"
        >
          Tap to retry
        </button>
      </div>'''

    if old_error_block in text:
        text = text.replace(old_error_block, new_error_block)
        print(f"Fixed error UI in: {path}")
    else:
        print(f"WARNING: Could not find error block in {path}")

    # Improve the error message to include HTTP status
    new_fetch_line = fetch_line.replace(
        "throw new Error('Failed to fetch " + label + "')",
        "throw new Error(`Failed to fetch " + label + ": ${res.status} ${res.statusText}`)"
    )
    if fetch_line in text:
        text = text.replace(fetch_line, new_fetch_line)
        print(f"  Fixed fetch error message in: {path}")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

print("Done")
