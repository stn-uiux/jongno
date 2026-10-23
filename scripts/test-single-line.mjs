import fs from 'fs';

const lines = JSON.parse(fs.readFileSync('public/geojson/subway-lines.geojson', 'utf-8'));

function distanceSq(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return dx * dx + dy * dy;
}

// Function to chain segments into single continuous LineString (or minimal non-parallel paths)
function chainSegments(segments) {
  if (segments.length === 0) return [];
  
  // Find longest or main chain
  let remaining = segments.map((s) => [...s]);
  let chains = [];

  while (remaining.length > 0) {
    // Start with the longest available segment
    remaining.sort((a, b) => b.length - a.length);
    let currentChain = remaining.shift();

    let extended = true;
    while (extended) {
      extended = false;
      const head = currentChain[0];
      const tail = currentChain[currentChain.length - 1];

      let bestIdx = -1;
      let bestDist = 0.0001; // ~10m threshold
      let attachMode = null;

      for (let i = 0; i < remaining.length; i++) {
        const seg = remaining[i];
        const segHead = seg[0];
        const segTail = seg[seg.length - 1];

        // tail -> segHead
        const d1 = distanceSq(tail, segHead);
        if (d1 < bestDist) {
          bestDist = d1;
          bestIdx = i;
          attachMode = 'tail-head';
        }
        // tail -> segTail
        const d2 = distanceSq(tail, segTail);
        if (d2 < bestDist) {
          bestDist = d2;
          bestIdx = i;
          attachMode = 'tail-tail';
        }
        // segTail -> head
        const d3 = distanceSq(segTail, head);
        if (d3 < bestDist) {
          bestDist = d3;
          bestIdx = i;
          attachMode = 'head-tail';
        }
        // segHead -> head
        const d4 = distanceSq(segHead, head);
        if (d4 < bestDist) {
          bestDist = d4;
          bestIdx = i;
          attachMode = 'head-head';
        }
      }

      if (bestIdx >= 0) {
        const seg = remaining.splice(bestIdx, 1)[0];
        if (attachMode === 'tail-head') {
          currentChain.push(...seg.slice(1));
        } else if (attachMode === 'tail-tail') {
          seg.reverse();
          currentChain.push(...seg.slice(1));
        } else if (attachMode === 'head-tail') {
          currentChain.unshift(...seg.slice(0, -1));
        } else if (attachMode === 'head-head') {
          seg.reverse();
          currentChain.unshift(...seg.slice(0, -1));
        }
        extended = true;
      }
    }
    chains.push(currentChain);
  }

  // chains now contains disjoint continuous paths.
  // Sort by length: the longest chain is the primary mainline!
  chains.sort((a, b) => b.length - a.length);
  return chains;
}

lines.features.forEach((f) => {
  const segs = f.geometry.coordinates;
  const chained = chainSegments(segs);
  console.log(`\n${f.properties.shortName}: Original ${segs.length} segs -> Chained ${chained.length} paths`);
  chained.forEach((c, i) => console.log(`  Path ${i}: ${c.length} points, from [${c[0]}] to [${c[c.length-1]}]`));
});
