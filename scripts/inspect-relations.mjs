import https from 'https';
import fs from 'fs';

// Query for subway relations (Line 1, 2, 3, 4, 5, 6, Ui-Sinseol) in Seoul
const query = `
[out:json][timeout:90];
(
  // Routes for major Seoul subway lines
  relation["route"="subway"]["network"~"수도권|서울|Seoul|교통공사|코레일"];
  relation["route"="subway"]["name"~"1호선|2호선|3호선|4호선|5호선|6호선|우이신설"];
);
out tags;
`.trim();

console.log('Querying subway relations...');
const postData = 'data=' + encodeURIComponent(query);

const req = https.request('https://overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData),
    'User-Agent': 'JongnoSubwayGeoJsonBuilder/1.0',
  }
}, res => {
  console.log('Status:', res.statusCode);
  let raw = '';
  res.on('data', d => raw += d);
  res.on('end', () => {
    try {
      const data = JSON.parse(raw);
      console.log('Found relations:', data.elements.length);
      data.elements.forEach(rel => {
        console.log(`ID: ${rel.id}, Name: ${rel.tags.name || rel.tags['name:ko']}, Ref: ${rel.tags.ref}, Color: ${rel.tags.colour}`);
      });
    } catch (e) {
      console.error(e.message);
    }
  });
});
req.write(postData);
req.end();
