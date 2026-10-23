const q = `
[out:json][timeout:30];
(
  relation["route"="subway"]["name"~"1호선|2호선|3호선|4호선|5호선|6호선|우이신설"];
  relation["route"="light_rail"]["name"~"우이신설"];
);
out tags;
`;

async function main() {
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'SubwayRouteQuery/1.0',
    },
    body: 'data=' + encodeURIComponent(q),
  });
  const data = await res.json();
  console.log('Total relations:', data.elements.length);
  data.elements.forEach((e) => {
    console.log(e.id, ':', e.tags.name, '|| ref:', e.tags.ref, '|| network:', e.tags.network);
  });
}

main().catch(console.error);
