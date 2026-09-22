import os
import re

file_path = 'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useUser import
if 'useUser' not in content:
    content = content.replace("import { useAuth } from '@clerk/nextjs';", "import { useAuth, useUser } from '@clerk/nextjs';")

# Add initials helper and state/queries
hooks = '''  const { user } = useUser();
  const initials = user ? ${user.firstName?.charAt(0) || ''}.toUpperCase() : '';
  const [newNoteContent, setNewNoteContent] = useState('');

  const { data: notes, isLoading: isLoadingNotes } = useQuery({
    queryKey: ['notes', deal?.id],
    queryFn: async () => {
      if (!deal?.id) return [];
      const res = await fetch(/website-demos/excellentzohocrm/api/deals//notes);
      if (!res.ok) throw new Error('Failed to fetch notes');
      return res.json();
    },
    enabled: !!deal?.id && isOpen
  });

  const createNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(/website-demos/excellentzohocrm/api/deals//notes, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, initials })
      });
      if (!res.ok) throw new Error('Failed to create note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', deal?.id] });
      setNewNoteContent('');
      toast.success('Note added successfully');
    },
    onError: () => {
      toast.error('Failed to add note');
    }
  });'''

if 'const [newNoteContent' not in content:
    content = content.replace("  const [newTaskSubject, setNewTaskSubject] = useState('');", "  const [newTaskSubject, setNewTaskSubject] = useState('');\n" + hooks)

# Add Notes UI after tasks
notes_ui = '''          {/* Notes Section */}
          <div className="mt-8">
            <h4 className="text-md font-medium text-gray-900 mb-4 border-b pb-2">Notes</h4>
            
            {isLoadingNotes ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-brand-red" />
              </div>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 mb-4">
                {notes?.map((note: any) => (
                  <div key={note.id} className="bg-yellow-50 border border-yellow-200 rounded-md p-3 relative">
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{note.Note_Content}</p>
                    <div className="mt-2 flex justify-between items-center text-[10px] text-gray-500">
                      <span>{new Date(note.Created_Time).toLocaleDateString()} {new Date(note.Created_Time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      <span className="font-medium bg-yellow-200 px-1.5 py-0.5 rounded text-yellow-800">{note.Note_Title?.replace('Note from ', '') || 'Me'}</span>
                    </div>
                  </div>
                ))}
                {notes?.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-2">No notes added yet.</p>
                )}
              </div>
            )}

            {isAdmin && (
              <form 
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newNoteContent.trim()) createNoteMutation.mutate(newNoteContent);
                }}
              >
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a new note..."
                  rows={2}
                  className="block w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red resize-none"
                />
                <button 
                  type="submit" 
                  disabled={createNoteMutation.isPending || !newNoteContent.trim()}
                  className="self-end inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90 disabled:opacity-50"
                >
                  {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                </button>
              </form>
            )}
          </div>
'''

if 'Notes Section' not in content:
    content = content.replace("          {isAdmin && (\n            <div className=\"mt-8 pt-4 border-t flex justify-end\">", notes_ui + "\n          {isAdmin && (\n            <div className=\"mt-8 pt-4 border-t flex justify-end\">")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
