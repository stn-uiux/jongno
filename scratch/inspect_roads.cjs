const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

function inspectTile(tilePath) {
  const buffer = fs.readFileSync(tilePath);
  const tile = new VectorTile(new PbfReader(buffer));
  const tLayer = tile.layers.transportation;
  if (!tLayer) return [];

  const results = [];
  for (let i = 0; i < tLayer.length; i++) {
    const feat = tLayer.feature(i);
    const p = feat.properties;
    results.push(p);
  }
  return results;
}

// 1. Inspect Mapo Bridge & surrounding bridges (13968/6346)
console.log('=== Mapo Bridge (13968/6346) ===');
const mapoRoads = inspectTile('public/tiles/planet/14/13968/6346.pbf');
const bridgeRoads = mapoRoads.filter(r => r.brunnel === 'bridge' || (r.name && r.name.includes('대교')) || (r.name_ko && r.name_ko.includes('대교')));
console.log('Bridge count:', bridgeRoads.length);
bridgeRoads.forEach(r => {
  console.log(JSON.stringify(r));
});

// Also all major roads in 13968/6346
console.log('Unique classes in Mapo tile:', [...new Set(mapoRoads.map(r => r.class))]);

// 2. Inspect Sinwol / Gukhoe-daero (13965/6346)
console.log('=== Sinwol / Gukhoe-daero (13965/6346) ===');
const sinwolRoads = inspectTile('public/tiles/planet/14/13965/6346.pbf');
const target120 = sinwolRoads.filter(r => (r.ref && r.ref.includes('120')) || (r.name && (r.name.includes('국회') || r.name.includes('경인') || r.name.includes('신월'))) || (r.name_ko && (r.name_ko.includes('국회') || r.name_ko.includes('경인') || r.name_ko.includes('신월'))));
console.log('Target 120 / Sinwol roads:');
target120.forEach(r => console.log(JSON.stringify(r)));

console.log('All roads with ref in Sinwol:');
sinwolRoads.filter(r => r.ref).forEach(r => console.log(JSON.stringify(r)));
