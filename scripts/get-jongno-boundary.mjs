import https from 'https';
import fs from 'fs';

const query = `
[out:json][timeout:30];
relation["name"="종로구"]["admin_level"="8"];
out geom;
`;

const postData = 'data=' + encodeURIComponent(query);

const options = {
  hostname: 'overpass.kumi.systems',
  path: '/api/interpreter',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'JongnoAdminBoundary/1.0 (contact@example.com)',
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Elements count:', json.elements.length);
      const rel = json.elements.find((e) => e.tags && e.tags.name === '종로구');
      if (!rel) {
        console.error('No Jongno-gu relation found!');
        return;
      }
      console.log('Tags:', rel.tags);
      console.log('Members count:', rel.members.length);

      fs.writeFileSync('scratch/jongno_osm_raw.json', JSON.stringify(rel, null, 2));
      console.log('Saved to scratch/jongno_osm_raw.json');
    } catch (e) {
      console.error(e.message, data.slice(0, 300));
    }
  });
}).on('error', (err) => console.error(err));

req.write(postData);
req.end();
console.log('Sent request to Overpass API...');
