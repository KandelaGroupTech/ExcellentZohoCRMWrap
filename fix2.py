def fix(path):
    with open(path, 'r', encoding='utf8') as f:
        text = f.read()
    
    # We want the literal characters: /---DEAL_META---\n(.*)/
    # So we replace the literal newline with \n
    text = text.replace('/---DEAL_META---\n(.*)', r'/---DEAL_META---\n(.*)/')
    text = text.replace('/\\n---DEAL_META---\n(.*)', r'/\n---DEAL_META---\n(.*)/')
    
    with open(path, 'w', encoding='utf8') as f:
        f.write(text)

fix('src/app/(dashboard)/dashboard/components/KanbanBoard.tsx')
fix('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx')
