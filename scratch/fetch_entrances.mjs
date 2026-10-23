async function fetchEntrances() {
  const query = `[out:json][timeout:30];
(
  node["railway"="subway_entrance"](37.52,126.93,37.62,127.06);
);
out body;`;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  for (const ep of endpoints) {
    try {
      console.log('Trying', ep);
      const res = await fetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(query),
      });
      if (!res.ok) {
        console.log('Status:', res.status);
        continue;
      }
      const data = await res.json();
      console.log('Fetched entrances:', data.elements.length);
      if (data.elements.length > 0) {
        console.log('Sample entrance:', data.elements[0]);
        const fs = await import('fs');
        fs.writeFileSync('scratch/subway_entrances_osm.json', JSON.stringify(data, null, 2));
        return;
      }
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
}

fetchEntrances();
