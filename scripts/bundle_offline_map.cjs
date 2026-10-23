const fs = require('fs');
const path = require('path');

// Helper to convert lat/lng to tile coordinate
function lon2tile(lon, zoom) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}
function lat2tile(lat, zoom) {
  return Math.floor(
    ((1 -
      Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

const PUBLIC_DIR = path.resolve(__dirname, '..', 'public');
const TILES_DIR = path.join(PUBLIC_DIR, 'tiles', 'planet');
const FONTS_DIR = path.join(PUBLIC_DIR, 'fonts');
const SPRITES_DIR = path.join(PUBLIC_DIR, 'sprites');
const STYLES_DIR = path.join(PUBLIC_DIR, 'styles');

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
    return true; // Already downloaded
  }
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  try {
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return false;
      console.warn(`Failed ${url}: ${res.status}`);
      return false;
    }
    const arrayBuffer = await res.arrayBuffer();
    fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
    return true;
  } catch (err) {
    console.error(`Error downloading ${url}:`, err.message);
    return false;
  }
}

// 1. Download Sprites
async function bundleSprites() {
  console.log('Downloading sprites...');
  const files = ['ofm.json', 'ofm.png', 'ofm@2x.json', 'ofm@2x.png'];
  for (const f of files) {
    const url = `https://tiles.openfreemap.org/sprites/ofm_f384/${f}`;
    const dest = path.join(SPRITES_DIR, f);
    await downloadFile(url, dest);
  }
  console.log('Sprites downloaded.');
}

// 2. Download Fonts (ASCII + Hangul syllables for Noto Sans Regular, Bold, Italic)
async function bundleFonts() {
  console.log('Downloading font glyphs (ASCII + Hangul syllables)...');
  const fontstacks = ['Noto Sans Regular', 'Noto Sans Bold', 'Noto Sans Italic'];

  // Ranges: 0-255 (ASCII / basic Latin) + 44032 to 55295 (Hangul Syllables)
  const ranges = ['0-255'];
  for (let start = 44032; start < 55296; start += 256) {
    ranges.push(`${start}-${start + 255}`);
  }

  for (const font of fontstacks) {
    console.log(`Downloading fontstack: ${font} (${ranges.length} ranges)...`);
    for (const r of ranges) {
      const url = `https://tiles.openfreemap.org/fonts/${encodeURIComponent(font)}/${r}.pbf`;
      const dest = path.join(FONTS_DIR, font, `${r}.pbf`);
      await downloadFile(url, dest);
    }
  }
  console.log('Fonts downloaded.');
}

// 3. Download Vector Tiles covering Jongno-gu and surrounding Seoul
async function bundleVectorTiles() {
  console.log('Discovering active OpenFreeMap planet endpoint...');
  const planetJsonRes = await fetch('https://tiles.openfreemap.org/planet');
  const planetJson = await planetJsonRes.json();
  const tileTemplate = planetJson.tiles[0]; // e.g. https://tiles.openfreemap.org/planet/20261018_080001_pt/{z}/{x}/{y}.pbf
  console.log('Planet tile template:', tileTemplate);

  console.log('Downloading vector tiles for Seoul / Jongno-gu...');
  let totalDownloaded = 0;

  // Zoom 10 to 14 covering Jongno-gu and greater Seoul
  for (let z = 10; z <= 14; z++) {
    const minX = lon2tile(126.85, z);
    const maxX = lon2tile(127.10, z);
    const minY = lat2tile(37.68, z);
    const maxY = lat2tile(37.48, z);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const url = tileTemplate
          .replace('{z}', z)
          .replace('{x}', x)
          .replace('{y}', y);
        const dest = path.join(TILES_DIR, String(z), String(x), `${y}.pbf`);
        const ok = await downloadFile(url, dest);
        if (ok) totalDownloaded++;
      }
    }
  }
  console.log(`Vector tiles bundled: ${totalDownloaded} tiles.`);
}

// 4. Update bright.json and positron.json to reference local tiles, local fonts, and local sprites
async function localizeStyles() {
  console.log('Updating style JSON files to 100% offline local endpoints...');
  const styles = ['bright', 'positron'];

  for (const styleName of styles) {
    const origUrl = `https://tiles.openfreemap.org/styles/${styleName}`;
    const res = await fetch(origUrl);
    const style = await res.json();

    // 1. Point source to local vector tiles
    style.sources = {
      openmaptiles: {
        type: 'vector',
        tiles: ['/tiles/planet/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14,
      },
    };

    // 2. Point glyphs to local fonts
    style.glyphs = '/fonts/{fontstack}/{range}.pbf';

    // 3. Point sprite to local sprites
    style.sprite = '/sprites/ofm';

    // 4. Remove any layers depending on natural_earth raster (which is only for low zoom global satellite)
    style.layers = style.layers.filter((l) => l.source !== 'ne2_shaded');

    // 5. Transform all label layers to Korean priority with zero Latin transliteration
    style.layers.forEach((l) => {
      if (l.layout && l.layout['text-field']) {
        const tfStr = JSON.stringify(l.layout['text-field']);
        if (
          tfStr.includes('name:nonlatin') ||
          tfStr.includes('name:latin') ||
          tfStr.includes('name_en')
        ) {
          l.layout['text-field'] = [
            'coalesce',
            ['get', 'name:ko'],
            ['get', 'name:nonlatin'],
            ['get', 'name'],
            ['get', 'name_en'],
          ];
        }
      }
    });

    if (!fs.existsSync(STYLES_DIR)) fs.mkdirSync(STYLES_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(STYLES_DIR, `${styleName}.json`),
      JSON.stringify(style, null, 2),
      'utf-8'
    );
    console.log(`${styleName}.json updated with local paths and pure Korean labels.`);
  }
}

async function main() {
  await bundleSprites();
  await bundleFonts();
  await bundleVectorTiles();
  await localizeStyles();
  console.log('=== OFFLINE BUNDLE COMPLETE ===');
}

main().catch(console.error);
