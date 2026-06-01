const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

let modifiedFiles = [];

walkDir('c:/Users/HES/Desktop/itzo folder/itzo/Frontend/src', function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let original = content;

    // We only want to replace bg-blue-600/500/700 where they are used for buttons or active state highlights.
    // The safest broad stroke for primary action elements is to replace exactly these:
    content = content.replace(/bg-blue-600/g, 'bg-primary');
    content = content.replace(/hover:bg-blue-700/g, 'hover:bg-primary/90');
    content = content.replace(/hover:bg-blue-600/g, 'hover:bg-primary/90');
    content = content.replace(/bg-blue-500/g, 'bg-primary');
    content = content.replace(/bg-blue-700/g, 'bg-primary/90');
    
    // Also replace border colors and text colors typically used alongside primary blue buttons
    content = content.replace(/border-blue-600/g, 'border-primary');
    content = content.replace(/border-blue-500/g, 'border-primary');
    content = content.replace(/ring-blue-500/g, 'ring-primary');
    content = content.replace(/text-blue-600/g, 'text-primary');

    // Clean up ActionSlider color prop
    content = content.replace(/color="bg-orange-500"/g, '');
    content = content.replace(/color="bg-blue-500"/g, '');
    content = content.replace(/color='bg-orange-500'/g, '');
    content = content.replace(/color='bg-blue-500'/g, '');

    // Sometimes inline styles or specific words are used
    content = content.replace(/blue: "bg-blue-600"/g, 'blue: "bg-primary"');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedFiles.push(filePath);
    }
  }
});

console.log('Modified files count:', modifiedFiles.length);
fs.writeFileSync('c:/Users/HES/Desktop/itzo folder/itzo/Frontend/modified_files.txt', modifiedFiles.join('\n'));
