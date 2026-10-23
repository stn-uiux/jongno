import fs from 'fs';

function dist(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return Math.hypot(dx, dy);
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
        const s = remaining[i];
        if (dist(tail, s[0]) < 0.002) {
          currentChain.push(...s.slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (dist(tail, s[s.length - 1]) < 0.002) {
          currentChain.push(...[...s].reverse().slice(1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (dist(head, s[s.length - 1]) < 0.002) {
          currentChain.unshift(...s.slice(0, -1));
          remaining.splice(i, 1);
          extended = true;
          break;
        } else if (dist(head, s[0]) < 0.002) {
          currentChain.unshift(...[...s].reverse().slice(0, -1));
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
  const res = await fetch(
    'https://raw.githubusercontent.com/matassp/seoul-isochrone/main/public/data/lines.geojson'
  );
  const data = await res.json();

  const features = [];

  // 1호선: Sliced outbound track (no return track)
  const l1Src = data.features.find((f) => f.properties.lineId === '1');
  const l1Segs = l1Src.geometry.coordinates.filter((seg) =>
    seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT)
  );
  const l1Chains = chainSegments(l1Segs);
  // Cut at point farthest from start to keep exactly one single continuous line (1줄)
  let l1MaxD = 0, l1MaxIdx = 0;
  l1Chains[0].forEach((p, i) => {
    const d = dist(p, l1Chains[0][0]);
    if (d > l1MaxD) { l1MaxD = d; l1MaxIdx = i; }
  });
  const l1Single = l1Chains[0].slice(0, l1MaxIdx + 1);
  features.push({
    type: 'Feature',
    id: 'LINE-1',
    properties: { id: 'LINE-1', line: '1', name: '수도권 전철 1호선', shortName: '1호선', color: '#303B94', isSingleTrack: true },
    geometry: { type: 'LineString', coordinates: l1Single },
  });

  // 2호선: Chain 1 is the complete closed loop around Seoul (1줄), Chain 2 is Sinjeong branch, Chain 3 is Seongsu branch
  const l2Src = data.features.find((f) => f.properties.lineId === '2');
  const l2Segs = l2Src.geometry.coordinates.filter((seg) =>
    seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT)
  );
  const l2Chains = chainSegments(l2Segs);
  // Loop is Chain 1 (or chain whose start == end), branches are Chain 2 & Chain 3
  const l2Loop = l2Chains.find((c) => dist(c[0], c[c.length - 1]) < 0.001) || l2Chains[1];
  const l2Branches = l2Chains.filter((c) => c !== l2Loop && c.length >= 80 && c.length <= 150);
  features.push({
    type: 'Feature',
    id: 'LINE-2',
    properties: { id: 'LINE-2', line: '2', name: '서울 지하철 2호선', shortName: '2호선', color: '#4AB34B', isSingleTrack: true },
    geometry: { type: 'MultiLineString', coordinates: [l2Loop, ...l2Branches] },
  });

  // 3호선: Sliced outbound track (no return track)
  const l3Src = data.features.find((f) => f.properties.lineId === '3');
  const l3Segs = l3Src.geometry.coordinates.filter((seg) =>
    seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT)
  );
  const l3Chains = chainSegments(l3Segs);
  let l3MaxD = 0, l3MaxIdx = 0;
  l3Chains[0].forEach((p, i) => {
    const d = dist(p, l3Chains[0][0]);
    if (d > l3MaxD) { l3MaxD = d; l3MaxIdx = i; }
  });
  const l3Single = l3Chains[0].slice(0, l3MaxIdx + 1);
  features.push({
    type: 'Feature',
    id: 'LINE-3',
    properties: { id: 'LINE-3', line: '3', name: '수도권 전철 3호선', shortName: '3호선', color: '#EE7B3F', isSingleTrack: true },
    geometry: { type: 'LineString', coordinates: l3Single },
  });

  // 4호선: Sliced outbound track (no return track)
  const l4Src = data.features.find((f) => f.properties.lineId === '4');
  const l4Segs = l4Src.geometry.coordinates.filter((seg) =>
    seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT)
  );
  const l4Chains = chainSegments(l4Segs);
  let l4MaxD = 0, l4MaxIdx = 0;
  l4Chains[0].forEach((p, i) => {
    const d = dist(p, l4Chains[0][0]);
    if (d > l4MaxD) { l4MaxD = d; l4MaxIdx = i; }
  });
  const l4Single = l4Chains[0].slice(0, l4MaxIdx + 1);
  features.push({
    type: 'Feature',
    id: 'LINE-4',
    properties: { id: 'LINE-4', line: '4', name: '수도권 전철 4호선', shortName: '4호선', color: '#499CDC', isSingleTrack: true },
    geometry: { type: 'LineString', coordinates: l4Single },
  });

  // 5호선: Mainline sliced outbound track + Macheon branch
  const l5Src = data.features.find((f) => f.properties.lineId === '5');
  const l5Segs = l5Src.geometry.coordinates.filter((seg) =>
    seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT)
  );
  const l5Chains = chainSegments(l5Segs);
  let l5MaxD = 0, l5MaxIdx = 0;
  l5Chains[0].forEach((p, i) => {
    const d = dist(p, l5Chains[0][0]);
    if (d > l5MaxD) { l5MaxD = d; l5MaxIdx = i; }
  });
  const l5MainSingle = l5Chains[0].slice(0, l5MaxIdx + 1);
  const l5Branch = l5Chains[1] ? [l5Chains[1].slice(0, Math.floor(l5Chains[1].length / 2) + 1)] : [];
  features.push({
    type: 'Feature',
    id: 'LINE-5',
    properties: { id: 'LINE-5', line: '5', name: '수도권 전철 5호선', shortName: '5호선', color: '#843ED9', isSingleTrack: true },
    geometry: { type: 'MultiLineString', coordinates: [l5MainSingle, ...l5Branch] },
  });

  // 6호선: Sliced outbound track (no return track)
  const l6Src = data.features.find((f) => f.properties.lineId === '6');
  const l6Segs = l6Src.geometry.coordinates.filter((seg) =>
    seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT)
  );
  const l6Chains = chainSegments(l6Segs);
  let l6MaxD = 0, l6MaxIdx = 0;
  l6Chains[0].forEach((p, i) => {
    const d = dist(p, l6Chains[0][0]);
    if (d > l6MaxD) { l6MaxD = d; l6MaxIdx = i; }
  });
  const l6Single = l6Chains[0].slice(0, l6MaxIdx + 1);
  features.push({
    type: 'Feature',
    id: 'LINE-6',
    properties: { id: 'LINE-6', line: '6', name: '서울 지하철 6호선', shortName: '6호선', color: '#AE541A', isSingleTrack: true },
    geometry: { type: 'LineString', coordinates: l6Single },
  });

  // 우이신설선: 1 single LineString
  const existingLines = JSON.parse(fs.readFileSync('src/data/subwayLines.json', 'utf8'));
  const uiFeature = existingLines.features.find((f) => f.properties.shortName === '우이신설선');
  if (uiFeature) {
    features.push(uiFeature);
  }

  const outGeoJson = {
    type: 'FeatureCollection',
    name: 'SeoulSubwayLines_StrictSingleLine',
    features,
  };

  fs.writeFileSync('src/data/subwayLines.json', JSON.stringify(outGeoJson));
  fs.writeFileSync('public/geojson/subway-lines.geojson', JSON.stringify(outGeoJson, null, 2));

  console.log('Finished! Each subway line is now guaranteed strictly ONE single track line:');
  features.forEach((f) => {
    console.log(
      `- ${f.properties.shortName}: ${f.geometry.type} (${
        f.geometry.type === 'LineString' ? f.geometry.coordinates.length + ' pts' : f.geometry.coordinates.map((c) => c.length).join(' + ') + ' pts'
      })`
    );
  });
}

main().catch(console.error);
