const fs = require('fs');

let content = fs.readFileSync('src/styles/mapDarkTheme.ts', 'utf8');

// 1. Update function signature
const oldSig = `export function createDarkMapStyle(
      origin: string = typeof window !== 'undefined' ? window.location.origin : '',
      colors: typeof DARK_MAP_COLORS = DARK_MAP_COLORS
): any {`;

const newSig = `export function createDarkMapStyle(
      origin: string = typeof window !== 'undefined' ? window.location.origin : '',
      colors: typeof DARK_MAP_COLORS = DARK_MAP_COLORS,
      options: { showRoadNumbers?: boolean } = { showRoadNumbers: true }
): any {`;

// 2. Add visibility to the 3 shield layers
const targetShields = ['highway-shield-non-us', 'highway-shield-us-interstate', 'road_shield_us'];

targetShields.forEach(id => {
  const marker = `"id": "${id}"`;
  const idx = content.indexOf(marker);
  if (idx !== -1) {
    const layoutIdx = content.indexOf('"layout": {', idx);
    if (layoutIdx !== -1 && layoutIdx < idx + 1000) {
      const insertPos = layoutIdx + '"layout": {'.length;
      content = content.slice(0, insertPos) + '\n                              "visibility": options.showRoadNumbers === false ? "none" : "visible",' + content.slice(insertPos);
    }
  }
});

content = content.replace(oldSig, newSig);
fs.writeFileSync('src/styles/mapDarkTheme.ts', content, 'utf8');
console.log('Successfully updated src/styles/mapDarkTheme.ts with road number options');
