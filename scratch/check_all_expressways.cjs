const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

['public/tiles/planet/11/1745/792.pbf', 'public/tiles/planet/11/1746/792.pbf', 'public/tiles/planet/11/1745/793.pbf', 'public/tiles/planet/11/1746/793.pbf'].forEach(tp => {
  if (!fs.existsSync(tp)) return;
  const t = new VectorTile(new PbfReader(fs.readFileSync(tp)));
  const tLayer = t.layers.transportation;
  console.log('=== In', tp);
  const expresswayClasses = {};
  for (let i = 0; i < tLayer.length; i++) {
    const f = tLayer.feature(i);
    const p = f.properties;
    if (p.expressway) {
      expresswayClasses[`${p.class}_expressway=${p.expressway}`] = (expresswayClasses[`${p.class}_expressway=${p.expressway}`] || 0) + 1;
    }
  }
  console.log(expresswayClasses);
});
