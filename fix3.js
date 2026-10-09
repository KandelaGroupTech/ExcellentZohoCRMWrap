const fs = require('fs');

let file1 = 'src/app/(dashboard)/dashboard/components/DealDetailModal.tsx';
let c1 = fs.readFileSync(file1, 'utf8');
c1 = c1.replace(/match\(\/---DEAL_META---\\n\(\.\*\)\r\n/, 'match(/---DEAL_META---\\\\n(.*)/);\r\n');
c1 = c1.replace(/replace\(\/\\n---DEAL_META---\\n\(\.\*\)\r\n/, 'replace(/\\\\n---DEAL_META---\\\\n(.*)/, \"\");\r\n');
fs.writeFileSync(file1, c1);

let file2 = 'src/app/(dashboard)/dashboard/components/KanbanBoard.tsx';
let c2 = fs.readFileSync(file2, 'utf8');
c2 = c2.replace(/match\(\/---DEAL_META---\\n\(\.\*\)\r\n/, 'match(/---DEAL_META---\\\\n(.*)/);\r\n');
fs.writeFileSync(file2, c2);
