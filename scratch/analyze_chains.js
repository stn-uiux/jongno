const fs = require('fs');

async function run() {
  const res = await fetch('https://raw.githubusercontent.com/matassp/seoul-isochrone/main/public/data/lines.geojson');
  const d = await res.json();

  function dist(p1, p2) {
    const dx = p1[0] - p2[0];
    const dy = p1[1] - p2[1];
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Map viewing bounds
  const MIN_LON = 126.80, MAX_LON = 127.15, MIN_LAT = 37.45, MAX_LAT = 37.72;

  ['1', '2', '3', '4', '5', '6'].forEach(id => {
    const feat = d.features.find(f => f.properties.lineId === id);
    let segs = feat.geometry.coordinates.filter(seg =>
      seg.some(([lon, lat]) => lon >= MIN_LON && lon <= MAX_LON && lat >= MIN_LAT && lat <= MAX_LAT)
    );

    // Merge into connected chains
    const chains = [];
    let remaining = [...segs];

    while (remaining.length > 0) {
      let currentChain = [...remaining.shift()];
      let extended = true;

      while (extended) {
        extended = false;
        const head = currentChain[0];
        const tail = currentChain[currentChain.length - 1];

        for (let i = 0; i < remaining.length; i++) {
          const seg = remaining[i];
          const segHead = seg[0];
          const segTail = seg[seg.length - 1];

          // Threshold ~ 100 meters (0.001 deg)
          const THRESH = 0.001;

          if (dist(tail, segHead) < THRESH) {
            currentChain.push(...seg.slice(1));
            remaining.splice(i, 1);
            extended = true;
            break;
          } else if (dist(tail, segTail) < THRESH) {
            currentChain.push(...[...seg].reverse().slice(1));
            remaining.splice(i, 1);
            extended = true;
            break;
          } else if (dist(head, segTail) < THRESH) {
            currentChain.unshift(...seg.slice(0, -1));
            remaining.splice(i, 1);
            extended = true;
            break;
          } else if (dist(head, segHead) < THRESH) {
            currentChain.unshift(...[...seg].reverse().slice(0, -1));
            remaining.splice(i, 1);
            extended = true;
            break;
          }
        }
      }
      chains.push(currentChain);
    }

    chains.sort((a, b) => b.length - a.length);
    console.log(`\nLine ${id}: ${segs.length} segs reduced to ${chains.length} chains. Top chain lengths:`,
      chains.slice(0, 5).map(c => c.length)
    );
  });
}

run();
