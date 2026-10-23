import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/data/defaultZones.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Regex to match zone blocks with id, name, scannerName
// Example:
// name: 'A-1',
// scannerName: 'CCTV 방범574',
const regex = /(name:\s*['"])([^'"]+)(['"],\s*\n\s*scannerName:\s*['"])([^'"]+)(['"])/g;

let count = 0;
content = content.replace(regex, (match, prefix, oldName, mid, scannerName, suffix) => {
  const cleanName = scannerName.replace(/^cctv\s*/i, '').trim();
  count++;
  return `${prefix}${cleanName}${mid}${scannerName}${suffix}`;
});

console.log(`Updated ${count} zone names.`);
fs.writeFileSync(filePath, content, 'utf8');
