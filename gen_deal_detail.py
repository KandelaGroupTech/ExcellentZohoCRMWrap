import os
import re

file_path = 'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useQueryClient and Trash2 imports
content = content.replace("import { Plus, CheckCircle2, Circle, Loader2 } from 'lucide-react';", "import { Plus, CheckCircle2, Circle, Loader2, Trash2 } from 'lucide-react';")

# Replace useMutation import line to make sure useQueryClient is there
if 'useQueryClient' not in content:
    content = content.replace("import { useQuery, useMutation } from '@tanstack/react-query';", "import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';")

# Add deleteMutation and handleDelete
mutation = '''
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(/website-demos/excellentzohocrm/api/deals/ + deal.id, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to delete deal');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      onClose();
      toast.success('Deal deleted successfully');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete deal');
    }
  });

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this deal?')) {
      deleteMutation.mutate();
    }
  };
'''

content = content.replace('  const createTaskMutation = useMutation({', mutation + '\n  const createTaskMutation = useMutation({')

# Add the Delete button inside the modal
delete_button = '''
          {isAdmin && (
            <div className="mt-8 pt-4 border-t flex justify-end">
              <button 
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? 'Deleting...' : 'Delete Deal'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
'''

content = content.replace('        </div>\n      </div>\n    </Modal>', delete_button)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
