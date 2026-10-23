import https from 'https';
import fs from 'fs';
import path from 'path';

// Bounding box for Jongno-gu and surrounding subway network
// South: 37.545 (City Hall / Euljiro / DDP), North: 37.615 (Hyehwa / Hansung Univ / Pyeongchang)
// West: 126.945 (Dongnimmun / Seodaemun), East: 127.035 (Sinseol-dong / Changsin / Dongmyo)
const BBOX = '37.545,126.940,37.620,127.035';

// Optimized Overpass query: gets all subway tracks (ways with railway=subway) and all subway stations with coordinates
const query = `
[out:json][timeout:45];
(
  node["railway"="station"](${BBOX});
  way["railway"="subway"](${BBOX});
  way["railway"="light_rail"](${BBOX});
);
(._;>;);
out body qt;
`.trim();

const SERVERS = [
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

console.log('[Subway Data Builder] Fetching real OSM subway spatial data from Overpass API...');
const postData = 'data=' + encodeURIComponent(query);

function executeQueryOnServer(serverUrl) {
  return new Promise((resolve, reject) => {
    console.log(`[Subway Data Builder] Trying ${serverUrl}...`);
    const req = https.request(
      serverUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) JongnoSubwayGeoJson/1.0',
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`Server returned HTTP ${res.statusCode}`));
        }
        let raw = '';
        res.on('data', (d) => (raw += d));
        res.on('end', () => {
          try {
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(25000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.write(postData);
    req.end();
  });
}

async function executeQuery() {
  for (const s of SERVERS) {
    try {
      return await executeQueryOnServer(s);
    } catch (e) {
      console.warn(`[Subway Data Builder] Failed on ${s}: ${e.message}`);
    }
  }
  throw new Error('All Overpass servers failed');
}

async function run() {
  try {
    const data = await executeQuery();
    console.log(`[Subway Data Builder] Fetched ${data.elements.length} elements from Overpass.`);
    fs.mkdirSync('scratch', { recursive: true });
    fs.writeFileSync('scratch/overpass_subway_raw.json', JSON.stringify(data, null, 2));
    console.log('[Subway Data Builder] Saved raw data to scratch/overpass_subway_raw.json');
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

run();
