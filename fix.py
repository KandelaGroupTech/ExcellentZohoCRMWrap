def fix(path):
    with open(path, 'r', encoding='utf8') as f:
        text = f.read()

    # The file currently has a literal newline in the regex, which caused 'Unterminated regular expression literal'.
    # We need to replace the literal newline with the literal characters '\' and 'n'.
    # Because PowerShell -replace '---DEAL_META---\n' actually put a real \n in the file!
    
    import re
    # Find /---DEAL_META---\n(.*  and replace with /---DEAL_META---\\n(.*)/
    text = re.sub(r'/---DEAL_META---\n(.*)', r'/---DEAL_META---\\n(.*)/', text)
    
    with open(path, 'w', encoding='utf8') as f:
        f.write(text)

fix('src/app/(dashboard)/dashboard/components/KanbanBoard.tsx')
fix('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx')
