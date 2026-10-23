import https from 'https';

// Query for subway stations and subway line ways/relations in Seoul Jongno and surrounding area
// Bounding box: south=37.545, west=126.940, north=37.620, east=127.035
const overpassQuery = `
[out:json][timeout:60];
(
  // Subway stations
  node["railway"="station"]["station"="subway"](37.545,126.940,37.620,127.035);
  node["railway"="station"](37.545,126.940,37.620,127.035);
  
  // Subway lines (ways with railway=subway)
  way["railway"="subway"](37.545,126.940,37.620,127.035);
);
out body;
>;
out skel qt;
`.trim();

console.log('Sending query to Overpass API...');

const postData = 'data=' + encodeURIComponent(overpassQuery);

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
        console.log('Elements count:', json.elements?.length);
        const stations = json.elements.filter(
          (e) => e.type === 'node' && (e.tags?.railway === 'station' || e.tags?.station === 'subway')
        );
        const ways = json.elements.filter((e) => e.type === 'way' && e.tags?.railway === 'subway');
        console.log('Stations count:', stations.length);
        console.log('Subway ways count:', ways.length);
        console.log(
          'Sample stations:',
          stations.slice(0, 10).map((s) => s.tags?.name || s.tags?.['name:ko'])
        );
      } catch (err) {
        console.error('JSON parse error:', err.message, raw.slice(0, 300));
      }
    });
  }
);

req.on('error', (e) => console.error('Req error:', e.message));
req.write(postData);
req.end();
