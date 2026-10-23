const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

const t = new VectorTile(new PbfReader(fs.readFileSync('public/tiles/planet/11/1745/793.pbf')));
const tLayer = t.layers.transportation;

// Road 1 runs roughly from tile x: 100 to 1200, y: 700 to 900 in local tile coords
// Let's print all features in tLayer that are primary or trunk or motorway or construction
const seen = new Set();
for (let i = 0; i < tLayer.length; i++) {
  const f = tLayer.feature(i);
  const p = f.properties;
  const geom = f.loadGeometry();
  // Check if geom passes through y around 700~900
  let inY = false;
  for (const ring of geom) {
    for (const pt of ring) {
      if (pt.y > 600 && pt.y < 1100 && pt.x > 0 && pt.x < 1500) {
        inY = true;
        break;
      }
    }
  }
  if (inY && (p.class === 'primary' || p.class.includes('trunk') || p.class.includes('motorway'))) {
    const k = JSON.stringify(p);
    if (!seen.has(k)) {
      seen.add(k);
      console.log(k);
    }
  }
}
