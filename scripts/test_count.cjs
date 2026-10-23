const query = `[out:json][timeout:20];way["railway"="subway"](37.48,126.85,37.66,127.10);out count;`;

fetch('https://lz4.overpass-api.de/api/interpreter', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'data=' + encodeURIComponent(query),
})
  .then((r) => r.json())
  .then((d) => console.log('Result:', d))
  .catch(console.error);
