const fs = require('fs');

async function testBox(bbox) {
  const query = `[out:json][timeout:25];(way["railway"="subway"](${bbox});way["railway"="light_rail"](${bbox}););(._;>;);out body qt;`;
  const start = Date.now();
  const res = await fetch('https://maps.mail.ru/osm/tools/overpass/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  console.log(`BBOX ${bbox}: ${data.elements.length} elements in ${Date.now() - start}ms`);
  return data;
}

testBox('37.52,126.92,37.56,127.02')
  .then(() => console.log('Success!'))
  .catch(console.error);
