const fs = require('fs');
const zlib = require('zlib');
const { VectorTile } = require('@mapbox/vector-tile');
const Pbf = require('pbf');

const tileBuffer = fs.readFileSync('public/tiles/planet/14/13970/6342.pbf');
// Decompress if gzip
let rawBuffer;
try {
  rawBuffer = zlib.gunzipSync(tileBuffer);
} catch (e) {
  rawBuffer = tileBuffer;
}

const tile = new VectorTile(new Pbf(rawBuffer));
console.log('Layers in tile:', Object.keys(tile.layers));

const trans = tile.layers.transportation;
if (trans) {
  console.log('transportation features count:', trans.length);
  const railFeatures = [];
  for (let i = 0; i < trans.length; i++) {
    const f = trans.feature(i);
    if (f.properties.class === 'rail' || f.properties.subclass === 'subway') {
      railFeatures.push(f.properties);
    }
  }
  console.log('Rail/subway features in tile:', railFeatures.length);
  console.log('Sample rail properties:', railFeatures.slice(0, 10));
}
