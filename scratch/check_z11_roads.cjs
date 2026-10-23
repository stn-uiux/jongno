const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

function checkZ11(tilePath) {
  const buffer = fs.readFileSync(tilePath);
  const tile = new VectorTile(new PbfReader(buffer));
  const tLayer = tile.layers.transportation;
  const tnLayer = tile.layers.transportation_name;

  console.log('=== Checking', tilePath);
  if (tnLayer) {
    for (let i = 0; i < tnLayer.length; i++) {
      const p = tnLayer.feature(i).properties;
      console.log('name:', p['name:ko'] || p.name, 'ref:', p.ref, 'class:', p.class, 'network:', p.network, 'expressway:', p.expressway);
    }
  }
}

checkZ11('public/tiles/planet/11/1745/793.pbf');
checkZ11('public/tiles/planet/11/1746/793.pbf');
