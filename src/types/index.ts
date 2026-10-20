/**
 * Types for Closed-Network Congestion Monitoring System (Jongno-gu, Seoul)
 */

export type ZoneType = 'circle' | 'polygon';

export type CongestionLevel = 1 | 2 | 3 | 4;

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ZoneData {
  id: string;
  name: string;
  type: ZoneType;
  center: LatLng;
  radius?: number; // In meters, required for circle
  coordinates?: [number, number][]; // Array of [lat, lng] for polygon
  visible: boolean;
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

export type TileServerType = 'local' | 'osm' | 'dark' | 'offline_canvas' | 'custom';

export interface TileServerConfig {
  type: TileServerType;
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom: number;
  isAirGapped: boolean;
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
