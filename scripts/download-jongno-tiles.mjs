import fs from 'fs';
import path from 'path';
import https from 'https';

// Bounding box covering Jongno-gu, Seoul center and outer buffer
const BOUNDS = {
  minLat: 37.450,
  maxLat: 37.710,
  minLon: 126.830,
  maxLon: 127.140,
};

const args = process.argv.slice(2);
const MIN_ZOOM = args[0] ? parseInt(args[0], 10) : 11;
const MAX_ZOOM = args[1] ? parseInt(args[1], 10) : 16;

function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

const tilesToDownload = [];

for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
  const minX = lon2tile(BOUNDS.minLon, z);
  const maxX = lon2tile(BOUNDS.maxLon, z);
  const minY = lat2tile(BOUNDS.maxLat, z);
  const maxY = lat2tile(BOUNDS.minLat, z);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      tilesToDownload.push({ z, x, y });
    }
  }
}

console.log(`[Jongno Tile Downloader] Found ${tilesToDownload.length} tiles to download (Zoom ${MIN_ZOOM}~${MAX_ZOOM})`);

const OUT_DIR = path.resolve('public', 'tiles');

function fetchBuffer(url, referer) {
  return new Promise((resolve) => {
    const req = https.get(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Referer': referer,
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      },
      (res) => {
        if (res.statusCode !== 200 || res.headers['x-blocked']) {
          res.resume();
          return resolve(null);
        }

        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          // Blocked placeholder warning image is exactly 6987 bytes
          if (buf.length === 6987) return resolve(null);
          // Check PNG magic bytes
          if (buf.length < 500 || buf[0] !== 0x89 || buf[1] !== 0x50) return resolve(null);
          resolve(buf);
        });
      }
    );

    req.on('error', () => resolve(null));
    req.setTimeout(8000, () => {
      req.destroy();
      resolve(null);
    });
  });
}

async function downloadTile(tile) {
  const { z, x, y } = tile;
  const dir = path.join(OUT_DIR, String(z), String(x));
  const filePath = path.join(dir, `${y}.png`);

  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    // If already downloaded and valid (not the 6987-byte blocked warning)
    if (stat.size > 8000 && stat.size !== 6987) {
      return 'skipped';
    }
    try {
      fs.unlinkSync(filePath);
    } catch {}
  }

  fs.mkdirSync(dir, { recursive: true });

  // 1. Try Primary OSM with proper browser headers
  let buf = await fetchBuffer(
    `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
    'https://www.openstreetmap.org/'
  );

  // 2. Fallback to OpenStreetMap DE mirror (Carto CSS standard style, unblocked)
  if (!buf) {
    buf = await fetchBuffer(
      `https://tile.openstreetmap.de/${z}/${x}/${y}.png`,
      'https://www.openstreetmap.de/'
    );
  }

  // 3. Fallback to OpenStreetMap FR mirror
  if (!buf) {
    buf = await fetchBuffer(
      `https://a.tile.openstreetmap.fr/osmfr/${z}/${x}/${y}.png`,
      'https://www.openstreetmap.fr/'
    );
  }

  if (buf && buf.length > 500 && buf.length !== 6987) {
    fs.writeFileSync(filePath, buf);
    return 'downloaded';
  }

  return 'error';
}

async function run() {
  const CONCURRENCY = 4;
  let currentIndex = 0;
  let downloadedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  async function worker() {
    while (currentIndex < tilesToDownload.length) {
      const idx = currentIndex++;
      const tile = tilesToDownload[idx];
      const result = await downloadTile(tile);

      if (result === 'downloaded') downloadedCount++;
      else if (result === 'skipped') skippedCount++;
      else errorCount++;

      if ((idx + 1) % 25 === 0 || idx + 1 === tilesToDownload.length) {
        const percent = (((idx + 1) / tilesToDownload.length) * 100).toFixed(1);
        process.stdout.write(
          `\rProgress: [${idx + 1}/${tilesToDownload.length}] (${percent}%) | Downloaded: ${downloadedCount} | Skipped: ${skippedCount} | Errors: ${errorCount}`
        );
      }

      await new Promise((r) => setTimeout(r, 40));
    }
  }

  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  console.log('\n[Jongno Tile Downloader] Download complete!');
  console.log(`Summary: Downloaded: ${downloadedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
}

run();
