import fs from 'fs';
import path from 'path';

const defaultZonesPath = path.resolve('src/data/defaultZones.ts');
const currentContent = fs.readFileSync(defaultZonesPath, 'utf8');

const regex = /(export const INITIAL_ZONES: ZoneData\[\] = \[)([\s\S]*?)(\];\r?\n\r?\n\/\*\*[\s\S]*?export const INITIAL_CONGESTIONS)/;

const match = currentContent.match(regex);
console.log('Regex matched?', !!match);
if (match) {
  console.log('Prefix length:', match[1].length);
  console.log('Body length:', match[2].length);
  console.log('Suffix starts with:', match[3].slice(0, 40));
}
