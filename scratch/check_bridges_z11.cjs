const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

['public/tiles/planet/11/1745/793.pbf', 'public/tiles/planet/11/1746/793.pbf'].forEach(tilePath => {
  const t = new VectorTile(new PbfReader(fs.readFileSync(tilePath)));
  const tLayer = t.layers.transportation;
  console.log('=== In', tilePath);
  const classes = {};
  for (let i = 0; i < tLayer.length; i++) {
    const f = tLayer.feature(i);
    const p = f.properties;
    if (p.brunnel === 'bridge' || p.class === 'primary' || p.class === 'secondary') {
      const k = `${p.class}_${p.brunnel || 'none'}`;
      classes[k] = (classes[k] || 0) + 1;
    }
  }
  console.log(classes);
});
