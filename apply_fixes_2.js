const fs = require('fs');

let todos = fs.readFileSync('src/app/(dashboard)/dashboard/components/MyToDos.tsx', 'utf8');
todos = todos.replace(
  '} else if (task.What_Id?.name) {\n      groupName = task.What_Id.name;\n    }',
  '} else if (task.What_Id?.name) {\n      groupName = task.What_Id.name;\n    } else if (task.Who_Id?.name) {\n      groupName = task.Who_Id.name;\n    }'
);
fs.writeFileSync('src/app/(dashboard)/dashboard/components/MyToDos.tsx', todos, 'utf8');

let zoho = fs.readFileSync('src/lib/zoho.ts', 'utf8');
zoho = zoho.replace('fields=Subject,Status,What_Id,SEMODULE_ID,SE_Module', 'fields=Subject,Status,What_Id,Who_Id,SEMODULE_ID,SE_Module');
fs.writeFileSync('src/lib/zoho.ts', zoho, 'utf8');
