import os

for root, dirs, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            content = content.replace("fetch('/api/", "fetch('/website-demos/excellentzohocrm/api/")
            content = content.replace('fetch(/api/', 'fetch(/website-demos/excellentzohocrm/api/')
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
