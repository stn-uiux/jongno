import fs from 'fs';

const boundary = JSON.parse(fs.readFileSync('scratch/official_jongno_boundary.json', 'utf-8'));

const formattedPoints = boundary
  .map(([lat, lng]) => `  [${lat.toFixed(6)}, ${lng.toFixed(6)}],`)
  .join('\n');

const newBoundaryBlock = `// Jongno-gu official administrative boundary (Merged from 17 official administrative dongs)
// Source: MOIS / Seoul HangJeongDong official dataset (Code 11110)
// High-precision boundary matching Naver Map / Kakao Map official Jongno-gu administrative border.
export const JONGNO_BOUNDARY: [number, number][] = [
${formattedPoints}
];`;

const constantsPath = 'src/utils/constants.ts';
let content = fs.readFileSync(constantsPath, 'utf-8');

const regex = /\/\/ Jongno-gu official administrative boundary[\s\S]*?export const JONGNO_BOUNDARY: \[number, number\]\[\] = \[[\s\S]*?\];/;

if (!regex.test(content)) {
  console.error('Could not find JONGNO_BOUNDARY block in constants.ts');
  process.exit(1);
}

content = content.replace(regex, newBoundaryBlock);
fs.writeFileSync(constantsPath, content, 'utf-8');
console.log('Successfully updated JONGNO_BOUNDARY in src/utils/constants.ts with 271 high-precision points!');
