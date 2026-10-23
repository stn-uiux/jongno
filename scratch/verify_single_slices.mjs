import fs from 'fs';

const d = JSON.parse(fs.readFileSync('src/data/subwayLines.json'));

function checkLine(name, pts) {
  let jumps = 0;
  for (let i = 1; i < pts.length; i++) {
    const dist = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    // More than 500m between consecutive track points is a jump
    if (dist > 0.005) {
      jumps++;
      console.log(`  [${name}] Jump at index ${i}: dist ${dist.toFixed(4)}`);
    }
  }
  console.log(`[${name}] Points: ${pts.length}, Start: [${pts[0]}], End: [${pts[pts.length - 1]}], Jumps: ${jumps}`);
}

// 1호선: 0 to 623
const l1 = d.features.find((f) => f.properties.shortName === '1호선').geometry.coordinates.slice(0, 624);
checkLine('1호선 (0..623)', l1);

// 3호선: 0 to 470
const l3 = d.features.find((f) => f.properties.shortName === '3호선').geometry.coordinates.slice(0, 471);
checkLine('3호선 (0..470)', l3);

// 4호선: 0 to 546
const l4 = d.features.find((f) => f.properties.shortName === '4호선').geometry.coordinates.slice(0, 547);
checkLine('4호선 (0..546)', l4);

// 5호선: Part 0 (0 to 424)
const l5 = d.features.find((f) => f.properties.shortName === '5호선').geometry.coordinates[0].slice(0, 425);
checkLine('5호선 (0..424)', l5);

// 6호선: 0 to 272
const l6 = d.features.find((f) => f.properties.shortName === '6호선').geometry.coordinates.slice(0, 273);
checkLine('6호선 (0..272)', l6);
