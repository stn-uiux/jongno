const fs = require('fs');

const p = 'C:/Users/user/Desktop/[서울경찰청]메인대시보드(퍼블리싱)_260203/html/police/integrated.html';
const content = fs.readFileSync(p, 'utf8');

// Find SVG defs / radialGradient
const svgMatches = content.match(/<svg[\s\S]*?<\/svg>/g) || [];
svgMatches.forEach(svg => {
  if (svg.includes('radialGradient') || svg.includes('critical_path')) {
    console.log('=== SVG Gradient Defs ===');
    console.log(svg);
  }
});

// Find CSS files referenced
const cssMatches = content.match(/<link[^>]+rel=["']stylesheet["'][^>]*>/g) || [];
console.log('=== CSS Links ===');
cssMatches.forEach(c => console.log(c));

// Also find inline style tags
const styleMatches = content.match(/<style[\s\S]*?<\/style>/g) || [];
styleMatches.forEach(s => {
  if (s.includes('map-blank') || s.includes('critical_path') || s.includes('hard-light')) {
    console.log('=== Style Tag Match ===');
    console.log(s);
  }
});
