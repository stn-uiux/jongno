const fs = require('fs');

const BBOX = '37.48,126.85,37.66,127.10';

// Query exact subway and light_rail tracks in the BBOX
const query = `
[out:json][timeout:60];
(
  way["railway"="subway"](${BBOX});
  way["railway"="light_rail"](${BBOX});
);
(._;>;);
out body;
`.trim();

async function main() {
  console.log('Fetching subway ways from maps.mail.ru/osm/tools/overpass/api/interpreter...');
  const res = await fetch('https://maps.mail.ru/osm/tools/overpass/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'JongnoSubwayBuilder/1.0',
    },
    body: 'data=' + encodeURIComponent(query),
  });

  console.log('Status:', res.status);
  if (!res.ok) {
    const text = await res.text();
    console.error('Error response:', text.slice(0, 500));
    return;
  }

  const data = await res.json();
  console.log(`Fetched ${data.elements.length} elements!`);
  const ways = data.elements.filter((e) => e.type === 'way');
  console.log(`Ways count: ${ways.length}`);
  fs.writeFileSync('scratch/overpass_subway_seoul_full.json', JSON.stringify(data));
  console.log('Saved to scratch/overpass_subway_seoul_full.json');
}

main().catch(console.error);
