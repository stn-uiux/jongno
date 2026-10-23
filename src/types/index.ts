/**
 * Types for Closed-Network Congestion Monitoring System (Jongno-gu, Seoul)
 */

export type ZoneType = 'circle' | 'polygon';

export type CongestionLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface AreaInfo {
  id: string;
  name: string;
  code: string;
  color: string;
  description?: string;
}

export interface ZoneData {
  id: string;
  name: string;
  type: ZoneType;
  center: LatLng;
  radius?: number; // In meters, required for circle
  coordinates?: [number, number][]; // Array of [lat, lng] for polygon
  visible: boolean;
  areaId?: string; // e.g. 'AREA-001'
  areaName?: string; // e.g. '익선동'
  scannerName?: string; // e.g. 'CCTV 방범128(메인)'
  customColor?: string;
  customBorderColor?: string;
  customOpacity?: number;
  description?: string;
  category?: 'tourist' | 'commercial' | 'transit' | 'cultural' | 'plaza' | 'other';
  capacity?: number; // Maximum recommended capacity
}

export interface CongestionData {
  zoneId: string;
  level: CongestionLevel;
  value: number; // 0 - 100 percentage or score
  updatedAt: string;
  estimatedVisitors?: number;
  trend?: 'increasing' | 'stable' | 'decreasing';
}

export interface CongestionConfig {
  level1Max: number; // default: 35
  level2Max: number; // default: 65
  level3Max: number; // default: 85
  // level4 is > level3Max
}

export interface CongestionLevelInfo {
  level: CongestionLevel;
  name: string;
  color: string;
  borderColor: string;
  textColor: string;
  bgLight: string;
  description: string;
}

export type TileServerType = 'local' | 'osm' | 'dark' | 'vector' | 'offline_canvas' | 'custom' | 'clean_dark' | 'clean_raster';

export interface TileServerConfig {
  id?: string;
  type: TileServerType;
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom: number;
  minZoom?: number;
  maxNativeZoom?: number;
  isAirGapped: boolean;
  cleanPoi?: boolean;
  isNativeDark?: boolean;
  badge?: string;
  description?: string;
}

export type AppMode = 'view' | 'edit';

export type MapConceptPresetId =
  | 'dark-control'
  | 'midnight-blue'
  | 'minimal-mono'
  | 'light-standard'
  | 'high-contrast'
  | 'warm-earth'
  | 'custom';

export interface MapConceptConfig {
  presetId: MapConceptPresetId;
  name: string;
  description: string;
  invert: boolean;
  hueRotate: number; // 0 - 360 deg
  brightness: number; // 40 - 160 %
  contrast: number; // 60 - 220 %
  saturate: number; // 0 - 200 %
  bgColor: string;
  boundaryColor: string;
  boundaryDashArray: string;
  boundaryWeight: number;
  zoneGlow: boolean;
  zoneDefaultOpacity: number; // 0.15 - 0.7
}

export interface SubwayStationProperties {
  id: string;
  name: string;
  cleanName: string;
  name_en?: string;
  lines: string[];
  lineCount: number;
  isTransfer: boolean;
  primaryLine: string;
  primaryColor: string;
  lineColors: string[];
  inJongno: boolean;
  district: string;
  source: string;
  collectedAt: string;
}

export interface SubwayLineProperties {
  id: string;
  line: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  segmentCount: number;
  pointCount: number;
  source: string;
  collectedAt: string;
}

export interface SubwayConfig {
  showLines: boolean;
  showStations: boolean;
  showStationLabels: boolean;
  visibleLines: Record<string, boolean>;
}

export const DEFAULT_SUBWAY_CONFIG: SubwayConfig = {
  showLines: true,
  showStations: true,
  showStationLabels: true,
  visibleLines: {
    '1호선': true,
    '2호선': true,
    '3호선': true,
    '4호선': true,
    '5호선': true,
    '6호선': true,
    '우이신설선': true,
  },
};
