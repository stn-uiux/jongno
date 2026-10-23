import https from 'https';
import fs from 'fs';

// Working query that succeeded with 2,295 elements
const query = `
[out:json][timeout:60];
(
  node["railway"="station"](37.545,126.940,37.620,127.035);
  node["station"="subway"](37.545,126.940,37.620,127.035);
  way["railway"="subway"](37.545,126.940,37.620,127.035);
  way["railway"="light_rail"](37.545,126.940,37.620,127.035);
);
out body;
>;
out skel qt;
`.trim();

console.log('Sending query to Overpass...');
const postData = 'data=' + encodeURIComponent(query);

const req = https.request(
  'https://overpass-api.de/api/interpreter',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'JongnoSubwayGeoJsonBuilder/1.0',
    },
  },
  (res) => {
    console.log('Status:', res.statusCode);
    let raw = '';
    res.on('data', (chunk) => (raw += chunk));
    res.on('end', () => {
      console.log('Received bytes:', raw.length);
      try {
        const json = JSON.parse(raw);
        console.log('Total elements:', json.elements?.length);
        fs.mkdirSync('scratch', { recursive: true });
        fs.writeFileSync('scratch/overpass_subway_raw.json', raw);
        console.log('Saved to scratch/overpass_subway_raw.json');
      } catch (err) {
        console.error('Parse error:', err.message);
      }
    });
  }
);

req.on('error', (e) => console.error('Req error:', e.message));
req.write(postData);
req.end();
