const fs = require('fs');
const pos = JSON.parse(fs.readFileSync('public/styles/positron.json', 'utf8'));

let tsCode = `// =====================================================================
// 다크모드 지도 스타일 설정 파일 (Dark Mode Map Theme Specification)
// 상단의 DARK_MAP_COLORS 객체에서 원하는 색상 코드만 변경하면,
// 지도 전체의 레이어에 자동으로 즉시 반영됩니다.
// =====================================================================

export const DARK_MAP_COLORS = {
  // 1. 대지 및 건물 (Land & Buildings)
  land: "#202a36",              // 기본 전체 대지/배경색
  landuseResidential: "#263240",// 주거 및 시가지 구역 대지 (반투명 오버레이)
  buildingFill: "#283341",      // 건물 면 채움색
  buildingOutline: "#1c2430",   // 건물 외곽 테두리선

  // 2. 수계 및 하천 (Water)
  water: "#33435d",             // 하천 및 바다 채움색 (네이버 한강 컬러)
  waterway: "#33435d",          // 청계천 등 실개천/수로 선
  waterLabel: "#728cb3",        // 하천 명칭 텍스트

  // 3. 녹지 및 공원 (Parks & Greenery)
  park: "#243a36",              // 공원 및 궁궐 녹지 (경복궁, 창덕궁, 탑골공원)
  parkOutline: "#1c2e2a",       // 공원 및 산림 외곽 테두리선
  woodForest: "#223833",        // 산림, 숲, 잔디 (북악산, 인왕산, 낙산 등)

  // 4. 고속도로 및 주요 도로망 (Roads)
  roadCasing: "#18202a",        // 도로 외곽 다크 테두리선
  motorway: "#62420b",          // 고속도로 1: 도시고속/고속국도 (내부순환로, 서울문산, 강변북로, 올림픽대로 등)
  motorwayTunnel: "#75421d",    // 고속화도로 터널 및 원거리
  nationalRoad: "#887e58",      // 고속도로 2: 국도/주요 간선대로 (성산로, 통일로, 세종대로, 종로, 강남대로 등)
  nationalRoadSubtle: "#685420",// 원거리 국도/간선
  secondaryRoad: "#525762",     // 일반 보조 간선도로 (사직로, 창경궁로, 대학로 등)
  minorRoad: "#363d4a",         // 일반 골목길 / 이면도로
  path: "#2c3542",              // 보행로 / 산책로

  // 5. 철도 및 경계 (Railways & Boundaries)
  railway: "#333d4d",           // 지상 철도선
  railwayDash: "#455266",       // 철도 점선
  boundary: "#4a5b73",          // 행정 구역 경계선

  // 6. 비행장 (수색비행장 등 Aeroway)
  aerowayArea: "#242f3d",       // 비행장 구역
  aerowayRunway: "#2b3848",     // 활주로
  aerowayTaxiway: "#263342",    // 유도로
  aerowayCasing: "#1a222c",     // 활주로 테두리

  // 7. 텍스트 라벨 & 헤일로 (Labels & Halos)
  textCity: "#c7cbd4",          // 동/구/도시 명칭 텍스트
  textMajorRoad: "#a6b2c4",     // 대로명 텍스트
  textMinorRoad: "#7d899b",     // 골목길/소로명 텍스트
  textSecondary: "#8c97a8",     // 기타 시설물 텍스트
  textHalo: "#151c26",          // 텍스트 외곽 다크 헤일로 (가독성 확보 그림자)
};

export function createDarkMapStyle(
  origin: string = typeof window !== 'undefined' ? window.location.origin : '',
  colors: typeof DARK_MAP_COLORS = DARK_MAP_COLORS
): any {
  const c = colors;
  return {
    version: 8,
    sources: {
      openmaptiles: {
        type: 'vector',
        tiles: [\`\${origin}/tiles/planet/{z}/{x}/{y}.pbf\`],
        minzoom: 0,
        maxzoom: 14,
      },
    },
    sprite: \`\${origin}/sprites/ofm\`,
    glyphs: \`\${origin}/fonts/{fontstack}/{range}.pbf\`,
    layers: [
`;

const layerStrings = pos.layers.map(l => {
  let str = JSON.stringify(l, null, 6);
  // Replace colors with c.* references
  str = str.replace(/"#202a36"/g, 'c.land');
  str = str.replace(/"#263240"/g, 'c.landuseResidential');
  str = str.replace(/"#283341"/g, 'c.buildingFill');
  str = str.replace(/"#1c2430"/g, 'c.buildingOutline');
  str = str.replace(/"#33435d"/g, 'c.water');
  str = str.replace(/"#728cb3"/g, 'c.waterLabel');
  str = str.replace(/"#243a36"/g, 'c.park');
  str = str.replace(/"#1c2e2a"/g, 'c.parkOutline');
  str = str.replace(/"#223833"/g, 'c.woodForest');
  str = str.replace(/"#18202a"/g, 'c.roadCasing');
  str = str.replace(/"#62420b"/g, 'c.motorway');
  str = str.replace(/"#965928"/g, 'c.motorway');
  str = str.replace(/"#75421d"/g, 'c.motorwayTunnel');
  str = str.replace(/"#887e58"/g, 'c.nationalRoad');
  str = str.replace(/"#856d2e"/g, 'c.nationalRoad');
  str = str.replace(/"#685420"/g, 'c.nationalRoadSubtle');
  str = str.replace(/"#525762"/g, 'c.secondaryRoad');
  str = str.replace(/"#363d4a"/g, 'c.minorRoad');
  str = str.replace(/"#2c3542"/g, 'c.path');
  str = str.replace(/"#333d4d"/g, 'c.railway');
  str = str.replace(/"#455266"/g, 'c.railwayDash');
  str = str.replace(/"#4a5b73"/g, 'c.boundary');
  str = str.replace(/"#242f3d"/g, 'c.aerowayArea');
  str = str.replace(/"#2b3848"/g, 'c.aerowayRunway');
  str = str.replace(/"#263342"/g, 'c.aerowayTaxiway');
  str = str.replace(/"#1a222c"/g, 'c.aerowayCasing');
  str = str.replace(/"#c7cbd4"/g, 'c.textCity');
  str = str.replace(/"#a6b2c4"/g, 'c.textMajorRoad');
  str = str.replace(/"#7d899b"/g, 'c.textMinorRoad');
  str = str.replace(/"#8c97a8"/g, 'c.textSecondary');
  str = str.replace(/"#151c26"/g, 'c.textHalo');
  str = str.replace(/"#1a2330"/g, 'c.textHalo');
  return '      ' + str;
});

tsCode += layerStrings.join(',\n') + `
    ],
  };
}
`;

const outPath = 'src/styles/mapDarkTheme.ts';
if (!fs.existsSync('src/styles')) fs.mkdirSync('src/styles', { recursive: true });
fs.writeFileSync(outPath, tsCode, 'utf8');
console.log('Successfully generated', outPath);
