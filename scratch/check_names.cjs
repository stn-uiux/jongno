const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

function checkTileLayers(tilePath) {
  const buffer = fs.readFileSync(tilePath);
  const tile = new VectorTile(new PbfReader(buffer));
  console.log('Layers in', tilePath, Object.keys(tile.layers));
  
  if (tile.layers.transportation_name) {
    const layer = tile.layers.transportation_name;
    console.log('transportation_name count:', layer.length);
    for (let i = 0; i < layer.length; i++) {
      const feat = layer.feature(i);
      const p = feat.properties;
      if (p.name || p['name:ko'] || p.ref) {
        console.log('name:', p['name:ko'] || p.name, 'ref:', p.ref, 'class:', p.class, 'network:', p.network);
      }
    }
  }
}

checkTileLayers('public/tiles/planet/14/13965/6346.pbf');
