const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

// Let's find tiles covering Mapo Bridge / Hangang Bridge and Gukhoe-daero / Sinwol
// Seoul bounds: roughly 37.5 ~ 37.6 lat, 126.8 ~ 127.1 lon
// Let's convert lat/lon to tile coordinates at zoom 12 or 14

function lon2tile(lon, zoom) {
  return Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
}
function lat2tile(lat, zoom) {
  return Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
}

// Mapo Bridge: ~ 37.535, 126.936
// Hangang Bridge: ~ 37.517, 126.958
// Sinwol / Gukhoe-daero: ~ 37.530, 126.850

const zoom = 14;
console.log('Mapo bridge tile z14:', lon2tile(126.936, 14), lat2tile(37.535, 14));
console.log('Hangang bridge tile z14:', lon2tile(126.958, 14), lat2tile(37.517, 14));
console.log('Sinwol tile z14:', lon2tile(126.850, 14), lat2tile(37.530, 14));
