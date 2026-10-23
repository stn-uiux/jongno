const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

const t = new VectorTile(new PbfReader(fs.readFileSync('public/tiles/planet/11/1745/793.pbf')));
const tnLayer = t.layers.transportation_name;
for (let i = 0; i < tnLayer.length; i++) {
  const p = tnLayer.feature(i).properties;
  console.log('name:', p['name:ko'] || p.name, 'ref:', p.ref, 'class:', p.class, 'network:', p.network);
}
