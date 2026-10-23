async function fetchAllEntrances() {
  const query = `[out:json][timeout:60];
(
  node["railway"="subway_entrance"](37.45,126.80,37.72,127.15);
);
out body;`;

  const ep = 'https://maps.mail.ru/osm/tools/overpass/api/interpreter';
  console.log('Fetching all subway entrances across full view bbox from', ep);
  const res = await fetch(ep, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) {
    throw new Error('HTTP ' + res.status);
  }
  const data = await res.json();
  console.log('Total fetched entrances:', data.elements.length);

  const fs = await import('fs');
  fs.writeFileSync('scratch/subway_entrances_full.json', JSON.stringify(data, null, 2));
}

fetchAllEntrances().catch(console.error);
