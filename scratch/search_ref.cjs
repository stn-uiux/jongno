const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      searchDir(full);
    } else if (f.endsWith('.css') || f.endsWith('.html') || f.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('map-blank') || content.includes('critical_path')) {
        console.log('Found in', full);
        const lines = content.split('\n');
        lines.forEach((l, i) => {
          if (l.includes('map-blank') || l.includes('critical_path') || l.includes('hard-light')) {
            console.log(`  Line ${i+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

searchDir('C:/Users/user/Desktop/[서울경찰청]메인대시보드(퍼블리싱)_260203');
