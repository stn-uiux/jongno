import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2018/json/skorea-municipalities-2018-geo.json';
console.log('Downloading 2018 South Korea Municipalities...');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const geo = JSON.parse(data);
      console.log('Features count:', geo.features.length);
      const jongno = geo.features.find(f => f.properties.code === '11010' || f.properties.name === '종로구');
      if (jongno) {
        console.log('Found 2018 Jongno:', jongno.properties);
        let coords = jongno.geometry.coordinates[0];
        console.log('Points count:', coords.length);
        const lats = coords.map(c => c[1]);
        const lngs = coords.map(c => c[0]);
        console.log('Min Lat:', Math.min(...lats), 'Max Lat:', Math.max(...lats));
        console.log('Min Lng:', Math.min(...lngs), 'Max Lng:', Math.max(...lngs));
        fs.writeFileSync('scratch/jongno_2018.json', JSON.stringify(jongno, null, 2));
      } else {
        console.log('Jongno not found');
      }
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', err => console.error(err));
