import fs from 'fs';

const lines = JSON.parse(fs.readFileSync('public/geojson/subway-lines.geojson', 'utf-8'));
const stations = JSON.parse(fs.readFileSync('public/geojson/subway-stations.geojson', 'utf-8'));

console.log('=== SUBWAY LINES VALIDATION ===');
lines.features.forEach((f) => {
  const isMulti = f.geometry.type === 'MultiLineString';
  const totalPts = isMulti
    ? f.geometry.coordinates.reduce((sum, s) => sum + s.length, 0)
    : f.geometry.coordinates.length;
  console.log(
    `${f.properties.shortName} | Type: ${f.geometry.type} | Color: ${f.properties.color} | Total pts: ${totalPts}`
  );
});

console.log('\n=== KEY JONGNO STATIONS VALIDATION ===');
const keyNames = [
  '광화문',
  '종각',
  '종로3가',
  '종로5가',
  '경복궁',
  '안국',
  '혜화',
  '동대문',
  '동묘앞',
  '창신',
  '독립문',
  '서대문',
  '시청',
  '을지로입구',
  '을지로3가',
  '동대문역사문화공원',
  '신설동',
];

keyNames.forEach((k) => {
  const stn = stations.features.find((s) => s.properties.cleanName === k);
  if (stn) {
    console.log(
      `✓ ${k}역: [${stn.geometry.coordinates.join(', ')}] | Lines: [${stn.properties.lines.join(
        ', '
      )}] | Transfer: ${stn.properties.isTransfer}`
    );
  } else {
    console.log(`✗ MISSING: ${k}`);
  }
});

console.log('\nTotal stations count:', stations.features.length);
console.log('Jongno stations count:', stations.features.filter((f) => f.properties.inJongno).length);
console.log('Transfer stations count:', stations.features.filter((f) => f.properties.isTransfer).length);
