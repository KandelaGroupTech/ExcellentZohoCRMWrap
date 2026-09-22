import os
import re

file_path = 'src/app/(dashboard)/dashboard/leads/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add imports for Trash2, useMutation, useQueryClient, toast
content = content.replace("import { Loader2, Plus } from 'lucide-react';", "import { Loader2, Plus, Trash2 } from 'lucide-react';")
content = content.replace("import { useQuery } from '@tanstack/react-query';", "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';\nimport toast from 'react-hot-toast';")

# Add the delete mutation
mutation = '''  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async (leadId: string) => {
      const res = await fetch(/website-demos/excellentzohocrm/api/leads/ + leadId, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete lead');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete lead');
    }
  });

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      deleteMutation.mutate(id);
    }
  };
'''

content = content.replace('  const [isModalOpen, setIsModalOpen] = useState(false);', '  const [isModalOpen, setIsModalOpen] = useState(false);\n' + mutation)

# Add the columns
actions_column = '''    { key: 'Lead_Source', label: 'Source' },
    {
      key: 'actions',
      label: '',
      render: (row: any) => isAdmin ? (
        <button 
          onClick={() => handleDelete(row.id)} 
          className="text-gray-400 hover:text-red-600 transition-colors"
          title="Delete Lead"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null
    }'''

content = content.replace("    { key: 'Lead_Source', label: 'Source' },", actions_column)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
