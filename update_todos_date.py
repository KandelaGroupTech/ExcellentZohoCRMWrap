import sys

with open('src/app/(dashboard)/dashboard/components/MyToDos.tsx', 'r', encoding='utf8') as f:
    text = f.read()

# 1. Update the sort logic to sort by Due_Date inside each group
old_sort_logic = """    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(task);
    return acc;
  }, {});"""

new_sort_logic = """    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(task);
    return acc;
  }, {});

  // Sort tasks within each group chronologically
  Object.keys(groupedTasks).forEach(group => {
    groupedTasks[group].sort((a: any, b: any) => {
      if (!a.Due_Date && !b.Due_Date) return 0;
      if (!a.Due_Date) return 1;
      if (!b.Due_Date) return -1;
      return new Date(a.Due_Date).getTime() - new Date(b.Due_Date).getTime();
    });
  });"""

text = text.replace(old_sort_logic, new_sort_logic)

# 2. Update the task rendering to show the Due Date
old_task_render = """                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {task.Subject}
                        </p>
                      </div>"""

new_task_render = """                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 break-words">
                          {task.Subject}
                        </p>
                        {task.Due_Date && (
                          <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${
                            new Date(task.Due_Date) < new Date(new Date().setHours(0,0,0,0)) 
                              ? 'text-red-600' 
                              : new Date(task.Due_Date).toDateString() === new Date().toDateString()
                                ? 'text-orange-500'
                                : 'text-gray-500'
                          }`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(task.Due_Date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: new Date(task.Due_Date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })}
                          </div>
                        )}
                      </div>"""

text = text.replace(old_task_render, new_task_render)

with open('src/app/(dashboard)/dashboard/components/MyToDos.tsx', 'w', encoding='utf8') as f:
    f.write(text)
