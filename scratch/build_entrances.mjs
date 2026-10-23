import fs from 'fs';

async function fetchTile(minLat, minLon, maxLat, maxLon, name) {
  const query = `[out:json][timeout:25];
(
  node["railway"="subway_entrance"](${minLat},${minLon},${maxLat},${maxLon});
);
out body;`;
  const ep = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
  try {
    console.log(`Fetching ${name}...`);
    const res = await fetch(ep, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=' + encodeURIComponent(query),
    });
    if (!res.ok) {
      console.log(`${name} HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    console.log(`${name} returned ${data.elements.length} entrances.`);
    return data.elements;
  } catch (e) {
    console.log(`${name} error: ${e.message}`);
    return [];
  }
}

async function main() {
  const allMap = new Map();

  // Load already fetched center
  if (fs.existsSync('scratch/subway_entrances_osm.json')) {
    const centerData = JSON.parse(fs.readFileSync('scratch/subway_entrances_osm.json'));
    centerData.elements.forEach((e) => allMap.set(e.id, e));
    console.log('Center baseline:', allMap.size);
  }

  const tiles = [
    [37.45, 126.80, 37.54, 126.98, 'SW (Yeongdeungpo/Guro)'],
    [37.45, 126.98, 37.54, 127.15, 'SE (Gangnam/Seocho/Songpa)'],
    [37.58, 126.80, 37.72, 126.98, 'NW (Eunpyeong/Goyang)'],
    [37.58, 126.98, 37.72, 127.15, 'NE (Nowon/Dobong/Seongbuk)'],
  ];

  for (const [minLat, minLon, maxLat, maxLon, name] of tiles) {
    const elements = await fetchTile(minLat, minLon, maxLat, maxLon, name);
    elements.forEach((e) => allMap.set(e.id, e));
    // Brief polite pause
    await new Promise((r) => setTimeout(r, 1000));
  }

  const finalElements = Array.from(allMap.values());
  console.log('Total consolidated unique entrances:', finalElements.length);

  // Convert to GeoJSON FeatureCollection
  const features = finalElements
    .filter((e) => e.tags && (e.tags.ref || e.tags.name || e.tags.description))
    .map((e) => {
      const ref = e.tags.ref || '';
      const desc = e.tags.description || e.tags['description:ko'] || e.tags.name || '';
      return {
        type: 'Feature',
        id: `ENT-${e.id}`,
        properties: {
          id: e.id,
          ref: ref,
          desc: desc,
          subway: e.tags.subway || 'yes',
          wheelchair: e.tags.wheelchair || undefined,
        },
        geometry: {
          type: 'Point',
          coordinates: [Number(e.lon.toFixed(7)), Number(e.lat.toFixed(7))],
        },
      };
    });

  const geoJson = {
    type: 'FeatureCollection',
    name: 'SeoulSubwayEntrances',
    features,
  };

  fs.writeFileSync('src/data/subwayEntrances.json', JSON.stringify(geoJson));
  fs.writeFileSync('public/geojson/subway-entrances.geojson', JSON.stringify(geoJson, null, 2));
  console.log(`Saved ${features.length} subway entrances to src/data/subwayEntrances.json!`);
}

main().catch(console.error);
