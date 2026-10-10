import sys

# KanbanBoard.tsx
with open('src/app/(dashboard)/dashboard/components/KanbanBoard.tsx', 'r', encoding='utf8') as f:
    c2 = f.read()

oldParse2 = r'''const match = deal.Description.match(/---DEAL_META---\\n(.*)/);
        if (match) {
          try {
            const meta = JSON.parse(match[1]);
            owner = meta.owner;
          } catch (e) {
            console.error('Failed to parse deal meta', e);
          }
        }'''
newParse2 = '''if (deal.Description.includes('---DEAL_META---')) {
        const parts = deal.Description.split('---DEAL_META---');
        const metaStr = parts[parts.length - 1].trim();
        try { owner = JSON.parse(metaStr).owner; } catch(e) {}
      }'''
c2 = c2.replace(oldParse2, newParse2)
with open('src/app/(dashboard)/dashboard/components/KanbanBoard.tsx', 'w', encoding='utf8') as f:
    f.write(c2)

# DealDetailModal.tsx
with open('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'r', encoding='utf8') as f:
    c1 = f.read()

oldParse1 = r'''const match = deal.Description.match(/---DEAL_META---\\n(.*)/);
      if (match) {
        try { currentOwner = JSON.parse(match[1]).owner; } catch(e) {}
      }'''
newParse1 = '''if (deal.Description.includes('---DEAL_META---')) {
      const parts = deal.Description.split('---DEAL_META---');
      const metaStr = parts[parts.length - 1].trim();
      try { currentOwner = JSON.parse(metaStr).owner; } catch(e) {}
    }'''
c1 = c1.replace(oldParse1, newParse1)

oldReplace1 = r'''let baseDesc = (deal.Description || '').replace(/\n---DEAL_META---\n(.*)/, "");'''
newReplace1 = r'''let baseDesc = (deal.Description || '').split('\n---DEAL_META---')[0];'''
c1 = c1.replace(oldReplace1, newReplace1)

# Oh wait, earlier I replaced it to be eplace(/\\n---DEAL_META---\\n(.*)/, "");
oldReplace1_alt = r'''let baseDesc = (deal.Description || '').replace(/\\n---DEAL_META---\\n(.*)/, "");'''
c1 = c1.replace(oldReplace1_alt, newReplace1)

with open('src/app/(dashboard)/dashboard/components/DealDetailModal.tsx', 'w', encoding='utf8') as f:
    f.write(c1)

print("Done")
