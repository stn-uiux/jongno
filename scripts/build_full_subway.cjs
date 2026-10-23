const fs = require('fs');
const path = require('path');

const LINE_CONFIGS = {
  '1': {
    id: 'LINE-1',
    line: '1',
    name: '수도권 전철 1호선',
    shortName: '1호선',
    color: '#303B94',
    textColor: '#FFFFFF',
  },
  '2': {
    id: 'LINE-2',
    line: '2',
    name: '서울 지하철 2호선',
    shortName: '2호선',
    color: '#4AB34B',
    textColor: '#FFFFFF',
  },
  '3': {
    id: 'LINE-3',
    line: '3',
    name: '수도권 전철 3호선',
    shortName: '3호선',
    color: '#EE7B3F',
    textColor: '#FFFFFF',
  },
  '4': {
    id: 'LINE-4',
    line: '4',
    name: '수도권 전철 4호선',
    shortName: '4호선',
    color: '#499CDC',
    textColor: '#FFFFFF',
  },
  '5': {
    id: 'LINE-5',
    line: '5',
    name: '수도권 전철 5호선',
    shortName: '5호선',
    color: '#843ED9',
    textColor: '#FFFFFF',
  },
  '6': {
    id: 'LINE-6',
    line: '6',
    name: '서울 지하철 6호선',
    shortName: '6호선',
    color: '#AE541A',
    textColor: '#FFFFFF',
  },
  'UI': {
    id: 'LINE-UI',
    line: 'UI',
    name: '우이신설선',
    shortName: '우이신설선',
    color: '#BABA46',
    textColor: '#FFFFFF',
  },
};

// Map viewing bounds + buffer so lines stretch completely past screen edges
const MIN_LON = 126.80;
const MAX_LON = 127.15;
const MIN_LAT = 37.45;
const MAX_LAT = 37.72;

function isSegmentInView(seg) {
  return seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT);
}

async function main() {
  console.log('Fetching full lines.geojson from verified OSM dataset...');
  const linesRes = await fetch(
    'https://raw.githubusercontent.com/matassp/seoul-isochrone/main/public/data/lines.geojson'
  );
  const linesData = await linesRes.json();

  // Load existing data to retain Ui-Sinseol
  const existingLines = JSON.parse(fs.readFileSync('src/data/subwayLines.json', 'utf8'));
  const uiSinseolFeature = existingLines.features.find(
    (f) => f.properties.shortName === '우이신설선' || f.properties.line === 'UI'
  );

  const newFeatures = [];

  // Process Lines 1 through 6
  ['1', '2', '3', '4', '5', '6'].forEach((lineKey) => {
    const cfg = LINE_CONFIGS[lineKey];
    const srcFeature = linesData.features.find((f) => f.properties.lineId === lineKey);
    if (!srcFeature) {
      console.warn(`Line ${lineKey} not found in source!`);
      return;
    }

    // Filter segments to viewing region
    const filteredSegments = srcFeature.geometry.coordinates.filter(isSegmentInView);
    console.log(`Line ${lineKey} (${cfg.name}): ${filteredSegments.length} segments included.`);

    newFeatures.push({
      type: 'Feature',
      id: cfg.id,
      properties: {
        id: cfg.id,
        line: cfg.line,
        name: cfg.name,
        shortName: cfg.shortName,
        color: cfg.color,
        textColor: cfg.textColor,
        isSingleTrack: true,
        source: 'OpenStreetMap (ODbL) / Seoul Metro Real Tracks',
        collectedAt: '2026-10-21',
      },
      geometry: {
        type: 'MultiLineString',
        coordinates: filteredSegments,
      },
    });
  });

  // Add Ui-Sinseol line
  if (uiSinseolFeature) {
    const cfg = LINE_CONFIGS['UI'];
    newFeatures.push({
      ...uiSinseolFeature,
      properties: {
        ...uiSinseolFeature.properties,
        color: cfg.color,
      },
    });
    console.log('우이신설선 included.');
  }

  const finalLinesGeoJson = {
    type: 'FeatureCollection',
    name: 'SeoulSubwayLines_Full_View',
    metadata: {
      title: '서울시 및 종로구 전역 실제 지하철 노선망',
      source: 'OpenStreetMap contributors (ODbL)',
      collectedAt: new Date().toISOString(),
      lineCount: newFeatures.length,
    },
    features: newFeatures,
  };

  // Write lines to src/data/ and public/geojson/
  fs.writeFileSync('src/data/subwayLines.json', JSON.stringify(finalLinesGeoJson, null, 2), 'utf8');
  fs.writeFileSync('public/geojson/subway-lines.geojson', JSON.stringify(finalLinesGeoJson, null, 2), 'utf8');
  console.log('Saved subwayLines.json and subway-lines.geojson successfully.');

  // Also update stations: fetch full stations.geojson
  console.log('Fetching full stations.geojson...');
  const stnRes = await fetch(
    'https://raw.githubusercontent.com/matassp/seoul-isochrone/main/public/data/stations.geojson'
  );
  const stnData = await stnRes.json();

  // Load existing stations to preserve Jongno official flag
  const existingStations = JSON.parse(fs.readFileSync('src/data/subwayStations.json', 'utf8'));
  const jongnoOfficialSet = new Set(
    existingStations.features.filter((f) => f.properties.inJongno).map((f) => f.properties.cleanName || f.properties.name.replace(/역$/, ''))
  );

  const LINE_NAME_MAP = {
    '1': '1호선',
    '2': '2호선',
    '3': '3호선',
    '4': '4호선',
    '5': '5호선',
    '6': '6호선',
    'UI': '우이신설선',
  };

  // Filter stations in viewing area that belong to lines 1~6 or UI
  const filteredStations = [];
  const processedNames = new Set();

  stnData.features.forEach((f) => {
    const [lon, lat] = f.geometry.coordinates;
    if (lon < MIN_LON || lon > MAX_LON || lat < MIN_LAT || lat > MAX_LAT) return;

    // Filter to only our active 7 lines
    const activeLines = f.properties.lines
      .map((l) => LINE_NAME_MAP[l] || l)
      .filter((l) => Object.values(LINE_NAME_MAP).includes(l));

    if (activeLines.length === 0) return;

    const rawName = f.properties.name_ko || f.properties.name || '';
    const cleanName = rawName.replace(/역$/, '').trim();
    if (!cleanName || processedNames.has(cleanName)) return;
    processedNames.add(cleanName);

    const inJongno = jongnoOfficialSet.has(cleanName);
    const primaryLine = activeLines[0];
    const primaryColor = LINE_CONFIGS[primaryLine.replace('호선', '')]?.color || '#303B94';
    const lineColors = activeLines.map((l) => {
      const k = l.replace('호선', '');
      return LINE_CONFIGS[k]?.color || '#888888';
    });

    filteredStations.push({
      type: 'Feature',
      id: `STN-${cleanName}`,
      properties: {
        id: `STN-${cleanName}`,
        name: cleanName.endsWith('역') ? cleanName : `${cleanName}역`,
        cleanName,
        name_en: f.properties.name_en || '',
        lines: activeLines,
        lineCount: activeLines.length,
        isTransfer: activeLines.length > 1,
        primaryLine,
        primaryColor,
        lineColors,
        inJongno,
        district: inJongno ? '서울특별시 종로구' : '서울특별시',
        source: 'OpenStreetMap (ODbL)',
      },
      geometry: {
        type: 'Point',
        coordinates: [Number(lon.toFixed(7)), Number(lat.toFixed(7))],
      },
    });
  });

  // Also include any Ui-Sinseol stations from existing data if missing
  existingStations.features.forEach((ef) => {
    const cName = ef.properties.cleanName;
    if (!processedNames.has(cName)) {
      processedNames.add(cName);
      filteredStations.push(ef);
    }
  });

  // Sort Jongno stations first, then alphabetically
  filteredStations.sort((a, b) => {
    if (a.properties.inJongno !== b.properties.inJongno) {
      return a.properties.inJongno ? -1 : 1;
    }
    return a.properties.cleanName.localeCompare(b.properties.cleanName);
  });

  const finalStationsGeoJson = {
    type: 'FeatureCollection',
    name: 'SeoulSubwayStations_Full_View',
    metadata: {
      title: '서울시 및 종로구 전역 실제 지하철역 공간정보',
      source: 'OpenStreetMap contributors (ODbL)',
      collectedAt: new Date().toISOString(),
      featureCount: filteredStations.length,
      jongnoCount: filteredStations.filter((f) => f.properties.inJongno).length,
    },
    features: filteredStations,
  };

  fs.writeFileSync('src/data/subwayStations.json', JSON.stringify(finalStationsGeoJson, null, 2), 'utf8');
  fs.writeFileSync('public/geojson/subway-stations.geojson', JSON.stringify(finalStationsGeoJson, null, 2), 'utf8');
  console.log(`Saved ${filteredStations.length} stations successfully.`);
  console.log('=== FULL SUBWAY BUILD COMPLETE ===');
}

main().catch(console.error);
