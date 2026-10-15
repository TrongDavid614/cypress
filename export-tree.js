const fs = require('fs');
const path = require('path');

const IGNORE = new Set([
  'node_modules',
  '.git',
  '.next',
  '.vscode',
  'dist',
  'build',
  'cypress/videos',
  'cypress/screenshots',
  '.env',
  '.env.local',
  'public'
]);

function buildTree(dirPath, prefix = '') {
  let output = '';
  const items = fs.readdirSync(dirPath).filter(item => !IGNORE.has(item));

  items.forEach((item, index) => {
    const isLast = index === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    const fullPath = path.join(dirPath, item);
    const isDir = fs.statSync(fullPath).isDirectory();

    output += `${prefix}${connector}${item}\n`;

    if (isDir) {
      const nextPrefix = prefix + (isLast ? '    ' : '│   ');
      output += buildTree(fullPath, nextPrefix);
    }
  });

  return output;
}

const rootDir = process.cwd();
const rootName = path.basename(rootDir);
const treeString = `${rootName}/\n` + buildTree(rootDir);

// Xuất ra file tree.txt
fs.writeFileSync('tree.txt', treeString, 'utf-8');
console.log('✅ Đã xuất cây thư mục vào file tree.txt!');