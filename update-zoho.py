import subprocess

def edit(path):
    with open(path, 'r', encoding='utf8') as f:
        text = f.read()

    # Find updateDealStage
    if 'export async function updateDealStage' in text:
        old_body = "body: JSON.stringify({ data: [{ id: dealId, Stage: stage }] })"
        new_body = '''body: JSON.stringify({ 
        data: [{ 
          id: dealId, 
          Stage: stage,
          ...(stage === 'Closed Won' ? { Closing_Date: new Date().toISOString().split('T')[0] } : {})
        }] 
      })'''
        text = text.replace(old_body, new_body)

    with open(path, 'w', encoding='utf8') as f:
        f.write(text)

edit('src/lib/zoho.ts')
