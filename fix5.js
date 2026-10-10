const fs = require('fs');

let file1 = 'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx';
let c1 = fs.readFileSync(file1, 'utf8');

const newParse1 = `if (deal.Description.includes('---DEAL_META---')) {
      const parts = deal.Description.split('---DEAL_META---');
      const metaStr = parts[parts.length - 1].trim();
      try { currentOwner = JSON.parse(metaStr).owner; } catch(e) {}
    }`;

// Find where currentOwner is parsed
const parseStart1 = c1.indexOf('const match = deal.Description.match(/---DEAL_META');
if (parseStart1 !== -1) {
  const parseEnd1 = c1.indexOf('}', parseStart1) + 1;
  const parseEnd2 = c1.indexOf('}', parseEnd1) + 1;
  c1 = c1.substring(0, parseStart1) + newParse1 + c1.substring(parseEnd2);
}

// Find where baseDesc is assigned
const replaceStart1 = c1.indexOf('let baseDesc = (deal.Description');
if (replaceStart1 !== -1) {
  const replaceEnd1 = c1.indexOf(';', replaceStart1) + 1;
  c1 = c1.substring(0, replaceStart1) + "let baseDesc = (deal.Description || '').split('\\n---DEAL_META---')[0];" + c1.substring(replaceEnd1);
}

fs.writeFileSync(file1, c1);

let file2 = 'src/app/(dashboard)/dashboard/components/KanbanBoard.tsx';
let c2 = fs.readFileSync(file2, 'utf8');

const newParse2 = `if (deal.Description.includes('---DEAL_META---')) {
          const parts = deal.Description.split('---DEAL_META---');
          const metaStr = parts[parts.length - 1].trim();
          try { owner = JSON.parse(metaStr).owner; } catch(e) {}
        }`;

const parseStart2 = c2.indexOf('const match = deal.Description.match(/---DEAL_META');
if (parseStart2 !== -1) {
  const parseEnd2 = c2.indexOf('}', c2.indexOf('}', c2.indexOf('}') + 1) + 1) + 1; 
  // It has a try/catch block. Let's just find the exact block.
}

// Actually, string replace with literal string is safer for KanbanBoard
const kbBlock = `const match = deal.Description.match(/---DEAL_META---\\n(.*)/);
        if (match) {
          try {
            const meta = JSON.parse(match[1]);
            owner = meta.owner;
          } catch (e) {
            console.error('Failed to parse deal meta', e);
          }
        }`;
if (c2.includes(kbBlock)) {
  c2 = c2.replace(kbBlock, newParse2);
}

fs.writeFileSync(file2, c2);
console.log('Done');
