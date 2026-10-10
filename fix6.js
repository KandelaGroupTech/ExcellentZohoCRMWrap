const fs = require('fs');
let file2 = 'src/app/(dashboard)/dashboard/components/KanbanBoard.tsx';
let c2 = fs.readFileSync(file2, 'utf8');

const newParse2 = `if (deal.Description.includes('---DEAL_META---')) {
          const parts = deal.Description.split('---DEAL_META---');
          const metaStr = parts[parts.length - 1].trim();
          try { owner = JSON.parse(metaStr).owner; } catch(e) {}
        }`;

const start2 = c2.indexOf('const match = deal.Description.match(/---DEAL_META');
if (start2 !== -1) {
  // Find the end of the if (match) { ... } block
  let curr = c2.indexOf('if (match)', start2);
  let openBrackets = 0;
  let end2 = -1;
  for (let i = curr; i < c2.length; i++) {
    if (c2[i] === '{') openBrackets++;
    else if (c2[i] === '}') {
      openBrackets--;
      if (openBrackets === 0) {
        end2 = i + 1;
        break;
      }
    }
  }
  if (end2 !== -1) {
    c2 = c2.substring(0, start2) + newParse2 + c2.substring(end2);
  }
}

fs.writeFileSync(file2, c2);
console.log('Done Kanban');
