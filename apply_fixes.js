const fs = require('fs');

let zoho = fs.readFileSync('src/lib/zoho.ts', 'utf8');
zoho = zoho.replace('What_Id: data.What_Id, // Zoho v6 can accept the ID directly', 'What_Id: { id: data.What_Id }, // Enforce object format');
fs.writeFileSync('src/lib/zoho.ts', zoho, 'utf8');

let todos = fs.readFileSync('src/app/(dashboard)/dashboard/components/MyToDos.tsx', 'utf8');
todos = todos.replace('space-y-6 custom-scrollbar', 'space-y-4 custom-scrollbar');
todos = todos.replace('key={group} className="space-y-3"', 'key={group} className="space-y-1"');
todos = todos.replace('text-gray-500 uppercase', 'text-brand-red uppercase');
todos = todos.replace('className="space-y-2"', 'className="space-y-0.5"');
todos = todos.replace('gap-3 p-3 rounded-lg', 'gap-3 p-2 rounded-lg');
fs.writeFileSync('src/app/(dashboard)/dashboard/components/MyToDos.tsx', todos, 'utf8');
