import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/vuski/admdongkor/master/ver20230101/HangJeongDong_ver20230101.geojson';

console.log('Downloading vuski 2023 HangJeongDong...');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const geo = JSON.parse(data);
      console.log('Total features:', geo.features.length);
      const jongno = geo.features.filter(f => f.properties.sgg && f.properties.sgg.includes('종로구'));
      console.log('Jongno features in vuski:', jongno.length);
      if (jongno.length > 0) {
        fs.writeFileSync('scratch/jongno_vuski.json', JSON.stringify(jongno, null, 2));
        let allLats = [];
        let allLons = [];
        jongno.forEach(d => {
          const geom = d.geometry;
          const rings = geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat();
          rings.forEach(ring => {
            ring.forEach(pt => {
              allLons.push(pt[0]);
              allLats.push(pt[1]);
            });
          });
        });
        console.log('Vuski Jongno Bounds:');
        console.log('Min Lat:', Math.min(...allLats), 'Max Lat:', Math.max(...allLats));
        console.log('Min Lon:', Math.min(...allLons), 'Max Lon:', Math.max(...allLons));
      }
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', err => console.error(err));
