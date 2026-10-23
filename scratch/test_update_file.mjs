import fs from 'fs';
import path from 'path';

const filePath = path.resolve('src/data/defaultZones.ts');
const content = fs.readFileSync(filePath, 'utf8');

const startIndex = content.indexOf('export const INITIAL_ZONES: ZoneData[] = [');
const endIndex = content.indexOf('];\n\n/**', startIndex);

console.log('startIndex:', startIndex, 'endIndex:', endIndex);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find boundaries!');
  process.exit(1);
}

console.log('Found boundaries successfully!');
