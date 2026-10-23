const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

// Let's inspect all Han River crossing features at zoom 11, 12, 13, 14
// What properties do they have?
// Specifically:
// 1. Bridges across Han River: do they have brunnel: 'bridge'?
// 2. What about Gukhoe-daero / Sinwol-Yeoui?

const tileZ11_1 = 'public/tiles/planet/11/1745/793.pbf';
const tileZ11_2 = 'public/tiles/planet/11/1746/793.pbf';

[tileZ11_1, tileZ11_2].forEach(tp => {
  const t = new VectorTile(new PbfReader(fs.readFileSync(tp)));
  const layer = t.layers.transportation;
  console.log('=== Checking', tp);
  for (let i = 0; i < layer.length; i++) {
    const f = layer.feature(i);
    const p = f.properties;
    // Check if it's primary or trunk or motorway
    if (['motorway', 'trunk', 'primary'].includes(p.class)) {
      // If it has brunnel: 'bridge'
      if (p.brunnel === 'bridge') {
        console.log('Bridge:', JSON.stringify(p));
      }
    }
  }
});
