import fs from 'fs';

const raw = fs.readFileSync(
  'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\bae94a79-baca-4457-885a-ce5e381f1ed5\\.system_generated\\steps\\1637\\content.md',
  'utf-8'
);

const idx = raw.indexOf('{"type":"FeatureCollection"');
if (idx === -1) {
  console.error('FeatureCollection not found in content.md');
  process.exit(1);
}

const geo = JSON.parse(raw.slice(idx));
console.log('Features count:', geo.features.length);

const jongno = geo.features.find((f) => f.properties.code === '11010' || f.properties.name === '종로구');

if (jongno) {
  console.log('Found Jongno-gu!', jongno.properties);
  const coords = jongno.geometry.coordinates[0];
  console.log('Coordinates count:', coords.length);
  const lats = coords.map((c) => c[1]);
  const lngs = coords.map((c) => c[0]);
  console.log('Min Lat:', Math.min(...lats), 'Max Lat:', Math.max(...lats));
  console.log('Min Lng:', Math.min(...lngs), 'Max Lng:', Math.max(...lngs));
  fs.writeFileSync('scratch/jongno_official_kostat.json', JSON.stringify(jongno, null, 2));
  console.log('Saved to scratch/jongno_official_kostat.json');
} else {
  console.log('Jongno not found. Available names:');
  geo.features.forEach((f) => console.log(f.properties));
}
