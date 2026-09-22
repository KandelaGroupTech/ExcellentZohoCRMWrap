import os
import re

file_path = 'src/app/(dashboard)/dashboard/components/KanbanBoard.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add a formatDate utility function if it doesn't exist
if 'function formatDate' not in content:
    content = content.replace('function formatCurrency', '''function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function formatCurrency''')

card_render = '''className={g-white p-4 rounded shadow-sm border border-gray-200 transition-colors relative }
                >
                  {deal.Modified_Time && (
                    <span className="absolute top-2 right-2 text-[10px] text-gray-400 font-medium">
                      {formatDate(deal.Modified_Time)}
                    </span>
                  )}
                  <h4 className="text-sm font-semibold text-gray-900 mb-1 pr-16">{deal.Deal_Name}</h4>'''

content = re.sub(
    r'className=\{\g-white p-4 rounded shadow-sm border border-gray-200 transition-colors \$\{isAdmin \? \'hover:border-brand-red/50 cursor-grab active:cursor-grabbing\' : \'cursor-pointer\'\}\\}\n\s+>\n\s+<h4 className="text-sm font-semibold text-gray-900 mb-1">\{deal\.Deal_Name\}</h4>',
    card_render,
    content
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
