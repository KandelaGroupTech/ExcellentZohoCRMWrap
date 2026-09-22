import os

file_path = 'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the duplicate declaration
content = content.replace("  const queryClient = useQueryClient();\n  const deleteMutation = useMutation({", "  const deleteMutation = useMutation({")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
