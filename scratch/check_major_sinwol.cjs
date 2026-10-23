const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

function checkMajorRoads(tilePath) {
  const buffer = fs.readFileSync(tilePath);
  const tile = new VectorTile(new PbfReader(buffer));
  const tLayer = tile.layers.transportation;
  const tnLayer = tile.layers.transportation_name;

  console.log('--- transportation class: motorway / trunk / primary in', tilePath);
  for (let i = 0; i < tLayer.length; i++) {
    const p = tLayer.feature(i).properties;
    if (['motorway', 'trunk', 'primary'].includes(p.class)) {
      console.log('transportation:', JSON.stringify(p));
    }
  }

  if (tnLayer) {
    console.log('--- transportation_name major in', tilePath);
    for (let i = 0; i < tnLayer.length; i++) {
      const p = tnLayer.feature(i).properties;
      if (['motorway', 'trunk', 'primary'].includes(p.class) || (p.ref && ['120', '6'].includes(p.ref))) {
        console.log('name:', p['name:ko'] || p.name, 'ref:', p.ref, 'class:', p.class, 'network:', p.network);
      }
    }
  }
}

checkMajorRoads('public/tiles/planet/14/13965/6346.pbf');
