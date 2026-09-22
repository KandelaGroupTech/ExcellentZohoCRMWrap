import os

file_path = 'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("fetch(/api/deals//tasks)", "fetch(/website-demos/excellentzohocrm/api/deals//tasks)")
content = content.replace("fetch(/api/deals//tasks, {", "fetch(/website-demos/excellentzohocrm/api/deals//tasks, {")
content = content.replace("fetch(/api/tasks/, {", "fetch(/website-demos/excellentzohocrm/api/tasks/, {")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
