import https from 'https';
import fs from 'fs';

const url = 'https://raw.githubusercontent.com/raqoon886/Local_HangJeongDong/master/hangjeongdong_%EC%84%9C%EC%9A%B8%ED%8A%B9%EB%B3%84%EC%8B%9C.geojson';

console.log('Downloading Seoul hangjeongdong from raqoon886...');

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const geo = JSON.parse(data);
      console.log('Total features:', geo.features.length);
      // Filter features that belong to 종로구 (adm_cd2 starting with 11110)
      const jongnoFeatures = geo.features.filter(f => {
        const name = f.properties.adm_nm || f.properties.sggnm || f.properties.temp || '';
        const cd = f.properties.adm_cd2 || f.properties.adm_cd || '';
        return name.includes('종로구') || cd.startsWith('11110');
      });
      console.log('Jongno dong features count:', jongnoFeatures.length);
      jongnoFeatures.forEach(f => console.log(f.properties.adm_nm || f.properties));
      fs.writeFileSync('scratch/jongno_dongs.json', JSON.stringify(jongnoFeatures, null, 2));
    } catch (e) {
      console.error(e.message);
    }
  });
}).on('error', err => console.error(err));
