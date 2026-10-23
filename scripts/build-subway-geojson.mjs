import fs from 'fs';
import path from 'path';

// Official Line Color definitions (Seoul Metro / T-money official standard)
const LINE_METADATA = {
  '1호선': {
    id: 'LINE-1',
    line: '1',
    name: '수도권 전철 1호선',
    shortName: '1호선',
    color: '#303B94',
    textColor: '#FFFFFF',
    order: 1,
  },
  '2호선': {
    id: 'LINE-2',
    line: '2',
    name: '서울 지하철 2호선',
    shortName: '2호선',
    color: '#4AB34B',
    textColor: '#FFFFFF',
    order: 2,
  },
  '3호선': {
    id: 'LINE-3',
    line: '3',
    name: '수도권 전철 3호선',
    shortName: '3호선',
    color: '#EE7B3F',
    textColor: '#FFFFFF',
    order: 3,
  },
  '4호선': {
    id: 'LINE-4',
    line: '4',
    name: '수도권 전철 4호선',
    shortName: '4호선',
    color: '#499CDC',
    textColor: '#FFFFFF',
    order: 4,
  },
  '5호선': {
    id: 'LINE-5',
    line: '5',
    name: '수도권 전철 5호선',
    shortName: '5호선',
    color: '#843ED9',
    textColor: '#FFFFFF',
    order: 5,
  },
  '6호선': {
    id: 'LINE-6',
    line: '6',
    name: '서울 지하철 6호선',
    shortName: '6호선',
    color: '#AE541A',
    textColor: '#FFFFFF',
    order: 6,
  },
  '우이신설선': {
    id: 'LINE-UI',
    line: 'UI',
    name: '우이신설선',
    shortName: '우이신설선',
    color: '#BABA46',
    textColor: '#FFFFFF',
    order: 7,
  },
};

// Known line assignments for stations in/around Jongno
const STATION_LINE_MAPPING = {
  '광화문': ['5호선'],
  '종각': ['1호선'],
  '종로3가': ['1호선', '3호선', '5호선'],
  '종로5가': ['1호선'],
  '경복궁': ['3호선'],
  '안국': ['3호선'],
  '혜화': ['4호선'],
  '동대문': ['1호선', '4호선'],
  '동묘앞': ['1호선', '6호선'],
  '창신': ['6호선'],
  '독립문': ['3호선'],
  '무악재': ['3호선'],
  '서대문': ['5호선'],
  '시청': ['1호선', '2호선'],
  '을지로입구': ['2호선'],
  '을지로3가': ['2호선', '3호선'],
  '을지로4가': ['2호선', '5호선'],
  '동대문역사문화공원': ['2호선', '4호선', '5호선'],
  '신설동': ['1호선', '2호선', '우이신설선'],
  '보문': ['6호선', '우이신설선'],
  '한성대입구': ['4호선'],
  '성신여대입구': ['4호선', '우이신설선'],
  '충무로': ['3호선', '4호선'],
  '명동': ['4호선'],
  '회현': ['4호선'],
  '서울': ['1호선', '4호선'],
  '서울역': ['1호선', '4호선'],
  '신당': ['2호선', '6호선'],
  '청구': ['5호선', '6호선'],
  '약수': ['3호선', '6호선'],
  '동대입구': ['3호선'],
  '제기동': ['1호선'],
  '길음': ['4호선'],
  '정릉': ['우이신설선'],
  '북한산보국문': ['우이신설선'],
  '충정로': ['2호선', '5호선'],
  '아현': ['2호선'],
  '애오개': ['5호선'],
  '이대': ['2호선'],
  '신촌': ['2호선'],
  '안암': ['6호선'],
  '상왕십리': ['2호선'],
  '신금호': ['5호선'],
  '금호': ['3호선'],
  '버티고개': ['6호선'],
  '홍제': ['3호선'],
  '숙대입구': ['4호선'],
};

// Stations officially inside Jongno-gu boundary
const JONGNO_OFFICIAL_STATIONS = new Set([
  '광화문',
  '종각',
  '종로3가',
  '종로5가',
  '경복궁',
  '안국',
  '혜화',
  '동대문',
  '동묘앞',
  '창신',
  '독립문',
  '서대문',
]);

const rawData = JSON.parse(fs.readFileSync('scratch/overpass_subway_raw.json', 'utf-8'));

// 1. Build Node Map
const nodesMap = new Map();
rawData.elements.forEach((e) => {
  if (e.type === 'node') {
    nodesMap.set(e.id, { id: e.id, lat: e.lat, lon: e.lon, tags: e.tags || {} });
  }
});

// 2. Extract and Consolidate Stations
const stationGroups = new Map();

nodesMap.forEach((node) => {
  const tags = node.tags;
  if (tags && (tags.railway === 'station' || tags.station === 'subway')) {
    let rawName = tags.name || tags['name:ko'] || '';
    if (!rawName) return;
    let cleanName = rawName.replace(/역$/, '').trim();
    if (cleanName === '서울') cleanName = '서울역';

    if (!stationGroups.has(cleanName)) {
      stationGroups.set(cleanName, []);
    }
    stationGroups.get(cleanName).push(node);
  }
});

const stationFeatures = [];

stationGroups.forEach((nodes, name) => {
  const lines = STATION_LINE_MAPPING[name] || [];
  if (lines.length === 0) return; // Skip non-subway / irrelevant stations

  // Calculate centroid from actual station nodes
  const avgLon = nodes.reduce((sum, n) => sum + n.lon, 0) / nodes.length;
  const avgLat = nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length;

  const isTransfer = lines.length > 1;
  const primaryLine = lines[0];
  const primaryMeta = LINE_METADATA[primaryLine] || { color: '#0052A4' };
  const inJongno = JONGNO_OFFICIAL_STATIONS.has(name);

  // Line colors array for multi-line transfer badges
  const lineColors = lines.map((l) => LINE_METADATA[l]?.color || '#888888');

  stationFeatures.push({
    type: 'Feature',
    id: `STN-${name}`,
    properties: {
      id: `STN-${name}`,
      name: name.endsWith('역') ? name : `${name}역`,
      cleanName: name.replace(/역$/, '').trim() || name,
      name_en: nodes[0].tags['name:en'] || '',
      lines,
      lineCount: lines.length,
      isTransfer,
      primaryLine,
      primaryColor: primaryMeta.color,
      lineColors,
      inJongno,
      district: inJongno ? '서울특별시 종로구' : '서울특별시',
      source: 'OpenStreetMap (ODbL)',
      collectedAt: '2026-10-21',
    },
    geometry: {
      type: 'Point',
      coordinates: [Number(avgLon.toFixed(7)), Number(avgLat.toFixed(7))],
    },
  });
});

// Sort stations: Jongno stations first, then alphabetically
stationFeatures.sort((a, b) => {
  if (a.properties.inJongno !== b.properties.inJongno) {
    return a.properties.inJongno ? -1 : 1;
  }
  return a.properties.cleanName.localeCompare(b.properties.cleanName);
});

const stationsGeoJson = {
  type: 'FeatureCollection',
  name: 'SeoulSubwayStations_Jongno',
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  metadata: {
    title: '서울 종로구 및 연계 지하철역 공간정보',
    source: 'OpenStreetMap contributors / Overpass API',
    license: 'Open Database License (ODbL)',
    collectedAt: '2026-10-21T10:40:00Z',
    featureCount: stationFeatures.length,
    jongnoCount: stationFeatures.filter((f) => f.properties.inJongno).length,
  },
  features: stationFeatures,
};

// 3. Extract and Process Subway Track Lines (Single Track Centerlines - 단선)
const ways = rawData.elements.filter((e) => e.type === 'way');

// Curated continuous way sequence per line to guarantee a single continuous mainline (no double tracks)
const SINGLE_LINE_WAY_IDS = {
  '1호선': [942140072, 1116746235, 51795972, 1168235689, 379994110, 637016272, 379994106, 637016278, 379994109, 782891445],
  '2호선': [168498720, 1458437477, 672454243, 321173435],
  '3호선': [1262614125, 1262614123, 1262614126],
  '4호선': [379994121, 1168223034, 3833429797, 785130604, 379994120, 379994123, 781983105, 1221943825, 178441449],
  '5호선': [396816939, 379994124, 275694429],
  '6호선': [1259307344, 469657938],
  '우이신설선': [1026020324],
};

function distSq(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return dx * dx + dy * dy;
}

function getWayCoordinates(wayId) {
  const w = ways.find((x) => x.id === wayId);
  if (!w) return [];
  return w.nodes
    .map((id) => nodesMap.get(id))
    .filter(Boolean)
    .map((n) => [Number(n.lon.toFixed(7)), Number(n.lat.toFixed(7))]);
}

const lineFeatures = [];

Object.keys(LINE_METADATA).forEach((lineKey) => {
  const meta = LINE_METADATA[lineKey];
  const wayIds = SINGLE_LINE_WAY_IDS[lineKey] || [];
  if (wayIds.length === 0) return;

  const chainedCoords = [];
  wayIds.forEach((id) => {
    const coords = getWayCoordinates(id);
    if (coords.length < 2) return;

    if (chainedCoords.length === 0) {
      chainedCoords.push(...coords);
    } else {
      const lastPt = chainedCoords[chainedCoords.length - 1];
      const dStart = distSq(lastPt, coords[0]);
      const dEnd = distSq(lastPt, coords[coords.length - 1]);
      if (dStart <= dEnd) {
        chainedCoords.push(...coords.slice(1));
      } else {
        coords.reverse();
        chainedCoords.push(...coords.slice(1));
      }
    }
  });

  if (chainedCoords.length === 0) return;

  lineFeatures.push({
    type: 'Feature',
    id: meta.id,
    properties: {
      id: meta.id,
      line: meta.line,
      name: meta.name,
      shortName: meta.shortName,
      color: meta.color,
      textColor: meta.textColor,
      isSingleTrack: true,
      pointCount: chainedCoords.length,
      source: 'OpenStreetMap contributors / Overpass API (ODbL)',
      collectedAt: '2026-10-21',
    },
    geometry: {
      type: 'LineString',
      coordinates: chainedCoords,
    },
  });
});

const linesGeoJson = {
  type: 'FeatureCollection',
  name: 'SeoulSubwayLines_Jongno',
  crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
  metadata: {
    title: '서울 종로구 및 연계 지하철 노선 실제 단선 선로 공간정보',
    source: 'OpenStreetMap contributors / Overpass API',
    license: 'Open Database License (ODbL)',
    collectedAt: '2026-10-21T11:10:00Z',
    lineCount: lineFeatures.length,
  },
  features: lineFeatures,
};

// 4. Save to public/geojson/ and src/data/
const OUT_DIR = path.resolve('public', 'geojson');
fs.mkdirSync(OUT_DIR, { recursive: true });

fs.writeFileSync(path.join(OUT_DIR, 'subway-lines.geojson'), JSON.stringify(linesGeoJson, null, 2));
fs.writeFileSync(path.join(OUT_DIR, 'subway-stations.geojson'), JSON.stringify(stationsGeoJson, null, 2));

console.log('[Subway GeoJSON Builder] Success!');
console.log(`- Created ${path.join(OUT_DIR, 'subway-lines.geojson')} (${lineFeatures.length} lines)`);
console.log(`- Created ${path.join(OUT_DIR, 'subway-stations.geojson')} (${stationFeatures.length} stations)`);

// Also create TypeScript importable files in src/data/ for zero-latency air-gap bundle!
const SRC_DATA_DIR = path.resolve('src', 'data');
fs.writeFileSync(path.join(SRC_DATA_DIR, 'subwayLines.json'), JSON.stringify(linesGeoJson));
fs.writeFileSync(path.join(SRC_DATA_DIR, 'subwayStations.json'), JSON.stringify(stationsGeoJson));
console.log(`- Also saved static bundles to src/data/ for 100% air-gap compilation!`);
