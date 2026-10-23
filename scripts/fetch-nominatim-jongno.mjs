import https from 'https';
import fs from 'fs';

const url = 'https://nominatim.openstreetmap.org/search?q=%EC%A2%85%EB%A1%9C%EA%B5%AC&format=geojson&polygon_geojson=1';

const options = {
  headers: {
    'User-Agent': 'AntigravityJongnoMap/1.0 (admin@example.org)',
    'Accept-Language': 'ko,en',
  },
};

console.log('Fetching Jongno-gu boundary from Nominatim...');

https.get(url, options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const geo = JSON.parse(data);
      console.log('Features count:', geo.features.length);
      const feature = geo.features.find(f => f.properties.display_name.includes('종로구'));
      if (feature) {
        console.log('Found Jongno-gu in Nominatim!');
        console.log('Display name:', feature.properties.display_name);
        console.log('Geometry type:', feature.geometry.type);
        fs.writeFileSync('scratch/jongno_nominatim.json', JSON.stringify(feature, null, 2));
        
        let coords = feature.geometry.coordinates;
        if (feature.geometry.type === 'Polygon') coords = coords[0];
        else if (feature.geometry.type === 'MultiPolygon') coords = coords[0][0];
        
        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);
        console.log('Min Lat:', Math.min(...lats), 'Max Lat:', Math.max(...lats));
        console.log('Min Lng:', Math.min(...lngs), 'Max Lng:', Math.max(...lngs));
        console.log('Total points:', coords.length);
      } else {
        console.error('Not found in Nominatim');
      }
    } catch (e) {
      console.error(e.message, data.slice(0, 300));
    }
  });
}).on('error', err => console.error(err));
