const fs = require('fs');

let content = fs.readFileSync('src/styles/mapDarkTheme.ts', 'utf8');

// 1. highway_major_inner
const oldBlock1 = `                                    [
                                          "trunk",
                                          "primary"
                                    ],
                                    c.nationalRoad,
                                    c.secondaryRoad`;

const newBlock1 = `                                    "trunk",
                                    c.motorway,
                                    "primary",
                                    c.nationalRoad,
                                    c.secondaryRoad`;

// 2. highway_major_subtle
const oldBlock2 = `                                    [
                                          "trunk",
                                          "primary"
                                    ],
                                    c.nationalRoadSubtle,
                                    "#3e434e"`;

const newBlock2 = `                                    "trunk",
                                    c.motorwayTunnel,
                                    "primary",
                                    c.nationalRoadSubtle,
                                    "#3e434e"`;

// Normalize line endings for replacement
const normalize = s => s.replace(/\r\n/g, '\n');
const isCRLF = content.includes('\r\n');

let normalizedContent = normalize(content);
const normOld1 = normalize(oldBlock1);
const normNew1 = normalize(newBlock1);
const normOld2 = normalize(oldBlock2);
const normNew2 = normalize(newBlock2);

if (!normalizedContent.includes(normOld1)) {
  console.error('Failed to find block 1!');
  process.exit(1);
}
if (!normalizedContent.includes(normOld2)) {
  console.error('Failed to find block 2!');
  process.exit(1);
}

normalizedContent = normalizedContent.replace(normOld1, normNew1);
normalizedContent = normalizedContent.replace(normOld2, normNew2);

const finalContent = isCRLF ? normalizedContent.replace(/\n/g, '\r\n') : normalizedContent;
fs.writeFileSync('src/styles/mapDarkTheme.ts', finalContent, 'utf8');
console.log('Successfully updated src/styles/mapDarkTheme.ts');
