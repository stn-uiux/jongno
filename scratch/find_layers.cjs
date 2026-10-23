const fs = require('fs');
const content = fs.readFileSync('src/styles/mapDarkTheme.ts', 'utf8');

const targetLayers = [
  'tunnel_motorway_inner',
  'highway_major_inner',
  'highway_major_subtle',
  'highway_motorway_bridge_inner'
];

targetLayers.forEach(id => {
  const marker = '"id": "' + id + '"';
  const start = content.indexOf(marker);
  if (start !== -1) {
    const end = content.indexOf('},', start + 300);
    console.log(`=== ${id} ===`);
    console.log(content.substring(start, end + 2));
  }
});
