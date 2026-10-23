const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

// Let's check zoom 14 tiles across Han river
// Let's find names of the bridges in transportation_name across Han River tiles
// Han River covers tiles 13966 ~ 13972, y: 6345 ~ 6348
const bridgeNames = ['양화대교', '서강대교', '마포대교', '원효대교', '한강대교', '동작대교', '반포대교', '한남대교', '동호대교', '성수대교', '잠실대교', '청담대교', '영동대교'];

for (let x = 13966; x <= 13972; x++) {
  for (let y = 6345; y <= 6348; y++) {
    const p = `public/tiles/planet/14/${x}/${y}.pbf`;
    if (!fs.existsSync(p)) continue;
    const t = new VectorTile(new PbfReader(fs.readFileSync(p)));
    const tn = t.layers.transportation_name;
    if (tn) {
      for (let i = 0; i < tn.length; i++) {
        const feat = tn.feature(i);
        const name = feat.properties['name:ko'] || feat.properties.name;
        if (bridgeNames.includes(name)) {
          console.log(name, 'class:', feat.properties.class, 'network:', feat.properties.network, 'ref:', feat.properties.ref);
        }
      }
    }
  }
}
