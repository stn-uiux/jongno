import fs from 'fs';

function dist(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.sqrt(dx * dx + dy * dy);
}

const MIN_LON = 126.80, MAX_LON = 127.15, MIN_LAT = 37.45, MAX_LAT = 37.72;

function chainSegments(segs) {
  if (segs.length === 0) return [];
  const chains = [];
  let remaining = segs.map((s) => [...s]);

  while (remaining.length > 0) {
    let currentChain = [...remaining.shift()];
    let extended = true;

    while (extended) {
      extended = false;
      const head = currentChain[0];
      const tail = currentChain[currentChain.length - 1];

      for (let i = 0; i < remaining.length; i++) {
        const seg = remaining[i];
        const segHead = seg[0];
        const segTail = seg[seg.length - 1];
        const THRESH = 0.002;

        if (dist(tail, segHead) < THRESH) {
          currentChain.push(...seg.slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (dist(tail, segTail) < THRESH) {
          currentChain.push(...[...seg].reverse().slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (dist(head, segTail) < THRESH) {
          currentChain.unshift(...seg.slice(0, -1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (dist(head, segHead) < THRESH) {
          currentChain.unshift(...[...seg].reverse().slice(0, -1));
          remaining.splice(i, 1);
          extended = true;
          break;
        }
      }
    }
    chains.push(currentChain);
  }

  chains.sort((a, b) => b.length - a.length);
  return chains;
}

async function main() {
  const linesRes = await fetch(
    'https://raw.githubusercontent.com/matassp/seoul-isochrone/main/public/data/lines.geojson'
  );
  const linesData = await linesRes.json();

  const configs = [
    { id: '1', line: '1', name: '수도권 전철 1호선', shortName: '1호선', color: '#303B94' },
    { id: '2', line: '2', name: '서울 지하철 2호선', shortName: '2호선', color: '#4AB34B' },
    { id: '3', line: '3', name: '수도권 전철 3호선', shortName: '3호선', color: '#EE7B3F' },
    { id: '4', line: '4', name: '수도권 전철 4호선', shortName: '4호선', color: '#499CDC' },
    { id: '5', line: '5', name: '수도권 전철 5호선', shortName: '5호선', color: '#843ED9' },
    { id: '6', line: '6', name: '서울 지하철 6호선', shortName: '6호선', color: '#AE541A' },
  ];

  const features = [];

  for (const cfg of configs) {
    const src = linesData.features.find((f) => f.properties.lineId === cfg.id);
    if (!src) continue;

    const inViewSegs = src.geometry.coordinates.filter((seg) =>
      seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT)
    );

    const chains = chainSegments(inViewSegs);

    let selectedCoords;
    if (cfg.id === '2') {
      // For Line 2: Chain 0 and Chain 2 (loop + branch), guaranteed single line each
      // Let's connect them or keep as MultiLineString of non-overlapping chains
      selectedCoords = [chains[0], chains[2]].filter(Boolean);
    } else if (cfg.id === '5') {
      // Main trunk + branch
      selectedCoords = [chains[0], chains[1]].filter(Boolean);
    } else {
      // Exactly 1 single line (단선 LineString)
      selectedCoords = chains[0];
    }

    const isSingle = !Array.isArray(selectedCoords[0][0]);
    features.push({
      type: 'Feature',
      id: `LINE-${cfg.id}`,
      properties: {
        id: `LINE-${cfg.id}`,
        line: cfg.line,
        name: cfg.name,
        shortName: cfg.shortName,
        color: cfg.color,
        isSingleTrack: true,
      },
      geometry: {
        type: isSingle ? 'LineString' : 'MultiLineString',
        coordinates: selectedCoords,
      },
    });
  }

  // Load existing Ui-Sinseol as single LineString
  const existingLines = JSON.parse(fs.readFileSync('src/data/subwayLines.json', 'utf8'));
  const uiFeature = existingLines.features.find((f) => f.properties.shortName === '우이신설선');
  if (uiFeature) {
    const coords = uiFeature.geometry.type === 'LineString'
      ? uiFeature.geometry.coordinates
      : (Array.isArray(uiFeature.geometry.coordinates[0][0]) ? uiFeature.geometry.coordinates[0] : uiFeature.geometry.coordinates);

    features.push({
      type: 'Feature',
      id: 'LINE-UI',
      properties: {
        id: 'LINE-UI',
        line: 'UI',
        name: '우이신설선',
        shortName: '우이신설선',
        color: '#BABA46',
        isSingleTrack: true,
      },
      geometry: {
        type: 'LineString',
        coordinates: coords,
      },
    });
  }

  const outGeoJson = {
    type: 'FeatureCollection',
    name: 'SeoulSubwayLines_CleanSingleLine',
    features,
  };

  fs.writeFileSync('src/data/subwayLines.json', JSON.stringify(outGeoJson));
  fs.writeFileSync('public/geojson/subway-lines.geojson', JSON.stringify(outGeoJson, null, 2));
  console.log('Successfully saved clean 1줄 subway lines!');
}

main().catch(console.error);
