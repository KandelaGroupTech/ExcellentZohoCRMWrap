import os

for root, dirs, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            content = content.replace('className="mt-1 block w-full rounded-md border-gray-300', 'className="mt-1 block w-full bg-white text-gray-900 rounded-md border-gray-300')
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
