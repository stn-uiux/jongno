const fs = require('fs');
const content = fs.readFileSync('src/styles/mapDarkTheme.ts', 'utf8');

const regex = /"id":\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const id = match[1];
  if (id.includes('bridge') || id.includes('tunnel')) {
    console.log(id);
  }
}
