const fs = require('fs');
const content = fs.readFileSync('src/styles/mapDarkTheme.ts', 'utf8');

const regex = /"id":\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const id = match[1];
  const idx = match.index;
  const chunk = content.substring(idx, idx + 600);
  if (chunk.includes('construction')) {
    console.log('Layer with construction:', id);
  }
}
