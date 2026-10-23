const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

// Let's inspect tile 11/1745/793.pbf at the exact location of road "1" (around Sinwol / Kkachisan / Yeongdeungpo)
const t = new VectorTile(new PbfReader(fs.readFileSync('public/tiles/planet/11/1745/793.pbf')));
const tLayer = t.layers.transportation;
const tnLayer = t.layers.transportation_name;

console.log('=== All features in 11/1745/793 that have ref 120 or name containing 국회/경인/신월 ===');
for (let i = 0; i < tnLayer.length; i++) {
  const p = tnLayer.feature(i).properties;
  if (p.ref === '120' || (p.name && (p.name.includes('국회') || p.name.includes('경인') || p.name.includes('신월')))) {
    console.log('name:', p['name:ko'] || p.name, 'ref:', p.ref, 'class:', p.class, 'network:', p.network);
  }
}

// Now let's check transportation layer features that might correspond to this road
console.log('=== Transportation layer features with expressway: 1 or toll: 1 or class: trunk_construction ===');
for (let i = 0; i < tLayer.length; i++) {
  const p = tLayer.feature(i).properties;
  if (p.class === 'trunk_construction' || (p.class === 'primary' && p.expressway === 1) || p.toll === 1) {
    console.log(JSON.stringify(p));
  }
}
