import re

with open('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'r', encoding='utf8') as f:
    text = f.read()

# 1. Add logAsInitials state
if 'const [logAsInitials, setLogAsInitials]' not in text:
    text = text.replace('const [newNoteContent, setNewNoteContent] = useState("");', 'const [newNoteContent, setNewNoteContent] = useState("");\n  const [logAsInitials, setLogAsInitials] = useState("");')
    
    text = text.replace('const initials = user ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() : "";', 'const initials = user ? `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() : "";\n  useEffect(() => { if (initials && !logAsInitials) setLogAsInitials(initials); }, [initials]);')

# 2. Add the UI to the Note Form
old_note_submit = '''<button 
                  type="submit" 
                  disabled={createNoteMutation.isPending || !newNoteContent.trim()}
                  className="self-end inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90 disabled:opacity-50"
                >
                  {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                </button>'''

new_note_submit = '''<div className="flex items-center justify-end gap-3 w-full">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md shrink-0">
                    <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Log as:</span>
                    <input 
                      type="text" 
                      maxLength={3}
                      value={logAsInitials}
                      onChange={(e) => setLogAsInitials(e.target.value.toUpperCase())}
                      className="w-8 bg-transparent text-xs font-bold text-gray-900 border-none p-0 focus:ring-0 text-center"
                      placeholder="??"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={createNoteMutation.isPending || !newNoteContent.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-red hover:bg-brand-red/90 disabled:opacity-50"
                  >
                    {createNoteMutation.isPending ? 'Saving...' : 'Save Note'}
                  </button>
                </div>'''
text = text.replace(old_note_submit, new_note_submit)

# 3. Add the UI to the Task Form
text = text.replace('const subjectWithInitials = initials ? `${newTaskSubject.trim()} - ${initials}` : newTaskSubject.trim();', 'const subjectWithInitials = logAsInitials ? `${newTaskSubject.trim()} - ${logAsInitials}` : newTaskSubject.trim();')

old_task_inputs = '''<input 
                    type="date" 
                    value={newTaskDate}'''
new_task_inputs = '''<div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-md shrink-0">
                      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Log as:</span>
                      <input 
                        type="text" 
                        maxLength={3}
                        value={logAsInitials}
                        onChange={(e) => setLogAsInitials(e.target.value.toUpperCase())}
                        className="w-8 bg-transparent text-xs font-bold text-gray-900 border-none p-0 focus:ring-0 text-center"
                        placeholder="??"
                      />
                    </div>
                    <input 
                    type="date" 
                    value={newTaskDate}'''
text = text.replace(old_task_inputs, new_task_inputs)

with open('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'w', encoding='utf8') as f:
    f.write(text)
