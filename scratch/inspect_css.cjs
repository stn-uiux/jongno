const fs = require('fs');

const p = 'C:/Users/user/Desktop/[서울경찰청]메인대시보드(퍼블리싱)_260203/resource/css/style.css';
if (fs.existsSync(p)) {
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('map-blank') || l.includes('map-zone') || l.includes('critical_path') || l.includes('hard-light') || l.includes('major_path') || l.includes('minor_path') || l.includes('warning_path')) {
      const start = Math.max(0, i - 5);
      const end = Math.min(lines.length, i + 15);
      console.log(`=== Line ${i+1} ===`);
      console.log(lines.slice(start, end).join('\n'));
    }
  });
} else {
  console.log('style.css not found at', p);
}
