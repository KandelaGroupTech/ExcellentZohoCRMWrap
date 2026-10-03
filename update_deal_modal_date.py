import sys

with open('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'r', encoding='utf8') as f:
    text = f.read()

# 1. Add state variable for the date
if "const [newTaskDate, setNewTaskDate] = useState('');" not in text:
    text = text.replace(
        "const [newTaskSubject, setNewTaskSubject] = useState('');",
        "const [newTaskSubject, setNewTaskSubject] = useState('');\n  const [newTaskDate, setNewTaskDate] = useState('');"
    )

# 2. Update mutation
old_mutation = """  const createTaskMutation = useMutation({
    mutationFn: async (subject: string) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Subject: subject })
      });"""

new_mutation = """  const createTaskMutation = useMutation({
    mutationFn: async ({ subject, dueDate }: { subject: string, dueDate: string }) => {
      const res = await fetch(`/website-demos/excellentzohocrm/api/deals/${deal.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ Subject: subject, Due_Date: dueDate })
      });"""

if old_mutation in text:
    text = text.replace(old_mutation, new_mutation)
else:
    # Just to be safe, maybe use a looser replacement
    text = text.replace(
        "mutationFn: async (subject: string) => {",
        "mutationFn: async ({ subject, dueDate }: { subject: string, dueDate: string }) => {"
    )
    text = text.replace(
        "body: JSON.stringify({ Subject: subject })",
        "body: JSON.stringify({ Subject: subject, Due_Date: dueDate })"
    )

# 3. Clear date on success
text = text.replace(
    "setNewTaskSubject('');",
    "setNewTaskSubject('');\n      setNewTaskDate('');"
)

# 4. Update the form logic
old_form_logic = """                if (newTaskSubject.trim()) {
                  const subjectWithInitials = initials ? `${newTaskSubject.trim()} - ${initials}` : newTaskSubject.trim();
                  createTaskMutation.mutate(subjectWithInitials);
                }"""

new_form_logic = """                if (newTaskSubject.trim()) {
                  const subjectWithInitials = initials ? `${newTaskSubject.trim()} - ${initials}` : newTaskSubject.trim();
                  createTaskMutation.mutate({ subject: subjectWithInitials, dueDate: newTaskDate });
                }"""

text = text.replace(old_form_logic, new_form_logic)

# 5. Add the date input to the form
old_form_ui = """              <form 
                className="mt-4 flex gap-2" 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newTaskSubject.trim()) {
                    const subjectWithInitials = initials ? `${newTaskSubject.trim()} - ${initials}` : newTaskSubject.trim();
                    createTaskMutation.mutate({ subject: subjectWithInitials, dueDate: newTaskDate });
                  }
                }}
              >
                <input 
                  type="text" 
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  placeholder="Add a new follow-up..." 
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red bg-white text-gray-900"
                />
                <button """

new_form_ui = """              <form 
                className="mt-4 flex flex-col sm:flex-row gap-2" 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newTaskSubject.trim()) {
                    const subjectWithInitials = initials ? `${newTaskSubject.trim()} - ${initials}` : newTaskSubject.trim();
                    createTaskMutation.mutate({ subject: subjectWithInitials, dueDate: newTaskDate });
                  }
                }}
              >
                <input 
                  type="text" 
                  value={newTaskSubject}
                  onChange={(e) => setNewTaskSubject(e.target.value)}
                  placeholder="Add a new follow-up..." 
                  className="flex-1 min-w-0 block w-full px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red bg-white text-gray-900"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="block w-full sm:w-36 px-3 py-2 rounded-md border border-gray-300 text-sm focus:ring-brand-red focus:border-brand-red bg-white text-gray-900"
                  />
                  <button """

text = text.replace(old_form_ui, new_form_ui)

with open('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'w', encoding='utf8') as f:
    f.write(text)
