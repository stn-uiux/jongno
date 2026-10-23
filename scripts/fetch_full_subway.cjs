const fs = require('fs');

const SERVERS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
];

// Query exact route relations for the 7 lines:
// 1호선, 2호선, 3호선, 4호선, 5호선, 6호선, 우이신설선
// Bounding box: 37.48,126.85,37.66,127.10
const BBOX = '37.48,126.85,37.66,127.10';

const query = `
[out:json][timeout:50];
(
  relation["route"="subway"]["ref"="1"](${BBOX});
  relation["route"="subway"]["ref"="2"](${BBOX});
  relation["route"="subway"]["ref"="3"](${BBOX});
  relation["route"="subway"]["ref"="4"](${BBOX});
  relation["route"="subway"]["ref"="5"](${BBOX});
  relation["route"="subway"]["ref"="6"](${BBOX});
  relation["route"="subway"]["ref"="UI"](${BBOX});
  relation["route"="light_rail"]["name"~"우이신설"](${BBOX});
);
out body;
>;
out skel qt;
`.trim();

async function main() {
  console.log('Querying 7 subway lines route relations...');
  let data = null;

  for (const server of SERVERS) {
    try {
      console.log(`Trying ${server}...`);
      const res = await fetch(server, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'SeoulSubwayFullBuilder/1.0',
        },
        body: 'data=' + encodeURIComponent(query),
      });
      if (res.ok) {
        data = await res.json();
        console.log(`Success on ${server}! Received ${data.elements.length} elements.`);
        break;
      } else {
        console.warn(`${server} returned ${res.status}`);
      }
    } catch (e) {
      console.warn(`${server} error: ${e.message}`);
    }
  }

  if (!data) throw new Error('All servers failed');

  fs.writeFileSync('scratch/overpass_subway_seoul_full.json', JSON.stringify(data));
  console.log('Saved to scratch/overpass_subway_seoul_full.json');
}

main().catch(console.error);
