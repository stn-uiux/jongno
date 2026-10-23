// Utility to compute SVG feColorMatrix from 5 user-selected map colors:
// 1. Land / Background (대지 / 배경)
// 2. Minor / Secondary Roads (간선 도로망)
// 3. Major / Primary Arterials (주요 간선대로)
// 4. Parks / Mountains (녹지 / 공원 / 산)
// 5. Water / Rivers (청계천 / 한강 수계)

export interface MapLayerColors {
  land: string;       // HEX (e.g. #1a1a1a)
  minorRoad: string;  // HEX (e.g. #707070)
  majorRoad: string;  // HEX (e.g. #d0d0d0)
  park: string;       // HEX (e.g. #1e382b)
  water: string;      // HEX (e.g. #14293d)
}

export const DEFAULT_LAYER_COLORS: MapLayerColors = {
  land: '#1c1c1c',
  minorRoad: '#787878',
  majorRoad: '#d4d4d4',
  park: '#1e382b',
  water: '#14293d',
};

export interface CssTileFilterConfig {
  invert: number;      // 0 ~ 100 (%)
  hueRotate: number;   // 0 ~ 360 (deg)
  brightness: number;  // 0 ~ 200 (%)
  contrast: number;    // 0 ~ 200 (%)
  saturate?: number;   // 0 ~ 200 (%)
}

export const DEFAULT_CSS_FILTER: CssTileFilterConfig = {
  invert: 100,
  hueRotate: 195,
  brightness: 110,
  contrast: 95,
  saturate: 80,
};

export function formatCssFilterString(cfg: CssTileFilterConfig): string {
  const sat = cfg.saturate !== undefined ? ` saturate(${cfg.saturate}%)` : '';
  return `invert(${cfg.invert}%) hue-rotate(${cfg.hueRotate}deg)${sat} brightness(${cfg.brightness}%) contrast(${cfg.contrast}%)`;
}

export const COLOR_STUDIO_PRESETS: { id: string; name: string; desc: string; colors: MapLayerColors }[] = [
  {
    id: 'light-standard',
    name: '표준 라이트 (기본 원본)',
    desc: '필터 없는 OpenStreetMap 원본 색상 (미색 대지, 주황 대로, 밝은 연녹 숲, 하늘색 수계)',
    colors: {
      land: '#f2efe9',
      minorRoad: '#ffffff',
      majorRoad: '#fcd6a4',
      park: '#c8facc',
      water: '#aad3df',
    },
  },
  {
    id: 'cool-gray',
    name: '다크 쿨그레이 (추천)',
    desc: '세련된 무채색 다크 배경에 은회색 도로망과 자연스러운 숲·수계 보존',
    colors: {
      land: '#1c1c1c',
      minorRoad: '#787878',
      majorRoad: '#d4d4d4',
      park: '#1e382b',
      water: '#14293d',
    },
  },
  {
    id: 'obsidian-white',
    name: '옵시디언 화이트 도로',
    desc: '칠흑빛 어두운 대지에 도로망을 환하고 또렷한 백은색으로 강조',
    colors: {
      land: '#121212',
      minorRoad: '#999999',
      majorRoad: '#ffffff',
      park: '#183024',
      water: '#102235',
    },
  },
  {
    id: 'midnight-navy',
    name: '미드나잇 사이버 블루',
    desc: '심야 관제실에 어울리는 딥 네이비 톤 대지와 청량한 도로망',
    colors: {
      land: '#111827',
      minorRoad: '#64748b',
      majorRoad: '#93c5fd',
      park: '#064e3b',
      water: '#0c4a6e',
    },
  },
  {
    id: 'pure-mono',
    name: '퓨어 미니멀 모노크롬',
    desc: '자연물까지 절제된 모노톤으로 정돈한 관제 집중 테마',
    colors: {
      land: '#1e1e1e',
      minorRoad: '#6e6e6e',
      majorRoad: '#e0e0e0',
      park: '#2a2a2a',
      water: '#181818',
    },
  },
  {
    id: 'warm-dark',
    name: '웜 다크 에스프레소',
    desc: '눈의 피로를 덜어주는 부드러운 웜그레이 대지와 온화한 도로톤',
    colors: {
      land: '#1f1e1c',
      minorRoad: '#7a756f',
      majorRoad: '#e2ddd5',
      park: '#293325',
      water: '#1e2830',
    },
  },
];

// Helper: Convert HEX to normalized RGB [0..1]
export function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.replace('#', '').trim();
  const num = parseInt(clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean, 16);
  if (isNaN(num)) return [0.5, 0.5, 0.5];
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

// 4x4 Matrix Inversion
function invert4x4(m: number[]): number[] | null {
  const inv = new Array(16);
  inv[0] = m[5]*m[10]*m[15] - m[5]*m[11]*m[14] - m[9]*m[6]*m[15] + m[9]*m[7]*m[14] + m[13]*m[6]*m[11] - m[13]*m[7]*m[10];
  inv[4] = -m[4]*m[10]*m[15] + m[4]*m[11]*m[14] + m[8]*m[6]*m[15] - m[8]*m[7]*m[14] - m[12]*m[6]*m[11] + m[12]*m[7]*m[10];
  inv[8] = m[4]*m[9]*m[15] - m[4]*m[11]*m[13] - m[8]*m[5]*m[15] + m[8]*m[7]*m[13] + m[12]*m[5]*m[11] - m[12]*m[7]*m[9];
  inv[12] = -m[4]*m[9]*m[14] + m[4]*m[10]*m[13] + m[8]*m[5]*m[14] - m[8]*m[6]*m[13] - m[12]*m[5]*m[10] + m[12]*m[6]*m[9];
  inv[1] = -m[1]*m[10]*m[15] + m[1]*m[11]*m[14] + m[9]*m[2]*m[15] - m[9]*m[3]*m[14] - m[13]*m[2]*m[11] + m[13]*m[3]*m[10];
  inv[5] = m[0]*m[10]*m[15] - m[0]*m[11]*m[14] - m[8]*m[2]*m[15] + m[8]*m[3]*m[14] + m[12]*m[2]*m[11] - m[12]*m[3]*m[10];
  inv[9] = -m[0]*m[9]*m[15] + m[0]*m[11]*m[13] + m[8]*m[1]*m[15] - m[8]*m[3]*m[13] - m[12]*m[1]*m[11] + m[12]*m[3]*m[9];
  inv[13] = m[0]*m[9]*m[14] - m[0]*m[10]*m[13] - m[8]*m[1]*m[14] + m[8]*m[2]*m[13] + m[12]*m[1]*m[10] - m[12]*m[2]*m[9];
  inv[2] = m[1]*m[6]*m[15] - m[1]*m[7]*m[14] - m[5]*m[2]*m[15] + m[5]*m[3]*m[14] + m[13]*m[2]*m[7] - m[13]*m[3]*m[6];
  inv[6] = -m[0]*m[6]*m[15] + m[0]*m[7]*m[14] + m[4]*m[2]*m[15] - m[4]*m[3]*m[14] - m[12]*m[2]*m[7] + m[12]*m[3]*m[6];
  inv[10] = m[0]*m[5]*m[15] - m[0]*m[7]*m[13] - m[4]*m[1]*m[15] + m[4]*m[3]*m[13] + m[12]*m[1]*m[7] - m[12]*m[3]*m[5];
  inv[14] = -m[0]*m[5]*m[14] + m[0]*m[6]*m[13] + m[4]*m[1]*m[14] - m[4]*m[2]*m[13] - m[12]*m[1]*m[6] + m[12]*m[2]*m[5];
  inv[3] = -m[1]*m[6]*m[11] + m[1]*m[7]*m[10] + m[5]*m[2]*m[11] - m[5]*m[3]*m[10] - m[9]*m[2]*m[7] + m[9]*m[3]*m[6];
  inv[7] = m[0]*m[6]*m[11] - m[0]*m[7]*m[10] - m[4]*m[2]*m[11] + m[4]*m[3]*m[10] + m[8]*m[2]*m[7] - m[8]*m[3]*m[6];
  inv[11] = -m[0]*m[5]*m[11] + m[0]*m[7]*m[9] + m[4]*m[1]*m[11] - m[4]*m[3]*m[9] - m[8]*m[1]*m[7] + m[8]*m[3]*m[5];
  inv[15] = m[0]*m[5]*m[10] - m[0]*m[6]*m[9] - m[4]*m[1]*m[10] + m[4]*m[2]*m[9] + m[8]*m[1]*m[6] - m[8]*m[2]*m[5];

  let det = m[0]*inv[0] + m[1]*inv[4] + m[2]*inv[8] + m[3]*inv[12];
  if (Math.abs(det) < 1e-8) return null;
  det = 1.0 / det;
  for (let i = 0; i < 16; i++) inv[i] *= det;
  return inv;
}

// Compute feColorMatrix string from MapLayerColors
export function computeSvgColorMatrix(colors: MapLayerColors): string {
  // Shortcut: Pure original OSM standard light mode (Identity Matrix)
  if (
    colors.land.toLowerCase() === '#f2efe9' &&
    colors.minorRoad.toLowerCase() === '#ffffff' &&
    colors.majorRoad.toLowerCase() === '#fcd6a4' &&
    colors.park.toLowerCase() === '#c8facc' &&
    colors.water.toLowerCase() === '#aad3df'
  ) {
    return `
      1 0 0 0 0
      0 1 0 0 0
      0 0 1 0 0
      0 0 0 1 0
    `.trim();
  }

  // Source color anchors from standard OSM raster tiles:
  // 1. Background/Land: #f2efe9 (R:0.949, G:0.937, B:0.914)
  // 2. Primary Highway: #fcd6a4 (R:0.988, G:0.839, B:0.643)
  // 3. Minor / Urban Road: #ffffff (R:1.000, G:1.000, B:1.000)
  // 4. Forest / Park: #c8facc (R:0.784, G:0.980, B:0.800)
  // 5. Water: #aad3df (R:0.667, G:0.827, B:0.875)
  const samples = [
    { rgb: [0.949, 0.937, 0.914, 1.0], target: hexToRgb01(colors.land), weight: 12.0 },
    { rgb: [0.988, 0.839, 0.643, 1.0], target: hexToRgb01(colors.majorRoad), weight: 9.0 },
    { rgb: [1.000, 1.000, 1.000, 1.0], target: hexToRgb01(colors.minorRoad), weight: 7.0 },
    { rgb: [0.784, 0.980, 0.800, 1.0], target: hexToRgb01(colors.park), weight: 9.0 },
    { rgb: [0.667, 0.827, 0.875, 1.0], target: hexToRgb01(colors.water), weight: 9.0 },
  ];

  const PtP = new Array(16).fill(0);
  const PtQ: [number, number, number][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];

  for (let s = 0; s < samples.length; s++) {
    const P = samples[s].rgb;
    const Q = samples[s].target;
    const w = samples[s].weight;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        PtP[r * 4 + c] += w * P[r] * P[c];
      }
      for (let c = 0; c < 3; c++) {
        PtQ[r][c] += w * P[r] * Q[c];
      }
    }
  }

  // Tikhonov Regularization
  const lambda = 0.001;
  for (let i = 0; i < 4; i++) PtP[i * 4 + i] += lambda;

  const invPtP = invert4x4(PtP);
  if (!invPtP) {
    // Fallback to tuned default
    return `
      1.0602 -1.6049 -0.5057 0 1.0021
      0.3339 -0.8563 -0.8948 0 1.4017
      0.5797 -3.2206  0.2091 0 2.2006
      0       0       0      1 0
    `.trim();
  }

  const W: [number, number, number][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += invPtP[r * 4 + k] * PtQ[k][c];
      }
      W[r][c] = sum;
    }
  }

  return `
    ${W[0][0].toFixed(4)} ${W[1][0].toFixed(4)} ${W[2][0].toFixed(4)} 0 ${W[3][0].toFixed(4)}
    ${W[0][1].toFixed(4)} ${W[1][1].toFixed(4)} ${W[2][1].toFixed(4)} 0 ${W[3][1].toFixed(4)}
    ${W[0][2].toFixed(4)} ${W[1][2].toFixed(4)} ${W[2][2].toFixed(4)} 0 ${W[3][2].toFixed(4)}
    0 0 0 1 0
  `.trim();
}
