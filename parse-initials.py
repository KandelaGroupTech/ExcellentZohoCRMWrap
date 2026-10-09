import subprocess

def edit(path):
    with open(path, 'r', encoding='utf8') as f:
        text = f.read()

    # MyToDos: Parse task subject
    if 'MyToDos.tsx' in path:
        if 'const renderSubject = (subject: string)' not in text:
            # We insert a helper function inside MyToDos
            helper = '''
  const renderSubject = (subject: string) => {
    const match = subject.match(/ - ([A-Z]{2})$/);
    if (match) {
      return {
        text: subject.replace(match[0], ''),
        initials: match[1]
      };
    }
    return { text: subject, initials: null };
  };
'''
            text = text.replace('return (', helper + '\n  return (', 1)
            
            # Replace {task.Subject} with the parsed version
            old_render = '<p className="text-sm font-medium text-gray-900 break-words">\n                          {task.Subject}\n                        </p>'
            new_render = '''<div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 break-words flex-1">
                            {renderSubject(task.Subject).text}
                          </p>
                          {renderSubject(task.Subject).initials && (
                            <span className="shrink-0 bg-gray-100 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200">
                              {renderSubject(task.Subject).initials}
                            </span>
                          )}
                        </div>'''
            text = text.replace(old_render, new_render)

    elif 'DealDetailModal.tsx' in path:
        # Do the same for DealDetailModal task list
        if 'const renderSubject = (subject: string)' not in text:
            helper = '''
  const renderSubject = (subject: string) => {
    const match = subject.match(/ - ([A-Z]{2})$/);
    if (match) {
      return { text: subject.replace(match[0], ''), initials: match[1] };
    }
    return { text: subject, initials: null };
  };
'''
            text = text.replace('const initials = user ?', helper + '\n  const initials = user ?')
            
            # Find the task render
            old_render_deal = '<span className={	ext-sm }>\n                            {task.Subject}\n                          </span>'
            new_render_deal = '''<div className="flex items-center gap-2 flex-1">
                            <span className={	ext-sm }>
                              {renderSubject(task.Subject).text}
                            </span>
                            {renderSubject(task.Subject).initials && (
                              <span className={	ext-[10px] font-bold px-1.5 py-0.5 rounded border }>
                                {renderSubject(task.Subject).initials}
                              </span>
                            )}
                          </div>'''
            text = text.replace(old_render_deal, new_render_deal)

    with open(path, 'w', encoding='utf8') as f:
        f.write(text)

edit('src/app/(dashboard)/dashboard/components/MyToDos.tsx')
edit('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx')
