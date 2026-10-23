const fs = require('fs');
const content = fs.readFileSync('src/styles/mapDarkTheme.ts', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('"trunk"')) {
    console.log((i+1) + ': ' + l.trim());
  }
});
