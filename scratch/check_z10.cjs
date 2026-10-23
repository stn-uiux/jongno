const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

const tilePath = 'public/tiles/planet/10/872/396.pbf';
const buffer = fs.readFileSync(tilePath);
const tile = new VectorTile(new PbfReader(buffer));
if (tile.layers.transportation) {
  const layer = tile.layers.transportation;
  const classes = new Set();
  const trunkNames = new Set();
  const primaryNames = new Set();
  for (let i = 0; i < layer.length; i++) {
    const feat = layer.feature(i);
    classes.add(feat.properties.class);
    if (feat.properties.class === 'trunk') trunkNames.add(feat.properties.name || feat.properties.name_ko);
    if (feat.properties.class === 'primary') primaryNames.add(feat.properties.name || feat.properties.name_ko);
  }
  console.log('Classes in zoom 10:', Array.from(classes));
  console.log('Trunk names (first 10):', Array.from(trunkNames).slice(0, 10));
  console.log('Primary names (first 10):', Array.from(primaryNames).slice(0, 10));
}
