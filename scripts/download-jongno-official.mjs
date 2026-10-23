import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/southkorea/seoul-maps/master/kostat/2013/json/seoul_municipalities_geo_simple.json';
console.log('Downloading official Seoul municipalities GeoJSON...');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const geo = JSON.parse(data);
      console.log('Total features:', geo.features.length);
      const jongno = geo.features.find(f => f.properties.code === '11010' || f.properties.name === '종로구');
      if (jongno) {
        console.log('Jongno properties:', jongno.properties);
        const coords = jongno.geometry.coordinates[0];
        console.log('Total boundary points:', coords.length);
        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);
        console.log('Min Lat:', Math.min(...lats), 'Max Lat:', Math.max(...lats));
        console.log('Min Lng:', Math.min(...lngs), 'Max Lng:', Math.max(...lngs));
        fs.writeFileSync('scratch/jongno_kostat_full.json', JSON.stringify(jongno, null, 2));
        console.log('Saved to scratch/jongno_kostat_full.json');
      } else {
        console.error('Jongno not found!');
      }
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', err => console.error(err));
