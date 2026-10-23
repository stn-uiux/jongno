const fs = require('fs');

const p = 'C:/Users/user/Desktop/[서울경찰청]메인대시보드(퍼블리싱)_260203/resource/css/content.css';
const content = fs.readFileSync(p, 'utf8');
const lines = content.split('\n');
console.log(lines.slice(19855, 19960).join('\n'));
