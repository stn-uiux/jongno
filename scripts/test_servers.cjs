const SERVERS = [
  'https://overpass.openstreetmap.ru/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

async function testServer(url) {
  try {
    const start = Date.now();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'data=[out:json][timeout:10];node(37.56,126.97,37.57,126.98)["railway"="station"];out;',
    });
    const json = await res.json();
    console.log(`[${url}] OK (${Date.now() - start}ms), elements:`, json.elements.length);
    return true;
  } catch (e) {
    console.log(`[${url}] FAILED: ${e.message}`);
    return false;
  }
}

async function main() {
  for (const s of SERVERS) {
    await testServer(s);
  }
}
main();
