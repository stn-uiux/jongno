const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

['public/tiles/planet/11/1745/792.pbf', 'public/tiles/planet/11/1745/793.pbf'].forEach(tp => {
  const t = new VectorTile(new PbfReader(fs.readFileSync(tp)));
  const tLayer = t.layers.transportation;
  for (let i = 0; i < tLayer.length; i++) {
    const f = tLayer.feature(i);
    const p = f.properties;
    if (p.class === 'primary' && p.expressway) {
      console.log(tp, JSON.stringify(p));
    }
  }
});
