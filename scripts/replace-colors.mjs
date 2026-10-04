import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
      .replace(/text-indigo-600/g, 'text-brand-red')
      .replace(/bg-indigo-600/g, 'bg-brand-red')
      .replace(/hover:bg-indigo-700/g, 'hover:bg-brand-red/90')
      .replace(/hover:bg-indigo-500/g, 'hover:bg-brand-red/90')
      .replace(/hover:text-indigo-600/g, 'hover:text-brand-red')
      .replace(/border-indigo-500/g, 'border-brand-red')
      .replace(/ring-indigo-500/g, 'ring-brand-red')
      .replace(/hover:border-indigo-300/g, 'hover:border-brand-red/50')
      .replace(/focus-visible:outline-indigo-600/g, 'focus-visible:outline-brand-red');
      
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
