import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { maplibreGL } from '@maplibre/maplibre-gl-leaflet';
import { createDarkMapStyle } from '../styles/mapDarkTheme';
import '../css/subwayStation.css';
import '../css/areaBadge.css';

// Vite worker setup for MapLibre GL (required for OpenFreeMap vector styles)
setWorkerUrl(workerUrl);
import {
  Plus,
  Minus,
  Layers,
  Milestone,
  Crosshair,
  Check,
  X,
  CircleDot,
  Hexagon,
  Move,
  Train,
  Contrast,
} from 'lucide-react';
import { getSmartScannerSvgString } from './SmartScannerIcon';
import {
  ZoneData,
  CongestionData,
  CongestionLevel,
  AppMode,
  LatLng,
  SubwayConfig,
  DEFAULT_SUBWAY_CONFIG,
} from '../types';
import subwayLinesData from '../data/subwayLines.json';
import subwayStationsData from '../data/subwayStations.json';
import subwayEntrancesData from '../data/subwayEntrances.json';
import { SubwayControlPanel } from './SubwayControlPanel';
import {
  JONGNO_CENTER,
  DEFAULT_ZOOM,
  CONGESTION_LEVEL_MAP,
  JONGNO_BOUNDARY,
} from '../utils/constants';
import stateNormal from '../images/state_normal.svg';
import stateAttention from '../images/state_attention.svg';
import stateCaution from '../images/state_caution.svg';
import stateWarning from '../images/state_warning.svg';
import stateCritical from '../images/state_critical.svg';
import stateEmergency from '../images/state_emergency.svg';
import { AREAS } from '../data/defaultZones';
import {
  calculateDistance,
  getDestinationPoint,
  calculateCentroid,
  determineCongestionLevel,
  formatCoordinate,
  computeAreaHullFromZones,
} from '../utils/geoUtils';

const getStateSvgUrl = (value: number) => {
  if (value <= 25) return stateNormal;
  if (value <= 45) return stateAttention;
  if (value <= 65) return stateCaution;
  if (value <= 80) return stateWarning;
  if (value <= 90) return stateCritical;
  return stateEmergency;
};

const getStateGlowColor = (value: number) => {
  if (value <= 25) return 'rgba(92, 197, 255, 0.20)'; // 정상 (#5CC5FF)
  if (value <= 45) return 'rgba(48, 131, 255, 0.35)'; // 관심 (#3083FF)
  if (value <= 65) return 'rgba(255, 187, 0, 0.55)';  // 주의 (#FFBB00)
  if (value <= 80) return 'rgba(255, 127, 48, 0.70)';  // 경계 (#FF7F30)
  if (value <= 90) return 'rgba(166, 75, 255, 0.85)';  // 심각 (#A64BFF)
  return 'rgba(220, 38, 38, 0.95)';                   // 위험 (#DC2626)
};

export const SUBWAY_LINE_COLORS: Record<string, string> = {
  '1호선': '#303B94',
  '2호선': '#4AB34B',
  '3호선': '#EE7B3F',
  '4호선': '#499CDC',
  '5호선': '#843ED9',
  '6호선': '#AE541A',
  '우이신설선': '#BABA46',
  '우리신설선': '#BABA46',
};

// Enormous bounding box surrounding Korea/Earth for the inverse mask (donut hole) polygon
const WORLD_MASK_RING: [number, number][] = [
  [-90, -180],
  [-90, 180],
  [90, 180],
  [90, -180],
];

// 16진수 컬러를 RGBA 문자열로 변환하는 헬퍼 함수
const hexToRgba = (hex: string, alpha: number): string => {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return `rgba(59, 130, 246, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 구역 스캐너 혼잡도 히트 그라데이션 (Zoom >= 16): 레벨별 투명도 곡선 적용
const LEVEL_HEAT_OPACITY: Record<number, { peak: number; mid: number; outer: number }> = {
  1: { peak: 0.50, mid: 0.3, outer: 0 },
  2: { peak: 0.60, mid: 0.4, outer: 0.1 },
  3: { peak: 0.70, mid: 0.5, outer: 0.1 },
  4: { peak: 0.80, mid: 0.6, outer: 0.1 },
  5: { peak: 0.90, mid: 0.7, outer: 0.1 },
  6: { peak: 1, mid: 0.8, outer: 0.2 },
};

// 영역(Area, Zoom < 16) 레벨별 다각형 투명도: 단계가 낮을수록 투명하여 밑에 깔린 지도가 선명하게 보이고, 단계가 높을수록 뚜렷하게 경고
const AREA_OPACITY_BY_LEVEL: Record<number, number> = {
  1: 0.20, // 정상 (가장 맑고 투명하여 지도 도로/골목/건물명이 깨끗하게 투과)
  2: 0.30, // 관심
  3: 0.40, // 주의
  4: 0.50, // 경계
  5: 0.60, // 심각
  6: 0.70, // 위험 (가장 뚜렷하게 경고)
};

interface MapContainerProps {
  zones: ZoneData[];
  congestions: Record<string, CongestionData>;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  onUpdateZone: (zone: ZoneData) => void;
  mode: AppMode;
  isDarkMode: boolean;
  onOpenGuide?: () => void;
  onAddZoneComplete: (newZone: ZoneData) => void;
  creatingZoneType: 'circle' | 'polygon' | null;
  setCreatingZoneType: (type: 'circle' | 'polygon' | null) => void;
  focusTarget: LatLng | null;
  onFocusHandled: () => void;
  onOpenCctv?: (zone: ZoneData) => void;
}

// Custom DivIcons with SVG for zero-dependency offline rendering
const createCenterHandleIcon = () =>
  L.divIcon({
    className: 'custom-drag-handle-center',
    html: `
      <div style="
        width: 26px; height: 26px;
        background: #2563EB;
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 0 0 3.5px rgba(37, 99, 235, 0.45), 0 3px 8px rgba(0,0,0,0.5);
        display: flex; align-items: center; justify-content: center;
        cursor: grab;
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="5 9 2 12 5 15"/>
          <polyline points="9 5 12 2 15 5"/>
          <polyline points="15 19 12 22 9 19"/>
          <polyline points="19 9 22 12 19 15"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <line x1="12" y1="2" x2="12" y2="22"/>
        </svg>
      </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

const createRadiusHandleIcon = () =>
  L.divIcon({
    className: 'custom-drag-handle-radius',
    html: `
      <div style="
        width: 18px; height: 18px;
        background: #F59E0B;
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
        cursor: ew-resize;
      ">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });

const createVertexHandleIcon = (index: number) =>
  L.divIcon({
    className: 'custom-vertex-handle',
    html: `
      <div style="
        width: 16px; height: 16px;
        background: #10B981;
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 2px 5px rgba(0,0,0,0.35);
        cursor: move;
        font-size: 9px;
        color: white;
        font-weight: bold;
        display: flex; align-items: center; justify-content: center;
      ">
        ${index + 1}
      </div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const createMidpointHandleIcon = () =>
  L.divIcon({
    className: 'custom-midpoint-handle',
    html: `
      <div style="
        width: 12px; height: 12px;
        background: #94A3B8;
        border: 1.5px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 1px 3px rgba(0,0,0,0.25);
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
      ">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

// Jongno-gu bounding box (used for zoom-out limit & pan restriction)
const JONGNO_BOUNDS = L.latLngBounds(JONGNO_BOUNDARY);
// Strict pan restriction boundary: tightly restricts map view so user can NEVER drag into empty black space
const OFFLINE_SAFE_PAN_BOUNDS = L.latLngBounds(
  [37.490, 126.885], // South-West (Han River, Yongsan, Yeouido)
  [37.668, 127.085]  // North-East (Bukhansan, Dobongsan, Seongbuk)
);
// Symmetric padding so fitted zones sit exactly at the visual center of the map
const FIT_PADDING: L.PointExpression = [70, 70];

// Combined bounds of all visible zones (null if none)
const getZonesBounds = (zones: ZoneData[]): L.LatLngBounds | null => {
  let bounds: L.LatLngBounds | null = null;
  zones.forEach((z) => {
    if (!z.visible) return;
    const b =
      z.type === 'polygon' && z.coordinates && z.coordinates.length > 0
        ? L.latLngBounds(z.coordinates)
        : L.latLng(z.center.lat, z.center.lng).toBounds((z.radius || 200) * 2);
    bounds = bounds ? bounds.extend(b) : b;
  });
  return bounds;
};

// Translate an entire zone (circle center or all polygon vertices) by a lat/lng offset
const translateZone = (zone: ZoneData, dLat: number, dLng: number): ZoneData => {
  const center = { lat: zone.center.lat + dLat, lng: zone.center.lng + dLng };
  if (zone.type === 'polygon' && zone.coordinates) {
    return {
      ...zone,
      center,
      coordinates: zone.coordinates.map(
        ([lat, lng]) => [lat + dLat, lng + dLng] as [number, number]
      ),
    };
  }
  return { ...zone, center };
};

// 관제 영역(Area)용 혼잡도 레벨별 radialGradient ID 매핑
const getAreaGradientId = (level: CongestionLevel): string => {
  switch (level) {
    case 6:
      return 'critical_path';
    case 5:
      return 'serious_path';
    case 4:
      return 'major_path';
    case 3:
      return 'minor_path';
    case 2:
      return 'warning_path';
    case 1:
    default:
      return 'normal_path';
  }
};

// Leaflet overlayPane SVG 내부에 그라데이션 defs 주입 함수 (다크/라이트 모드별 최적화 색상 적용)
const injectAreaGradients = (map: L.Map, isDarkMode: boolean) => {
  try {
    const overlayPane = map.getPanes()?.overlayPane;
    if (!overlayPane) return;
    const svg = overlayPane.querySelector('svg');
    if (!svg) return;
    let defs = svg.querySelector<SVGDefsElement>('defs#area-gradients-defs') || svg.querySelector<SVGDefsElement>('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      defs.id = 'area-gradients-defs';
      svg.insertBefore(defs, svg.firstChild);
    }

    const currentTheme = defs.getAttribute('data-theme');
    const targetTheme = isDarkMode ? 'dark' : 'light';
    if (currentTheme === targetTheme && defs.querySelector('#critical_path')) {
      return;
    }

    defs.setAttribute('data-theme', targetTheme);

    if (isDarkMode) {
      // 다크 모드용 radialGradient
      defs.innerHTML = `
        <radialGradient id="critical_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.6">
          <stop offset="10%" stop-color="#FF0000"></stop>
          <stop offset="70%" stop-color="#930000"></stop>
        </radialGradient>
        <radialGradient id="serious_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="10%" stop-color="#D735FF"></stop>
          <stop offset="70%" stop-color="#8200A2"></stop>
        </radialGradient>
        <radialGradient id="major_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.8">
          <stop offset="10%" stop-color="#E59500"></stop>
          <stop offset="70%" stop-color="#A76D00"></stop>
        </radialGradient>
        <radialGradient id="minor_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="10%" stop-color="#FFD900"></stop>
          <stop offset="70%" stop-color="#A68D00"></stop>
        </radialGradient>
        <radialGradient id="warning_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="10%" stop-color="#0095FF"></stop>
          <stop offset="70%" stop-color="#004298"></stop>
        </radialGradient>
        <radialGradient id="normal_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="10%" stop-color="#00C3F9"></stop>
          <stop offset="70%" stop-color="#0085A9"></stop>
        </radialGradient>
        <radialGradient id="active_path" cx="0.5" cy="0.5" r="0.6" gradientUnits="objectBoundingBox">
          <stop offset="10%" stop-color="#7D89A3"></stop>
          <stop offset="70%" stop-color="#7D89A3"></stop>
        </radialGradient>
      `;
    } else {
      // 라이트 모드용 radialGradient (피그마 디자인 스펙 반영)
      defs.innerHTML = `
        <radialGradient id="critical_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="#CA0000"></stop>
          <stop offset="100%" stop-color="#FF7171"></stop>
        </radialGradient>
        <radialGradient id="serious_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="#9447FF"></stop>
          <stop offset="100%" stop-color="#D4B5FF"></stop>
        </radialGradient>
        <radialGradient id="major_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.8">
          <stop offset="0%" stop-color="#FF6C11"></stop>
          <stop offset="100%" stop-color="#FFCEAF"></stop>
        </radialGradient>
        <radialGradient id="minor_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="#FFD900"></stop>
          <stop offset="100%" stop-color="#FFF5BD"></stop>
        </radialGradient>
        <radialGradient id="warning_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="#5D9EFF"></stop>
          <stop offset="100%" stop-color="#D0E3FF"></stop>
        </radialGradient>
        <radialGradient id="normal_path" gradientUnits="objectBoundingBox" cx="0.5" cy="0.5" r="0.7">
          <stop offset="0%" stop-color="#4BD8FF"></stop>
          <stop offset="100%" stop-color="#DFF8FF"></stop>
        </radialGradient>
        <radialGradient id="active_path" cx="0.5" cy="0.5" r="0.6" gradientUnits="objectBoundingBox">
          <stop offset="0%" stop-color="#7D89A3"></stop>
          <stop offset="100%" stop-color="#7D89A3"></stop>
        </radialGradient>
      `;
    }
  } catch (e) {
    // ignore
  }
};

export const MapContainer: React.FC<MapContainerProps> = ({
  zones,
  congestions,
  selectedZoneId,
  onSelectZone,
  onUpdateZone,
  mode,
  isDarkMode,
  onOpenGuide,
  onAddZoneComplete,
  creatingZoneType,
  setCreatingZoneType,
  focusTarget,
  onFocusHandled,
  onOpenCctv,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);

  const tileLayerRef = useRef<L.Layer | null>(null);
  const offlineBaseGroup = useRef<L.FeatureGroup | null>(null);
  const subwayLinesGroup = useRef<L.FeatureGroup | null>(null);
  const subwayStationsGroup = useRef<L.FeatureGroup | null>(null);
  const subwayEntrancesGroup = useRef<L.FeatureGroup | null>(null);
  const areaLayersGroup = useRef<L.FeatureGroup | null>(null);
  const zoneLayersGroup = useRef<L.FeatureGroup | null>(null);
  const editHandlesGroup = useRef<L.FeatureGroup | null>(null);
  const boundaryLayer = useRef<L.Polygon | null>(null);
  const outerMaskLayer = useRef<L.Polygon | null>(null);
  const drawingLayerGroup = useRef<L.FeatureGroup | null>(null);

  // Subway Layer state
  const [subwayConfig, setSubwayConfig] = useState<SubwayConfig>(DEFAULT_SUBWAY_CONFIG);
  const [isSubwayPanelOpen, setIsSubwayPanelOpen] = useState<boolean>(false);

  // Map state
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [mapBoundsTick, setMapBoundsTick] = useState<number>(0);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showCongestionLayers, setShowCongestionLayers] = useState<boolean>(true);
  const [showRoadNumbers, setShowRoadNumbers] = useState<boolean>(true);
  const [showBoundary, setShowBoundary] = useState<boolean>(true);
  const [dimOutside, setDimOutside] = useState<boolean>(true);
  const [tileErrorOccurred, setTileErrorOccurred] = useState<boolean>(false);

  // In-progress creation state for polygon drawing
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  // In-progress creation state for circle
  const [circleDraftCenter, setCircleDraftCenter] = useState<LatLng | null>(null);
  const [circleDraftRadius, setCircleDraftRadius] = useState<number>(30);

  // Latest props for map-level listeners registered once at init
  const zonesRef = useRef<ZoneData[]>(zones);
  zonesRef.current = zones;
  const onUpdateZoneRef = useRef(onUpdateZone);
  onUpdateZoneRef.current = onUpdateZone;
  const onSelectZoneRef = useRef(onSelectZone);
  onSelectZoneRef.current = onSelectZone;
  const onOpenCctvRef = useRef(onOpenCctv);
  onOpenCctvRef.current = onOpenCctv;
  const creatingZoneTypeRef = useRef(creatingZoneType);
  creatingZoneTypeRef.current = creatingZoneType;

  // Track active dragging to prevent destructive effect re-renders during interaction
  const isDraggingRef = useRef<boolean>(false);
  // Direct references to Leaflet zone layers for zero-overhead 60fps geometry updates
  const zoneLayersMap = useRef<Map<string, L.Circle | L.Polygon>>(new Map());
  const scannerMarkersMap = useRef<Map<string, L.Marker>>(new Map());
  // References to active area polygon and badge layers so animations and DOM nodes are preserved across data refreshes
  const areaLayersMap = useRef<Map<string, {
    polygon: L.Polygon;
    badgeMarker?: L.Marker;
    level: CongestionLevel;
    val: number;
    coordsKey: string;
    isOutline: boolean;
  }>>(new Map());
  const lastIsZoneLevelRef = useRef<boolean | null>(null);

  // CSS 클래스 전담 관리 레이어용 커스텀 SVG 렌더러: Leaflet의 내장 기본값(stroke="#3388ff", fill="#3388ff", fill-opacity="0.2") 주입을 원천 차단
  const cssSvgRendererRef = useRef<L.SVG | null>(null);
  if (!cssSvgRendererRef.current) {
    const customSvg = L.svg({ padding: 0.5 });
    (customSvg as any)._updateStyle = function (layer: L.Path) {
      const path = (layer as any)._path as SVGPathElement | undefined;
      const options = layer.options;
      if (!path) return;

      if (options.stroke && options.weight) {
        path.setAttribute('stroke-width', String(options.weight));
        path.setAttribute('stroke-linecap', options.lineCap || 'round');
        path.setAttribute('stroke-linejoin', options.lineJoin || 'round');
        if (options.dashArray) {
          path.setAttribute('stroke-dasharray', String(options.dashArray));
        } else {
          path.removeAttribute('stroke-dasharray');
        }
      }

      path.setAttribute('fill-rule', options.fillRule || 'evenodd');

      // Leaflet의 기본 하드코딩 인라인 속성을 깨끗하게 제거하여 CSS 클래스에서만 순수하게 제어되도록 보장
      path.removeAttribute('stroke');
      path.removeAttribute('stroke-opacity');
      path.removeAttribute('fill');
      path.removeAttribute('fill-opacity');
    };
    cssSvgRendererRef.current = customSvg;
  }
  // References to active edit handle markers for smooth synchronous updates
  const handleMarkersRef = useRef<{
    centroidMarker?: L.Marker;
    vertexMarkers: L.Marker[];
    midpointMarkers: L.Marker[];
    centerMarker?: L.Marker;
    radiusMarker?: L.Marker;
  }>({
    vertexMarkers: [],
    midpointMarkers: [],
  });

  // Whole-shape drag state (edit mode): zone snapshot + pointer position at drag start
  const shapeDragRef = useRef<{ zone: ZoneData; start: L.LatLng; lastTranslated?: ZoneData } | null>(null);
  const initialFitDone = useRef<boolean>(false);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [JONGNO_CENTER.lat, JONGNO_CENTER.lng],
      zoom: Math.max(13, DEFAULT_ZOOM),
      minZoom: 13, // 줌 13 이하로 축소 방지
      maxZoom: 20, // 줌 20까지 확대 허용
      zoomControl: false, // We render sleek custom controls
      attributionControl: false,
      zoomSnap: 0.5, // 0.5 단위 정밀 줌 스냅
      zoomDelta: 0.5, // 확대/축소 1스텝당 0.5
      wheelDebounceTime: 40,
      // Hard wall: prevent dragging/panning outside of the safe downloaded tile area
      maxBounds: OFFLINE_SAFE_PAN_BOUNDS,
      maxBoundsViscosity: 1.0, // 100% hard wall - prevents rubberbanding into blank space
    });

    leafletMap.current = map;

    // Custom scroll wheel handler: 마우스 휠 스크롤 1회당 정확히 0.5씩 확대/축소
    if (map.scrollWheelZoom) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (map.scrollWheelZoom as any)._performZoom = function () {
        const mapInstance = this._map;
        const zoom = mapInstance.getZoom();
        const snap = 0.5;

        mapInstance._stop();

        // 휠 스크롤 1회당 정확히 0.5 단위로 줌 이동
        const targetZoom = this._delta > 0 ? zoom + snap : zoom - snap;
        const snapped = Math.round(targetZoom / snap) * snap;
        const delta = mapInstance._limitZoom(snapped) - zoom;

        this._delta = 0;
        this._startTime = null;

        if (!delta) return;

        if (mapInstance.options.scrollWheelZoom === 'center') {
          mapInstance.setZoom(zoom + delta);
        } else {
          mapInstance.setZoomAround(this._lastMousePos, zoom + delta);
        }
      };
    }

    // 1. Custom Panes for strict Z-Index and Layer Level hierarchy:
    // tilePane (200) -> subwayLinesPane (250) -> subwayStationsPane (300) -> outerMaskPane (350) -> overlayPane (400) -> markerPane (600)
    const subwayLinesPane = map.createPane('subwayLinesPane');
    subwayLinesPane.style.zIndex = '250'; // On the map level, under the outer dimming mask

    const subwayStationsPane = map.createPane('subwayStationsPane');
    subwayStationsPane.style.zIndex = '300'; // Above subway lines, under outer dimming mask

    const outerMaskPane = map.createPane('outerMaskPane');
    outerMaskPane.style.zIndex = '350'; // Sits above subway lines & map tiles, but below zones & boundary
    outerMaskPane.style.pointerEvents = 'none';

    // Feature groups
    offlineBaseGroup.current = L.featureGroup().addTo(map);
    subwayLinesGroup.current = L.featureGroup().addTo(map);
    areaLayersGroup.current = L.featureGroup().addTo(map);
    zoneLayersGroup.current = L.featureGroup().addTo(map);
    subwayStationsGroup.current = L.featureGroup().addTo(map);
    subwayEntrancesGroup.current = L.featureGroup().addTo(map);
    editHandlesGroup.current = L.featureGroup().addTo(map);
    drawingLayerGroup.current = L.featureGroup().addTo(map);

    // Official administrative boundary of Jongno-gu
    // 다크 모드에서는 노란색 점선(#FACC15), 필터 해제된 원본 라이트 버전에서는 쨍한 파란색(#0066FF)으로 적응
    const initBoundaryColor = isDarkMode ? '#FACC15' : '#0066FF';
    const initMaskColor = isDarkMode ? '#000000' : '#0f172a';
    const initMaskOpacity = isDarkMode ? 0.52 : 0.38;

    // Outside dimming mask (World polygon with Jongno-gu hole)
    // 종로구 외곽 영역을 어둡게 처리하여 종로구가 한눈에 돋보이도록 반전 마스킹(Inverted Donut Mask) 적용
    outerMaskLayer.current = L.polygon([WORLD_MASK_RING, JONGNO_BOUNDARY], {
      pane: 'outerMaskPane',
      stroke: false,
      fillColor: initMaskColor,
      fillOpacity: initMaskOpacity,
      fillRule: 'evenodd',
      interactive: false,
    }).addTo(map);

    // Official administrative boundary of Jongno-gu
    boundaryLayer.current = L.polygon(JONGNO_BOUNDARY, {
      color: initBoundaryColor,
      dashArray: '6, 6',
      weight: 2,
      fill: false,
      interactive: false,
    }).addTo(map);

    // Event listeners: zoomend 시점에만 줌 레벨을 갱신하여 flyToBounds/줌인 도중 레이어가 중복 재생성되며 순간 왜곡되는 현상 방지
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('moveend', () => {
      setMapBoundsTick((t) => t + 1);
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('mouseout', () => {
      setMouseCoords(null);
    });

    // 빈 지도 배경 클릭 시 구역 선택 해제 (구역 생성 중이 아닐 때)
    map.on('click', () => {
      if (!creatingZoneTypeRef.current) {
        onSelectZoneRef.current('');
      }
    });

    // Zoom-out limit: strictly lock minZoom to 13 and keep pan boundaries solid
    const applyZoomLimit = () => {
      map.setMinZoom(13);
      map.setMaxBounds(OFFLINE_SAFE_PAN_BOUNDS);
    };

    // Initial view: fit all zones at the exact center of the map (once)
    const fitInitialView = () => {
      const size = map.getSize();
      if (initialFitDone.current || size.x === 0 || size.y === 0) return;
      const bounds = getZonesBounds(zonesRef.current);
      if (bounds) {
        map.fitBounds(bounds, { padding: FIT_PADDING, animate: false });
      }
      initialFitDone.current = true;
    };

    applyZoomLimit();
    fitInitialView();

    // Whole-shape drag (edit mode): started by mousedown on the selected zone layer
    const handleShapeDragMove = (e: L.LeafletMouseEvent) => {
      const drag = shapeDragRef.current;
      if (!drag) return;
      const dLat = e.latlng.lat - drag.start.lat;
      const dLng = e.latlng.lng - drag.start.lng;
      const translated = translateZone(drag.zone, dLat, dLng);
      drag.lastTranslated = translated;

      // Instantly update the zone polygon / circle layer at 60fps without React re-renders
      const layer = zoneLayersMap.current.get(drag.zone.id);
      if (layer) {
        if (translated.type === 'circle') {
          (layer as L.Circle).setLatLng([translated.center.lat, translated.center.lng]);
        } else if (translated.coordinates) {
          (layer as L.Polygon).setLatLngs(translated.coordinates);
        }
      }

      // Synchronously move the scanner marker (spot + name label) with the shape
      const sMarker = scannerMarkersMap.current.get(drag.zone.id);
      if (sMarker) {
        sMarker.setLatLng([translated.center.lat, translated.center.lng]);
      }

      // Synchronously move all active handle markers so they glide seamlessly with the shape
      const handles = handleMarkersRef.current;
      if (translated.type === 'polygon' && translated.coordinates) {
        if (handles.centroidMarker) {
          handles.centroidMarker.setLatLng([translated.center.lat, translated.center.lng]);
        }
        handles.vertexMarkers.forEach((vm, i) => {
          if (translated.coordinates && translated.coordinates[i]) {
            vm.setLatLng(translated.coordinates[i]);
          }
        });
        const n = translated.coordinates.length;
        handles.midpointMarkers.forEach((mm, i) => {
          if (translated.coordinates) {
            const nextI = (i + 1) % n;
            mm.setLatLng([
              (translated.coordinates[i][0] + translated.coordinates[nextI][0]) / 2,
              (translated.coordinates[i][1] + translated.coordinates[nextI][1]) / 2,
            ]);
          }
        });
      } else if (translated.type === 'circle') {
        if (handles.centerMarker) {
          handles.centerMarker.setLatLng([translated.center.lat, translated.center.lng]);
        }
        if (handles.radiusMarker) {
          const pt = getDestinationPoint(
            translated.center.lat,
            translated.center.lng,
            translated.radius || 200,
            90
          );
          handles.radiusMarker.setLatLng([pt.lat, pt.lng]);
        }
      }
    };

    const endShapeDrag = () => {
      const drag = shapeDragRef.current;
      if (!drag) return;
      isDraggingRef.current = false;
      shapeDragRef.current = null;
      map.dragging.enable();
      map.getContainer().classList.remove('zone-dragging');
      if (drag.lastTranslated) {
        onUpdateZoneRef.current(drag.lastTranslated);
      }
    };

    map.on('mousemove', handleShapeDragMove);
    map.on('mouseup', endShapeDrag);
    document.addEventListener('mouseup', endShapeDrag);

    // Invalidate size once DOM has painted
    setTimeout(() => {
      map.invalidateSize();
      applyZoomLimit();
      fitInitialView();
    }, 150);

    // Watch resize of container
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
      applyZoomLimit();
      fitInitialView();
    });
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener('mouseup', endShapeDrag);
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // 2. Handle Tile Layer updates - OpenFreeMap only:
  // Dark mode: Positron (https://tiles.openfreemap.org/styles/positron)
  // Light mode: Bright (https://tiles.openfreemap.org/styles/bright)
  useEffect(() => {
    if (!leafletMap.current) return;

    if (tileLayerRef.current) {
      try {
        leafletMap.current.removeLayer(tileLayerRef.current);
      } catch (e) {
        // ignore
      }
      tileLayerRef.current = null;
    }

    setTileErrorOccurred(false);

    const mapStyle = isDarkMode
      ? createDarkMapStyle(window.location.origin, undefined, { showRoadNumbers })
      : `${window.location.origin}/styles/bright.json`;

    try {
      const vectorLayer = maplibreGL({
        style: mapStyle,
      });
      vectorLayer.addTo(leafletMap.current);
      tileLayerRef.current = vectorLayer;
    } catch (err) {
      console.error('OpenFreeMap vector layer load failed:', err);
      setTileErrorOccurred(true);
    }

    leafletMap.current.invalidateSize();
  }, [isDarkMode]);

  // 2-2. Toggle Road Number Shields (도로 번호 표출 토글)
  useEffect(() => {
    if (!tileLayerRef.current) return;
    try {
      const maplibreMap = (tileLayerRef.current as any).getMaplibreMap?.();
      if (!maplibreMap) return;
      const visibility = showRoadNumbers ? 'visible' : 'none';
      const shieldLayers = [
        'highway-shield-non-us',
        'highway-shield-us-interstate',
        'road_shield_us',
      ];

      const applyVisibility = () => {
        shieldLayers.forEach((id) => {
          if (maplibreMap.getLayer(id)) {
            maplibreMap.setLayoutProperty(id, 'visibility', visibility);
          }
        });
      };

      if (maplibreMap.isStyleLoaded()) {
        applyVisibility();
      } else {
        maplibreMap.once('styledata', applyVisibility);
      }
    } catch (err) {
      console.error('Failed to toggle road shields:', err);
    }
  }, [showRoadNumbers]);

  // 3. Handle External Focus Target (fly to zone)
  useEffect(() => {
    if (focusTarget && leafletMap.current) {
      leafletMap.current.flyTo([focusTarget.lat, focusTarget.lng], 19, {
        duration: 1.2,
      });
      onFocusHandled();
    }
  }, [focusTarget, onFocusHandled]);

  // 3-2. Render Real Subway Lines (1px when zoom <= 15, 2px when zoom > 15)
  useEffect(() => {
    const linesGrp = subwayLinesGroup.current;
    if (!linesGrp) return;
    linesGrp.clearLayers();

    if (!subwayConfig.showLines) return;

    // 지하철 선 두께: 15 이하로 축소 시 1px로 얇게 변경, 16 이상 확대 시 2px 유지
    const baseWeight = currentZoom <= 15 ? 1 : 2;

    (subwayLinesData.features as any[]).forEach((feature) => {
      const shortName = feature.properties.shortName;
      if (subwayConfig.visibleLines[shortName] === false) return;

      const color = SUBWAY_LINE_COLORS[shortName] || feature.properties.color || '#303B94';
      const rawCoords = feature.geometry.coordinates;
      const segments: number[][][] =
        feature.geometry.type === 'LineString' ? [rawCoords] : rawCoords;

      segments.forEach((segment) => {
        const latlngs = segment.map((pt) => [pt[1], pt[0]] as [number, number]);

        // Clean single stroke (단선) at responsive weight
        const coreLine = L.polyline(latlngs, {
          pane: 'subwayLinesPane',
          color: color,
          weight: baseWeight,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
          interactive: true,
        });

        coreLine.bindTooltip(
          `<div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#fff;background:rgba(15,23,42,0.95);padding:4px 8px;border-radius:6px;border:1px solid rgba(255,255,255,0.25);box-shadow:0 3px 8px rgba(0,0,0,0.5);">
            <span style="background:${color};color:#fff;padding:1px 6px;border-radius:4px;font-size:11px;">${shortName}</span>
            <span>${feature.properties.name}</span>
          </div>`,
          { sticky: true, className: 'subway-tooltip' }
        );

        coreLine.on('mouseover', () => {
          coreLine.setStyle({ weight: baseWeight + 1.2, opacity: 1.0 });
        });
        coreLine.on('mouseout', () => {
          coreLine.setStyle({ weight: baseWeight, opacity: 0.95 });
        });

        coreLine.addTo(linesGrp);
      });
    });
  }, [subwayConfig.showLines, subwayConfig.visibleLines, currentZoom]);

  // 3-3. Render Real Subway Stations (Transfer Capsule with all Line Colors & Dynamic zoom scaling)
  useEffect(() => {
    const stnGrp = subwayStationsGroup.current;
    if (!stnGrp) return;
    stnGrp.clearLayers();

    if (!subwayConfig.showStations) return;

    // Zoom-responsive station dimensions:
    // Zoom 13 (화면 축소): 단일역 6px, 환승 캡슐 4.5px 닷 (화면 축소 시에도 깔끔)
    // Zoom 14: 단일역 8px, 환승 캡슐 6px 닷
    // Zoom 15: 단일역 11px, 환승 캡슐 7.5px 닷
    // Zoom 16+: 단일역 14px, 환승 캡슐 9px 닷
    const isZoomOut = currentZoom <= 13;
    const isMidZoom = currentZoom === 14;

    (subwayStationsData.features as any[]).forEach((feature) => {
      const props = feature.properties;
      const stationLines: string[] = props.lines || [];
      const visibleStationLines: string[] = stationLines.filter(
        (l: string) => subwayConfig.visibleLines[l] !== false
      );
      if (visibleStationLines.length === 0) return;

      const [lon, lat] = feature.geometry.coordinates;
      const isMultiLine = visibleStationLines.length > 1;
      const primaryLine = visibleStationLines[0];
      const primaryColor = SUBWAY_LINE_COLORS[primaryLine] || props.primaryColor || '#303B94';

      // Smart label density:
      // At zoom 13: show transfer stations + core Jongno stations only (to prevent clutter)
      // At zoom 14+: show all stations cleanly
      const shouldShowLabel =
        subwayConfig.showStationLabels &&
        (currentZoom >= 14 || isMultiLine || props.inJongno);

      const displayName = props.name?.endsWith('역') ? props.name : `${props.name || props.cleanName}역`;

      const labelHtml = shouldShowLabel
        ? `<div class="subway-station-label ${isZoomOut ? 'zoom-out' : isMidZoom ? 'zoom-mid' : ''}">${displayName}</div>`
        : '';

      let markerHtml = '';
      if (isMultiLine) {
        // Multi-line transfer capsule pill (src/css/subwayStation.css 적용)
        const dotElements = visibleStationLines
          .map((lineName: string) => {
            const col = SUBWAY_LINE_COLORS[lineName] || primaryColor;
            return `<span class="subway-transfer-dot" style="background-color: ${col};"></span>`;
          })
          .join('');

        markerHtml = `
          <div class="subway-transfer-pill">
            ${dotElements}
            ${labelHtml}
          </div>
        `;
      } else {
        // Single station circle (src/css/subwayStation.css 적용)
        markerHtml = `
          <div class="subway-single-station" style="border-color: ${primaryColor};">
            ${labelHtml}
          </div>
        `;
      }

      const icon = L.divIcon({
        className: `subway-station-badge ${isMultiLine ? 'transfer' : 'single'}`,
        html: markerHtml,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = L.marker([lat, lon], {
        pane: 'subwayStationsPane',
        icon,
        zIndexOffset: isMultiLine ? 600 : 500,
      });

      // Interactive popup with transfer badges
      const linePills = props.lines
        .map((lineName: string) => {
          const color = SUBWAY_LINE_COLORS[lineName] || primaryColor;
          return `<span style="background:${color};color:#FFFFFF;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;box-shadow:0 1px 2px rgba(0,0,0,0.25);">${lineName}</span>`;
        })
        .join(' ');

      const popupHtml = `
        <div style="padding: 10px 12px; min-width: 210px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 15px; color: #0f172a;">${displayName}</strong>
            ${isMultiLine
          ? '<span style="background: #fef3c7; color: #b45309; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde68a;">환승역</span>'
          : ''
        }
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 8px;">
            ${props.district} ${props.name_en ? '· ' + props.name_en : ''}
          </div>
          <div style="display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 8px;">
            ${linePills}
          </div>
          <div style="font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 6px;">
            OpenStreetMap 실제 공간정보 기반 (ODbL)
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { className: 'custom-subway-popup' });
      marker.addTo(stnGrp);
    });
  }, [subwayConfig.showStations, subwayConfig.showStationLabels, subwayConfig.visibleLines, currentZoom]);

  // 3-4. Render Real Subway Entrances / Exits (Zoom >= 17)
  // 지도 확대(Zoom 17 이상) 시 지하철역 출구 번호(1, 2, 2-1, 15 등)를 노란색 원형 뱃지로 표출
  useEffect(() => {
    const entGrp = subwayEntrancesGroup.current;
    if (!entGrp) return;
    entGrp.clearLayers();

    // 17 미만 축소 시에는 맵을 깔끔하게 유지하기 위해 출구 숨김 (Zoom >= 17 일 때만 표출)
    if (!subwayConfig.showStations || currentZoom < 17) return;

    const bounds = leafletMap.current?.getBounds();
    const isSuperZoom = currentZoom >= 18;
    const badgeSize = isSuperZoom ? 22 : 19;
    const fontSize = isSuperZoom ? '10.5px' : '9.5px';
    const anchor: [number, number] = [badgeSize / 2, badgeSize / 2];

    (subwayEntrancesData.features as any[]).forEach((feature) => {
      const [lon, lat] = feature.geometry.coordinates;
      // 현재 화면 및 약간의 여유 영역 내의 출구만 고속 렌더링
      if (bounds && !bounds.pad(0.15).contains([lat, lon])) return;

      const props = feature.properties;
      const ref = props.ref || '';
      if (!ref) return;

      const desc = props.desc || `${ref}번 출구`;

      const markerHtml = `
        <div style="
          width: ${badgeSize}px;
          height: ${badgeSize}px;
          border-radius: 50%;
          background: #FFD200;
          border: 1.5px solid #0f172a;
          color: #0f172a;
          font-weight: 800;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: ${fontSize};
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.45);
          cursor: pointer;
          letter-spacing: -0.5px;
          transition: transform 0.1s ease;
        ">
          ${ref}
        </div>
      `;

      const icon = L.divIcon({
        className: 'subway-exit-badge',
        html: markerHtml,
        iconSize: [badgeSize, badgeSize],
        iconAnchor: anchor,
      });

      const marker = L.marker([lat, lon], {
        pane: 'subwayStationsPane',
        icon,
        zIndexOffset: 700,
      });

      marker.bindTooltip(
        `<div style="font-weight:700;font-size:11px;color:#fff;background:rgba(15,23,42,0.95);padding:3px 7px;border-radius:4px;border:1px solid rgba(255,255,255,0.25);box-shadow:0 2px 6px rgba(0,0,0,0.4);white-space:nowrap;">
          ${desc}
        </div>`,
        { direction: 'top', offset: [0, -badgeSize / 2 - 2], className: 'subway-tooltip' }
      );

      marker.addTo(entGrp);
    });
  }, [subwayConfig.showStations, currentZoom, mapBoundsTick]);

  // 4. Handle Boundary Visibility and Outside Dimming Mask
  // 다크 모드에서는 노란색 점선(#FACC15), 라이트 버전에서는 쨍한 파란색(#0066FF)으로 눈에 잘 띄도록 자동 적응
  // 종로구 외곽은 어둡게 음영 처리(outerMaskLayer)하여 종로구 영역이 집중 조명되도록 처리
  useEffect(() => {
    if (!boundaryLayer.current) return;

    const boundaryColor = isDarkMode ? '#FACC15' : '#0066FF';
    const maskFillColor = isDarkMode ? '#000000' : '#0f172a';
    const maskOpacity = isDarkMode ? 0.52 : 0.38;

    if (showBoundary) {
      boundaryLayer.current.setStyle({
        color: boundaryColor,
        dashArray: '6, 6',
        weight: 2,
        fill: false,
        opacity: 0.95,
      });
    } else {
      boundaryLayer.current.setStyle({ opacity: 0 });
    }

    if (outerMaskLayer.current) {
      if (showBoundary && dimOutside) {
        outerMaskLayer.current.setStyle({
          fillColor: maskFillColor,
          fillOpacity: maskOpacity,
        });
      } else {
        outerMaskLayer.current.setStyle({
          fillOpacity: 0,
        });
      }
    }
  }, [showBoundary, dimOutside, isDarkMode]);

  // 4-1. Map Tilepane & Background color synchronization
  useEffect(() => {
    if (!leafletMap.current) return;
    const tilePane = leafletMap.current.getPane('tilePane');
    const container = leafletMap.current.getContainer();

    if (tilePane) {
      tilePane.style.filter = 'none';
      tilePane.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#f8fafc';
    }
    if (container) {
      container.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#f8fafc';
    }
  }, [isDarkMode]);

  // 5. Render Areas (< 16.0 zoom) and Scanner Zones (>= 16.0 zoom)
  // 스캐너 하나당 구역(zone), 구역들이 모이면 자동으로 꼭짓점을 이어 영역(Area)으로 생성
  // 평소 (Zoom < 16.0) 에는 영역(Area)으로 표출, Zoom >= 16.0 확대 시 개별 구역(zone)의 혼잡도 히트+호버 정보 표출
  useEffect(() => {
    const map = leafletMap.current;
    const zoneGroup = zoneLayersGroup.current;
    const areaGroup = areaLayersGroup.current;
    if (!map || !zoneGroup || !areaGroup) return;

    if (isDraggingRef.current || (map as any)._animatingZoom) return;

    if (!showCongestionLayers) {
      zoneGroup.clearLayers();
      areaGroup.clearLayers();
      zoneLayersMap.current.clear();
      scannerMarkersMap.current.clear();
      areaLayersMap.current.clear();
      lastIsZoneLevelRef.current = null;
      return;
    }

    const isZoneLevel = currentZoom >= 16.0;
    const zoneLevelChanged = lastIsZoneLevelRef.current !== isZoneLevel;
    lastIsZoneLevelRef.current = isZoneLevel;

    if (zoneLevelChanged) {
      zoneGroup.clearLayers();
      areaGroup.clearLayers();
      zoneLayersMap.current.clear();
      scannerMarkersMap.current.clear();
      areaLayersMap.current.clear();
    }

    // 5-1. Render 4 Core Areas (Convex Hull automatically generated from zones)
    // 구역(zone)들이 모여있는 가장자리를 꼭짓점처럼 자동으로 이어 영역 다각형을 동적 계산
    // 혼잡도 단계가 높을수록 상단(나중에 렌더링)에 표출되도록 정렬
    const areaDataList = AREAS.map((area) => {
      const areaZones = zones.filter((z) => (z.areaId === area.id || z.areaName === area.name) && z.visible);
      let maxLevel: CongestionLevel = 1;
      let maxVal = 0;
      areaZones.forEach((z) => {
        const c = congestions[z.id];
        const val = c ? c.value : 30;
        const lvl = (c ? c.level : determineCongestionLevel(val)) as CongestionLevel;
        if (lvl > maxLevel || (lvl === maxLevel && val > maxVal)) {
          maxLevel = lvl;
          maxVal = val;
        }
      });
      return {
        area,
        areaZones,
        maxLevel,
        maxVal,
      };
    }).filter((item) => item.areaZones.length > 0);

    // 혼잡도 레벨 오름차순 정렬 (높은 단계가 나중에 그려져 상단에 위치)
    areaDataList.sort((a, b) => (a.maxLevel !== b.maxLevel ? a.maxLevel - b.maxLevel : a.maxVal - b.maxVal));

    const activeAreaIds = new Set<string>();

    areaDataList.forEach(({ area, areaZones, maxLevel, maxVal }) => {
      const areaLevel = maxLevel;
      const levelInfo = CONGESTION_LEVEL_MAP[areaLevel];
      const svgUrl = getStateSvgUrl(maxVal);

      // 각 구역(zone) 스캐너 원형들의 외곽을 감싸는 볼록 껍질 다각형 자동 생성 (22m 버퍼)
      const hullCoords = computeAreaHullFromZones(areaZones, 22);
      if (hullCoords.length < 3) return;

      const centroid = calculateCentroid(hullCoords);
      const coordsKey = hullCoords.map((c) => `${c[0].toFixed(5)},${c[1].toFixed(5)}`).join(';');
      activeAreaIds.add(area.id);

      const existing = areaLayersMap.current.get(area.id);

      if (!isZoneLevel) {
        // Zoom < 16.0: 영역(Area) 다각형 + 중앙 상태 뱃지 표출
        const gradientId = getAreaGradientId(areaLevel);

        if (existing && !existing.isOutline) {
          // 기존 SVG path 및 마커 DOM 요소 재사용 (CSS 애니메이션 리셋 방지!)
          if (existing.coordsKey !== coordsKey) {
            existing.polygon.setLatLngs(hullCoords);
            if (existing.badgeMarker) {
              existing.badgeMarker.setLatLng([centroid.lat, centroid.lng]);
            }
            existing.coordsKey = coordsKey;
          }

          const pathEl = (existing.polygon as any)._path as SVGPathElement | undefined;
          if (pathEl) {
            // Leaflet 기본 인라인 속성(#3388ff 등) 제거
            pathEl.removeAttribute('stroke');
            pathEl.removeAttribute('stroke-opacity');
            pathEl.removeAttribute('fill');
            pathEl.removeAttribute('fill-opacity');
          }

          if (existing.level !== areaLevel) {
            const nextClass = `leaflet-interactive area-polygon-interactive area-polygon-gradient area-level-${areaLevel} area-gradient-${gradientId}`;
            if (pathEl) {
              pathEl.setAttribute('class', nextClass);
            }
            existing.level = areaLevel;
          }

          if (existing.val !== maxVal || existing.level !== areaLevel) {
            const badgeHtml = `
              <div class="area-badge-card">
                <img src="${svgUrl}" class="area-badge-icon" alt="${levelInfo.name}" />
                <div class="area-badge-title">${area.name}</div>
              </div>
            `;
            const badgeIcon = L.divIcon({
              className: 'area-summary-div-icon',
              html: badgeHtml,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            });
            if (existing.badgeMarker) {
              existing.badgeMarker.setIcon(badgeIcon);
              existing.badgeMarker.setZIndexOffset(800 + areaLevel * 100 + Math.round(maxVal));
            }
            existing.val = maxVal;
          }
        } else {
          if (existing) {
            areaGroup.removeLayer(existing.polygon);
            if (existing.badgeMarker) areaGroup.removeLayer(existing.badgeMarker);
            areaLayersMap.current.delete(area.id);
          }

          // 색상/채우기는 areaBadge.css의 클래스(area-level, area-gradient)에서 전담 관리
          const areaPolygon = L.polygon(hullCoords, {
            renderer: cssSvgRendererRef.current ?? undefined,
            weight: 2,
            className: `area-polygon-interactive area-polygon-gradient area-level-${areaLevel} area-gradient-${gradientId}`,
          });

          const handleAreaClick = (e?: L.LeafletMouseEvent) => {
            if (e) L.DomEvent.stopPropagation(e);
            map.flyToBounds(areaPolygon.getBounds(), {
              padding: [45, 45],
              maxZoom: 18.25,
              duration: 0.8,
            });
          };

          areaPolygon.on('click', handleAreaClick);

          const badgeHtml = `
            <div class="area-badge-card">
              <img src="${svgUrl}" class="area-badge-icon" alt="${levelInfo.name}" />
              <div class="area-badge-title">${area.name}</div>
            </div>
          `;

          const badgeIcon = L.divIcon({
            className: 'area-summary-div-icon',
            html: badgeHtml,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          const badgeMarker = L.marker([centroid.lat, centroid.lng], {
            icon: badgeIcon,
            zIndexOffset: 800 + areaLevel * 100 + Math.round(maxVal),
          });

          badgeMarker.on('click', handleAreaClick);

          areaPolygon.addTo(areaGroup);
          badgeMarker.addTo(areaGroup);

          // 추가 직후 인라인 속성 정리
          const pathEl = (areaPolygon as any)._path as SVGPathElement | undefined;
          if (pathEl) {
            pathEl.removeAttribute('stroke');
            pathEl.removeAttribute('stroke-opacity');
            pathEl.removeAttribute('fill');
            pathEl.removeAttribute('fill-opacity');
          }

          areaLayersMap.current.set(area.id, {
            polygon: areaPolygon,
            badgeMarker,
            level: areaLevel,
            val: maxVal,
            coordsKey,
            isOutline: false,
          });
        }
      } else {
        // Zoom >= 16.0: 지도가 확대되어 구역이 보여질 때는 영역의 점선 테두리만 남기고 색상/투명도는 CSS(area-polygon-outline)에서 전담 관리
        const outlineClassName = `area-polygon-outline area-outline-level-${areaLevel}`;
        if (existing && existing.isOutline) {
          if (existing.coordsKey !== coordsKey) {
            existing.polygon.setLatLngs(hullCoords);
            existing.coordsKey = coordsKey;
          }

          const pathEl = (existing.polygon as any)._path as SVGPathElement | undefined;
          if (pathEl) {
            pathEl.removeAttribute('stroke');
            pathEl.removeAttribute('stroke-opacity');
            pathEl.removeAttribute('fill');
            pathEl.removeAttribute('fill-opacity');
          }

          if (existing.level !== areaLevel) {
            const nextOutlineClass = `leaflet-interactive ${outlineClassName}`;
            if (pathEl) {
              pathEl.setAttribute('class', nextOutlineClass);
            }
            existing.level = areaLevel;
          }
        } else {
          if (existing) {
            areaGroup.removeLayer(existing.polygon);
            if (existing.badgeMarker) areaGroup.removeLayer(existing.badgeMarker);
            areaLayersMap.current.delete(area.id);
          }
          const subtleAreaOutline = L.polygon(hullCoords, {
            renderer: cssSvgRendererRef.current ?? undefined,
            weight: 2,
            dashArray: '6, 6',
            fill: false,
            interactive: false,
            className: outlineClassName,
          });
          subtleAreaOutline.addTo(areaGroup);

          const pathEl = (subtleAreaOutline as any)._path as SVGPathElement | undefined;
          if (pathEl) {
            pathEl.removeAttribute('stroke');
            pathEl.removeAttribute('stroke-opacity');
            pathEl.removeAttribute('fill');
            pathEl.removeAttribute('fill-opacity');
          }

          areaLayersMap.current.set(area.id, {
            polygon: subtleAreaOutline,
            level: areaLevel,
            val: maxVal,
            coordsKey,
            isOutline: true,
          });
        }
      }
    });

    // Cleanup any removed areas
    for (const [id, layerData] of areaLayersMap.current.entries()) {
      if (!activeAreaIds.has(id)) {
        areaGroup.removeLayer(layerData.polygon);
        if (layerData.badgeMarker) areaGroup.removeLayer(layerData.badgeMarker);
        areaLayersMap.current.delete(id);
      }
    }

    injectAreaGradients(map, isDarkMode);

    // 5-2. Render Scanner Zones (Zoom >= 16 확대 시 표출)
    // 평소에는 구역명 + 블러처리 된 히트(혼잡도 컬러) 표출
    // 호버 시에는 5번째 이미지처럼 말풍선(SVG 이미지 + 인원수 + 밀집도) 표출
    if (isZoneLevel) {
      const activeZoneIds = new Set<string>();

      // 혼잡도 단계(1~6)와 수치(0~100)가 높을수록 상단(나중에 렌더링)에 표출
      const sortedZones = [...zones].sort((a, b) => {
        // 선택된 구역은 무조건 최상단에 표출
        if (a.id === selectedZoneId) return 1;
        if (b.id === selectedZoneId) return -1;

        const valA = congestions[a.id]?.value ?? 30;
        const levelA = congestions[a.id]?.level ?? determineCongestionLevel(valA);

        const valB = congestions[b.id]?.value ?? 30;
        const levelB = congestions[b.id]?.level ?? determineCongestionLevel(valB);

        if (levelA !== levelB) {
          return levelA - levelB;
        }
        return valA - valB;
      });

      sortedZones.forEach((zone) => {
        if (!zone.visible) return;
        activeZoneIds.add(zone.id);

        const isSelected = selectedZoneId === zone.id;
        const isShapeDraggable = mode === 'edit' && isSelected && !creatingZoneType;
        const c = congestions[zone.id];
        const val = c ? c.value : 30;
        const level = c ? c.level : determineCongestionLevel(val);
        const levelInfo = CONGESTION_LEVEL_MAP[level];
        const isSerious = level === 5;
        const isEmergency = level === 6;

        const visitors = c?.estimatedVisitors || Math.round((zone.capacity || 3000) * val / 100);
        const density = Math.max(0.2, (val * 0.015 + 0.35));

        const svgUrl = getStateSvgUrl(val);
        const glowColor = zone.customColor || levelInfo.color;
        const displayName = (zone.name || zone.scannerName || '').replace(/^cctv\s*/i, '').trim();

        // 줌 17 기준 크기 유지 보정: 줌 17 미만(예: 16.5, 16.0)에서도 줌 17일 때 정도의 시각적 크기를 그대로 유지하도록 스케일 보정
        const zoomNow = map.getZoom();
        const zoomScaleFactor = zoomNow < 17.0 ? Math.pow(2, 17.0 - zoomNow) : 1;
        const effectiveRadius = (zone.radius || 30) * zoomScaleFactor;

        const circleClasses = [
          'zone-circle-coverage',
          `zone-circle-level-${level}`,
          isEmergency ? 'zone-circle-emergency' : '',
          isSerious ? 'zone-circle-serious' : '',
          isShapeDraggable ? 'zone-shape-draggable' : '',
        ].filter(Boolean).join(' ');

        // 혼잡도 단계(1~6)와 수치에 따라 zIndexOffset 비례 설정 (높은 단계일수록 상단)
        const markerZIndexOffset = isSelected
          ? 95000
          : isEmergency
            ? 9000 + Math.round(val)
            : isSerious
              ? 8500 + Math.round(val)
              : level * 1000 + Math.round(val);

        // 구역 반경(zone.radius)에 비례하는 픽셀 직경 계산하여 혼잡도 그라데이션 동적 확장
        // 줌 16.5에서도 줌 17일 때의 시각적 픽셀 직경(최소 28px 이상)을 유지하도록 effectiveRadius 사용
        const centerPt = map.latLngToLayerPoint([zone.center.lat, zone.center.lng]);
        const edgePt = map.latLngToLayerPoint(getDestinationPoint(zone.center.lat, zone.center.lng, effectiveRadius, 90));
        const dynamicRadiusPx = Math.max(28, Math.round(Math.abs(edgePt.x - centerPt.x)));
        const dynamicDiameterPx = dynamicRadiusPx * 2;
        const glowBlurPx = Math.max(4, Math.min(22, Math.round(dynamicRadiusPx * 0.14)));

        // 단계별 투명도(LEVEL_HEAT_OPACITY)를 적용하여 아래쪽 지도 도로/골목길/건물명이 선명하게 투과
        const heatOp = LEVEL_HEAT_OPACITY[level] || LEVEL_HEAT_OPACITY[1];
        const cCenter = hexToRgba(glowColor, heatOp.peak);
        const cMid = hexToRgba(glowColor, heatOp.mid);
        const cOuter = hexToRgba(glowColor, heatOp.outer);
        const cZero = hexToRgba(glowColor, 0);

        // --- 기존 마커 및 원형 레이어 재사용 검사 (시뮬레이션 중 DOM 재생성 및 CSS 애니메이션 리셋 방지) ---
        const existingMarker = scannerMarkersMap.current.get(zone.id);
        const existingCircle = zoneLayersMap.current.get(zone.id) as L.Circle | undefined;

        if (existingMarker && existingCircle) {
          // 1. 기존 원형 구역 레이어 갱신
          existingCircle.setLatLng([zone.center.lat, zone.center.lng]);
          existingCircle.setRadius(effectiveRadius);
          existingCircle.setStyle({
            stroke: isSelected,
            color: '#2563EB',
            fillColor: glowColor,
          });

          const circlePathEl = (existingCircle as any)._path as SVGPathElement | undefined;
          if (circlePathEl) {
            const currentClass = circlePathEl.getAttribute('class') || '';
            const targetClass = `leaflet-interactive ${circleClasses}`;
            if (currentClass !== targetClass) {
              circlePathEl.setAttribute('class', targetClass);
            }
          }

          if (isSelected) {
            existingCircle.bringToFront();
          }

          // 2. 기존 마커 갱신 (Z-Index 및 위치)
          (existingMarker as any)._baseZIndexOffset = markerZIndexOffset;
          existingMarker.setZIndexOffset(markerZIndexOffset);
          existingMarker.setLatLng([zone.center.lat, zone.center.lng]);

          // 3. 기존 마커 DOM 노드 갱신
          const markerEl = existingMarker.getElement();
          if (markerEl) {
            const nodeEl = markerEl.querySelector<HTMLElement>('.scanner-zone-node');
            if (nodeEl) {
              const targetNodeClass = `scanner-zone-node level-${level} ${isSelected ? 'selected' : ''} ${isSerious ? 'is-serious' : ''} ${isEmergency ? 'is-emergency' : ''}`;
              if (nodeEl.className !== targetNodeClass) {
                nodeEl.className = targetNodeClass;
              }

              // 혼잡도 그라데이션 (단계 또는 줌 픽셀 직경이 변했을 때만 속성 갱신하여 CSS 애니메이션 보존)
              const glowEl = nodeEl.querySelector<HTMLElement>('.scanner-heat-glow');
              if (glowEl) {
                const prevLevel = glowEl.getAttribute('data-level');
                const prevRadius = glowEl.getAttribute('data-radius-px');

                if (prevLevel !== String(level)) {
                  glowEl.style.background = `radial-gradient(circle, ${cCenter} 0%, ${cMid} 35%, ${cOuter} 70%, ${cZero} 100%)`;
                  glowEl.setAttribute('data-level', String(level));
                  glowEl.classList.toggle('emergency-glow', isEmergency);
                }

                if (prevRadius !== String(dynamicRadiusPx)) {
                  glowEl.style.top = `-${dynamicRadiusPx}px`;
                  glowEl.style.left = `-${dynamicRadiusPx}px`;
                  glowEl.style.width = `${dynamicDiameterPx}px`;
                  glowEl.style.height = `${dynamicDiameterPx}px`;
                  glowEl.style.filter = `blur(${glowBlurPx}px)`;
                  glowEl.setAttribute('data-radius-px', String(dynamicRadiusPx));
                }
              }

              // 호버 말풍선 내용 수치 갱신
              const bubbleEl = nodeEl.querySelector<HTMLElement>('.scanner-hover-bubble');
              if (bubbleEl) {
                const statusImg = bubbleEl.querySelector<HTMLImageElement>('.scanner-status-img');
                if (statusImg && !statusImg.src.endsWith(svgUrl)) {
                  statusImg.src = svgUrl;
                }
                const visitorsSpan = bubbleEl.querySelector<HTMLSpanElement>('.scanner-visitors-count');
                if (visitorsSpan) {
                  visitorsSpan.textContent = `인원 ${visitors.toLocaleString()}명`;
                }
                const densitySpan = bubbleEl.querySelector<HTMLSpanElement>('.scanner-density-count');
                if (densitySpan) {
                  densitySpan.textContent = `밀집 ${density.toFixed(2)}명/㎡`;
                }
              }
            }
          }

          return;
        }

        if (existingMarker && !existingCircle) {
          zoneGroup.removeLayer(existingMarker);
          scannerMarkersMap.current.delete(zone.id);
        }
        if (existingCircle && !existingMarker) {
          zoneGroup.removeLayer(existingCircle);
          zoneLayersMap.current.delete(zone.id);
        }

        // --- 신규 마커 및 원형 레이어 생성 (최초 1회 또는 누락 시에만 실행) ---
        const circleCoverage = L.circle([zone.center.lat, zone.center.lng], {
          radius: effectiveRadius,
          stroke: isSelected,
          color: '#2563EB',
          weight: 2.5,
          dashArray: '4, 4',
          fill: true,
          fillColor: glowColor,
          fillOpacity: 0.001,
          className: circleClasses || undefined,
        });

        zoneLayersMap.current.set(zone.id, circleCoverage);

        if (isShapeDraggable) {
          circleCoverage.on('mousedown', (e: L.LeafletMouseEvent) => {
            if (e.originalEvent.button !== 0) return;
            L.DomEvent.stop(e.originalEvent);
            isDraggingRef.current = true;
            map.dragging.disable();
            map.closePopup();
            shapeDragRef.current = { zone, start: e.latlng, lastTranslated: zone };
            map.getContainer().classList.add('zone-dragging');
          });
        }

        circleCoverage.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onSelectZone(zone.id);
        });

        circleCoverage.on('mouseover', () => {
          const marker = scannerMarkersMap.current.get(zone.id);
          if (marker) {
            marker.setZIndexOffset(999999);
            const el = marker.getElement();
            if (el) el.style.zIndex = '999999';
          }
        });
        circleCoverage.on('mouseout', () => {
          const marker = scannerMarkersMap.current.get(zone.id);
          if (marker) {
            const baseOffset = (marker as any)._baseZIndexOffset ?? markerZIndexOffset;
            marker.setZIndexOffset(baseOffset);
            const el = marker.getElement();
            if (el) el.style.zIndex = '';
          }
        });

        circleCoverage.addTo(zoneGroup);
        if (isSelected) {
          circleCoverage.bringToFront();
        }

        // 스캐너 마커 (구역 반경 혼잡도 그라데이션 + 정중앙 뱃지 + 아래쪽 구역명 + 관제모드에서만 호버 말풍선)
        const isEditMode = mode === 'edit';
        let spotBg = '#0F172A';
        let spotBorder = '1.5px solid #FFFFFF';
        let spotShadow = '0 2px 6px rgba(0,0,0,0.45)';
        let spotCursor = 'pointer';
        let spotTitle = '';
        let spotIconSvg = '';

        if (!isEditMode) {
          spotTitle = `${displayName} CCTV 실시간 영상 관제 (클릭 시 화면 표출)`;
          spotIconSvg = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m22 8-6 4 6 4V8Z"/>
              <rect width="14" height="12" x="2" y="6" rx="2" ry="2"/>
            </svg>
          `;
        } else {
          if (isSelected) {
            spotBg = '#2563EB';
            spotBorder = '2px solid #FFFFFF';
            spotShadow = '0 0 0 3.5px rgba(37, 99, 235, 0.45), 0 3px 8px rgba(0,0,0,0.5)';
            spotCursor = 'grab';
            spotTitle = `${displayName} 스마트스캐너 (선택됨: 드래그하여 상하좌우 이동)`;
            spotIconSvg = `
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 9 2 12 5 15"/>
                <polyline points="9 5 12 2 15 5"/>
                <polyline points="15 19 12 22 9 19"/>
                <polyline points="19 9 22 12 19 15"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <line x1="12" y1="2" x2="12" y2="22"/>
              </svg>
            `;
          } else {
            spotBg = '#0F172A';
            spotBorder = '1.5px solid #38BDF8';
            spotShadow = '0 2px 6px rgba(0,0,0,0.45)';
            spotCursor = 'pointer';
            spotTitle = `${displayName} 스마트스캐너 (클릭하여 구역 선택)`;
            spotIconSvg = getSmartScannerSvgString(15, 15, '#38BDF8', 2.2);
          }
        }

        const hoverBubbleHtml = mode === 'view' ? `
          <!-- 2. 호버 시 표출되는 혼잡도 정보 말풍선 (관제 모드에서만 표출) -->
          <div class="scanner-hover-bubble" style="
            position: absolute;
            bottom: 18px;
            left: 0;
            background: #FFFFFF;
            border-radius: 12px;
            padding: 5px 9px;
            box-shadow: 0 4px 18px rgba(0,0,0,0.32);
            border: 1px solid rgba(0,0,0,0.08);
            display: flex;
            align-items: center;
            gap: 8px;
            white-space: nowrap;
            z-index: 10000;
            pointer-events: auto;
            cursor: pointer;
          ">
            <img class="scanner-status-img" src="${svgUrl}" style="width: 32px; height: 38px; object-fit: contain; flex-shrink: 0;" alt="상태" />
            <div style="display: flex; flex-direction: column; text-align: left; line-height: 1.25;">
              <span class="scanner-visitors-count" style="font-size: 11px; font-weight: 700; color: #0F172A;">인원 ${visitors.toLocaleString()}명</span>
              <span class="scanner-density-count" style="font-size: 10px; font-weight: 600; color: #64748B;">밀집 ${density.toFixed(2)}명/㎡</span>
            </div>
            <!-- 말풍선 하단 꼬리 -->
            <div style="
              position: absolute;
              bottom: -5px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 5px solid #FFFFFF;
            "></div>
          </div>
        ` : '';

        const markerHtml = `
          <div class="scanner-zone-node level-${level} ${isSelected ? 'selected' : ''} ${isSerious ? 'is-serious' : ''} ${isEmergency ? 'is-emergency' : ''}" data-zone-id="${zone.id}">
            <!-- 1. 블러처리 된 히트 (구역 반경과 일치하게 확장되며, 단계별 투명도로 지도 도로/골목명이 선명하게 투과) -->
            <div class="scanner-heat-glow leaflet-interactive ${isEmergency ? 'emergency-glow' : ''}"
              data-level="${level}"
              data-radius-px="${dynamicRadiusPx}"
              style="
              position: absolute;
              top: -${dynamicRadiusPx}px;
              left: -${dynamicRadiusPx}px;
              width: ${dynamicDiameterPx}px;
              height: ${dynamicDiameterPx}px;
              border-radius: 50%;
              background: radial-gradient(circle, ${cCenter} 0%, ${cMid} 35%, ${cOuter} 70%, ${cZero} 100%);
              filter: blur(${glowBlurPx}px);
              pointer-events: none;
              z-index: 1;
            "></div>

            ${hoverBubbleHtml}

            <!-- 3. 정중앙 스팟 (관제모드: CCTV, 편집모드 미선택: 스마트스캐너, 편집모드 선택: 4방향 이동) -->
            <div class="scanner-center-spot" data-spot-state="${mode}_${isSelected ? 'selected' : 'normal'}" title="${spotTitle}" style="
              position: absolute;
              top: -13px;
              left: -13px;
              width: 26px;
              height: 26px;
              border-radius: 50%;
              background: ${spotBg};
              border: ${spotBorder};
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: ${spotShadow};
              cursor: ${spotCursor};
              z-index: 10;
              transition: transform 0.15s ease, background-color 0.2s ease;
            ">
              ${spotIconSvg}
            </div>

            <!-- 4. 정중앙 스팟 바로 아래쪽에 표출되는 구역명 (스마트스캐너 기기명, CCTV 제외) -->
            <div class="scanner-name-label" style="
              position: absolute;
              top: 15px;
              left: 0;
              transform: translateX(-50%);
              display: flex;
              align-items: center;
              justify-content: center;
              white-space: nowrap;
              pointer-events: auto;
              cursor: pointer;
              z-index: 9;
            ">
              <span style="
                font-size: 11px;
                font-weight: 800;
                color: #FFFFFF;
                background: rgba(15, 23, 42, 0.85);
                border: 1px solid rgba(255, 255, 255, 0.25);
                padding: 1.5px 6px;
                border-radius: 4px;
                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.55);
                letter-spacing: -0.3px;
                line-height: 1.25;
              ">${displayName}</span>
            </div>
          </div>
        `;

        const scannerIcon = L.divIcon({
          className: 'scanner-zone-badge',
          html: markerHtml,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

        const scannerMarker = L.marker([zone.center.lat, zone.center.lng], {
          icon: scannerIcon,
          zIndexOffset: markerZIndexOffset,
        });
        (scannerMarker as any)._baseZIndexOffset = markerZIndexOffset;

        // 호버 시 마커 및 툴팁을 최상단(999999)으로 올려 겹친 다른 툴팁들 위로 즉시 부상
        scannerMarker.on('mouseover', () => {
          scannerMarker.setZIndexOffset(999999);
          const el = scannerMarker.getElement();
          if (el) el.style.zIndex = '999999';
        });

        // 마우스가 벗어나면 원래의 혼잡도 단계별 zIndexOffset 위치로 즉시 복원
        scannerMarker.on('mouseout', () => {
          const baseOffset = (scannerMarker as any)._baseZIndexOffset ?? markerZIndexOffset;
          scannerMarker.setZIndexOffset(baseOffset);
          const el = scannerMarker.getElement();
          if (el) el.style.zIndex = '';
        });

        if (isShapeDraggable) {
          scannerMarker.on('mousedown', (e: L.LeafletMouseEvent) => {
            if (e.originalEvent.button !== 0) return;
            L.DomEvent.stop(e.originalEvent);
            isDraggingRef.current = true;
            map.dragging.disable();
            map.closePopup();
            shapeDragRef.current = { zone, start: e.latlng, lastTranslated: zone };
            map.getContainer().classList.add('zone-dragging');
          });
        }

        scannerMarker.on('click', (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onSelectZone(zone.id);
          if (mode === 'view' && onOpenCctvRef.current) {
            onOpenCctvRef.current(zone);
          }
        });

        scannerMarker.addTo(zoneGroup);
        scannerMarkersMap.current.set(zone.id, scannerMarker);
      });

      // 더 이상 유효하지 않거나 숨김 처리된 구역 레이어 정리
      for (const [id, marker] of scannerMarkersMap.current.entries()) {
        if (!activeZoneIds.has(id)) {
          zoneGroup.removeLayer(marker);
          scannerMarkersMap.current.delete(id);
        }
      }
      for (const [id, layer] of zoneLayersMap.current.entries()) {
        if (!activeZoneIds.has(id)) {
          zoneGroup.removeLayer(layer);
          zoneLayersMap.current.delete(id);
        }
      }
    }
  }, [
    zones,
    congestions,
    selectedZoneId,
    showCongestionLayers,
    currentZoom,
    mode,
    isDarkMode,
    creatingZoneType,
  ]);

  // 6. Render Edit Handles in Edit Mode
  useEffect(() => {
    const map = leafletMap.current;
    const group = editHandlesGroup.current;
    if (!map || !group) return;

    // Do not tear down and rebuild markers while a drag is ongoing!
    if (isDraggingRef.current) return;

    group.clearLayers();
    handleMarkersRef.current = {
      vertexMarkers: [],
      midpointMarkers: [],
    };

    // Only render handles in Edit Mode when a zone is selected and zoom is at zone level (>= 16.0)
    if (mode !== 'edit' || !selectedZoneId || creatingZoneType || currentZoom < 16.0) return;

    const selectedZone = zones.find((z) => z.id === selectedZoneId);
    if (!selectedZone) return;

    if (selectedZone.type === 'circle') {
      let currentCenter = { ...selectedZone.center };
      let currentRadius = selectedZone.radius || 200;

      // Center Move Handle
      const centerMarker = L.marker([currentCenter.lat, currentCenter.lng], {
        icon: createCenterHandleIcon(),
        draggable: true,
        zIndexOffset: 1000,
      });

      centerMarker.on('dragstart', () => {
        isDraggingRef.current = true;
        map.dragging.disable();
      });

      centerMarker.on('drag', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const newPos = marker.getLatLng();
        currentCenter = { lat: newPos.lat, lng: newPos.lng };

        const circleLayer = zoneLayersMap.current.get(selectedZone.id) as L.Circle | undefined;
        if (circleLayer) {
          circleLayer.setLatLng(newPos);
        }

        const sMarker = scannerMarkersMap.current.get(selectedZone.id);
        if (sMarker) {
          sMarker.setLatLng(newPos);
        }

        const perimeterPt = getDestinationPoint(newPos.lat, newPos.lng, currentRadius, 90);
        radiusMarker.setLatLng([perimeterPt.lat, perimeterPt.lng]);
      });

      centerMarker.on('dragend', () => {
        isDraggingRef.current = false;
        map.dragging.enable();
        onUpdateZoneRef.current({
          ...selectedZone,
          center: currentCenter,
        });
      });

      centerMarker.addTo(group);
      handleMarkersRef.current.centerMarker = centerMarker;

      // Radius Resize Handle placed on the perimeter (due East)
      const perimeterPt = getDestinationPoint(currentCenter.lat, currentCenter.lng, currentRadius, 90);
      const radiusMarker = L.marker([perimeterPt.lat, perimeterPt.lng], {
        icon: createRadiusHandleIcon(),
        draggable: true,
        zIndexOffset: 1001,
      });

      radiusMarker.on('dragstart', () => {
        isDraggingRef.current = true;
        map.dragging.disable();
      });

      radiusMarker.on('drag', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const newPos = marker.getLatLng();
        const newDist = calculateDistance(currentCenter.lat, currentCenter.lng, newPos.lat, newPos.lng);
        currentRadius = Math.max(10, Math.min(4000, Math.round(newDist)));

        const circleLayer = zoneLayersMap.current.get(selectedZone.id) as L.Circle | undefined;
        if (circleLayer) {
          circleLayer.setRadius(currentRadius);
        }

        // 실시간 드래그 시 마커의 scanner-heat-glow 혼잡도 그라데이션도 즉각 비례하여 확장
        const sMarker = scannerMarkersMap.current.get(selectedZone.id);
        if (sMarker) {
          const mEl = sMarker.getElement();
          const glowEl = mEl?.querySelector<HTMLElement>('.scanner-heat-glow');
          if (glowEl) {
            const cPoint = map.latLngToLayerPoint([currentCenter.lat, currentCenter.lng]);
            const ePoint = map.latLngToLayerPoint(getDestinationPoint(currentCenter.lat, currentCenter.lng, currentRadius, 90));
            const rPx = Math.max(20, Math.round(Math.abs(ePoint.x - cPoint.x)));
            glowEl.style.width = `${rPx * 2}px`;
            glowEl.style.height = `${rPx * 2}px`;
            glowEl.style.top = `-${rPx}px`;
            glowEl.style.left = `-${rPx}px`;
            glowEl.style.filter = `blur(${Math.max(3, Math.min(18, Math.round(rPx * 0.12)))}px)`;
          }
        }
      });

      radiusMarker.on('dragend', () => {
        isDraggingRef.current = false;
        map.dragging.enable();
        onUpdateZoneRef.current({
          ...selectedZone,
          radius: currentRadius,
        });
      });

      radiusMarker.addTo(group);
      handleMarkersRef.current.radiusMarker = radiusMarker;

    } else if (selectedZone.type === 'polygon' && selectedZone.coordinates) {
      let currentCoords: [number, number][] = selectedZone.coordinates.map(([lat, lng]) => [lat, lng]);
      const vertexMarkers: L.Marker[] = [];
      const midpointMarkers: L.Marker[] = [];

      // 1. Polygon Center Move Handle (moves all vertices by offset)
      const centroid = selectedZone.center || calculateCentroid(currentCoords);
      let startCentroidPos = L.latLng(centroid.lat, centroid.lng);
      let dragStartCoords: [number, number][] = [];

      const centroidMarker = L.marker([centroid.lat, centroid.lng], {
        icon: createCenterHandleIcon(),
        draggable: true,
        zIndexOffset: 999,
        title: '다각형 전체 이동',
      });

      centroidMarker.on('dragstart', () => {
        isDraggingRef.current = true;
        map.dragging.disable();
        startCentroidPos = centroidMarker.getLatLng();
        dragStartCoords = currentCoords.map(([lat, lng]) => [lat, lng]);
      });

      centroidMarker.on('drag', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const curPos = marker.getLatLng();
        const dLat = curPos.lat - startCentroidPos.lat;
        const dLng = curPos.lng - startCentroidPos.lng;

        const shiftedCoords: [number, number][] = dragStartCoords.map(([lat, lng]) => [
          lat + dLat,
          lng + dLng,
        ]);
        currentCoords = shiftedCoords;

        const polyLayer = zoneLayersMap.current.get(selectedZone.id) as L.Polygon | undefined;
        if (polyLayer) {
          polyLayer.setLatLngs(shiftedCoords);
        }

        const sMarker = scannerMarkersMap.current.get(selectedZone.id);
        if (sMarker) {
          sMarker.setLatLng(curPos);
        }

        vertexMarkers.forEach((vm, i) => {
          vm.setLatLng(shiftedCoords[i]);
        });

        const n = shiftedCoords.length;
        midpointMarkers.forEach((mm, i) => {
          const nextI = (i + 1) % n;
          mm.setLatLng([
            (shiftedCoords[i][0] + shiftedCoords[nextI][0]) / 2,
            (shiftedCoords[i][1] + shiftedCoords[nextI][1]) / 2,
          ]);
        });
      });

      centroidMarker.on('dragend', () => {
        isDraggingRef.current = false;
        map.dragging.enable();
        const newCentroid = calculateCentroid(currentCoords);
        onUpdateZoneRef.current({
          ...selectedZone,
          coordinates: currentCoords,
          center: newCentroid,
        });
      });

      centroidMarker.addTo(group);
      handleMarkersRef.current.centroidMarker = centroidMarker;

      // 2. Vertex Handles (drag to reshape vertex)
      currentCoords.forEach(([lat, lng], idx) => {
        const vertexMarker = L.marker([lat, lng], {
          icon: createVertexHandleIcon(idx),
          draggable: true,
          zIndexOffset: 1000 + idx,
        });

        vertexMarker.on('dragstart', () => {
          isDraggingRef.current = true;
          map.dragging.disable();
        });

        vertexMarker.on('drag', (e: L.LeafletEvent) => {
          const marker = e.target as L.Marker;
          const newPos = marker.getLatLng();
          currentCoords[idx] = [newPos.lat, newPos.lng];

          // 1) Direct polygon SVG path update - smooth 60fps with zero DOM tearing
          const polyLayer = zoneLayersMap.current.get(selectedZone.id) as L.Polygon | undefined;
          if (polyLayer) {
            polyLayer.setLatLngs(currentCoords);
          }

          // 2) Immediately update adjacent midpoint handles
          const numPoints = currentCoords.length;
          const prevIdx = (idx - 1 + numPoints) % numPoints;
          const prevMid = [
            (currentCoords[prevIdx][0] + newPos.lat) / 2,
            (currentCoords[prevIdx][1] + newPos.lng) / 2,
          ] as [number, number];
          if (midpointMarkers[prevIdx]) {
            midpointMarkers[prevIdx].setLatLng(prevMid);
          }

          const nextIdx = (idx + 1) % numPoints;
          const nextMid = [
            (newPos.lat + currentCoords[nextIdx][0]) / 2,
            (newPos.lng + currentCoords[nextIdx][1]) / 2,
          ] as [number, number];
          if (midpointMarkers[idx]) {
            midpointMarkers[idx].setLatLng(nextMid);
          }

          // 3) Update centroid marker location
          const newCentroid = calculateCentroid(currentCoords);
          centroidMarker.setLatLng([newCentroid.lat, newCentroid.lng]);
        });

        vertexMarker.on('dragend', () => {
          isDraggingRef.current = false;
          map.dragging.enable();
          const newCentroid = calculateCentroid(currentCoords);
          onUpdateZoneRef.current({
            ...selectedZone,
            coordinates: currentCoords,
            center: newCentroid,
          });
        });

        vertexMarker.addTo(group);
        vertexMarkers.push(vertexMarker);

        // 3. Midpoint Add Handles between vertices
        const nextIdx = (idx + 1) % currentCoords.length;
        const nextCoord = currentCoords[nextIdx];
        const midLat = (lat + nextCoord[0]) / 2;
        const midLng = (lng + nextCoord[1]) / 2;

        const midpointMarker = L.marker([midLat, midLng], {
          icon: createMidpointHandleIcon(),
          zIndexOffset: 950,
          title: '새 꼭짓점 삽입',
        });

        midpointMarker.on('click', () => {
          const newCoords = [...currentCoords];
          newCoords.splice(idx + 1, 0, [midLat, midLng]);
          const newCentroid = calculateCentroid(newCoords);
          onUpdateZoneRef.current({
            ...selectedZone,
            coordinates: newCoords,
            center: newCentroid,
          });
        });

        midpointMarker.addTo(group);
        midpointMarkers.push(midpointMarker);
      });

      handleMarkersRef.current.vertexMarkers = vertexMarkers;
      handleMarkersRef.current.midpointMarkers = midpointMarkers;
    }
  }, [mode, selectedZoneId, zones, creatingZoneType, currentZoom]);

  // 7. Interactive Zone Creation (Circle & Polygon drawing on map)
  useEffect(() => {
    const map = leafletMap.current;
    const group = drawingLayerGroup.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!creatingZoneType) {
      // Return previous state when already empty to avoid a new array reference
      // (drawingPoints is a dependency of this effect → would loop infinitely)
      setDrawingPoints((prev) => (prev.length === 0 ? prev : []));
      setCircleDraftCenter(null);
      return;
    }

    // Set map cursor to crosshair during creation
    const container = map.getContainer();
    container.style.cursor = 'crosshair';

    // A. Drawing Polygon mode
    if (creatingZoneType === 'polygon') {
      const clickHandler = (e: L.LeafletMouseEvent) => {
        setDrawingPoints((prev) => [...prev, [e.latlng.lat, e.latlng.lng]]);
      };

      map.on('click', clickHandler);

      // Render in-progress polyline and markers
      if (drawingPoints.length > 0) {
        L.polyline(drawingPoints, {
          color: '#10B981',
          weight: 3,
          dashArray: '4, 4',
        }).addTo(group);

        drawingPoints.forEach(([lat, lng], i) => {
          L.circleMarker([lat, lng], {
            radius: 5,
            fillColor: '#10B981',
            fillOpacity: 1,
            color: '#FFFFFF',
            weight: 2,
          }).addTo(group);
        });
      }

      return () => {
        map.off('click', clickHandler);
        container.style.cursor = '';
      };
    }

    // B. Drawing Circle mode
    if (creatingZoneType === 'circle') {
      const clickHandler = (e: L.LeafletMouseEvent) => {
        if (!circleDraftCenter) {
          setCircleDraftCenter({ lat: e.latlng.lat, lng: e.latlng.lng });
        } else {
          // Second click completes circle
          const dist = calculateDistance(
            circleDraftCenter.lat,
            circleDraftCenter.lng,
            e.latlng.lat,
            e.latlng.lng
          );
          const finalRadius = Math.max(50, Math.round(dist));
          completeNewCircle(circleDraftCenter, finalRadius);
        }
      };

      const moveHandler = (e: L.LeafletMouseEvent) => {
        if (circleDraftCenter) {
          const dist = calculateDistance(
            circleDraftCenter.lat,
            circleDraftCenter.lng,
            e.latlng.lat,
            e.latlng.lng
          );
          setCircleDraftRadius(Math.max(50, Math.round(dist)));
        }
      };

      map.on('click', clickHandler);
      map.on('mousemove', moveHandler);

      if (circleDraftCenter) {
        L.circle([circleDraftCenter.lat, circleDraftCenter.lng], {
          radius: circleDraftRadius,
          color: '#3B82F6',
          weight: 2,
          dashArray: '4, 4',
          fillColor: '#3B82F6',
          fillOpacity: 0.25,
        }).addTo(group);

        L.circleMarker([circleDraftCenter.lat, circleDraftCenter.lng], {
          radius: 6,
          fillColor: '#2563EB',
          color: '#FFFFFF',
          weight: 2,
          fillOpacity: 1,
        }).addTo(group);
      }

      return () => {
        map.off('click', clickHandler);
        map.off('mousemove', moveHandler);
        container.style.cursor = '';
      };
    }
  }, [creatingZoneType, drawingPoints, circleDraftCenter, circleDraftRadius]);

  // Complete Polygon Creation
  const completeNewPolygon = () => {
    if (drawingPoints.length < 3) {
      alert('다각형 구역은 최소 3개의 점을 지정해야 합니다.');
      return;
    }
    const id = `ZONE-${String(zones.length + 1).padStart(3, '0')}`;
    const centroid = calculateCentroid(drawingPoints);
    const newZone: ZoneData = {
      id,
      name: `신규 다각형 구역 ${zones.length + 1}`,
      type: 'polygon',
      center: centroid,
      coordinates: drawingPoints,
      visible: true,
      category: 'other',
      capacity: 10000,
      description: '사용자가 지도 위에 직접 생성한 다각형 관제 구역',
    };
    onAddZoneComplete(newZone);
    setCreatingZoneType(null);
    setDrawingPoints([]);
  };

  // Complete Circle Creation
  const completeNewCircle = (center: LatLng, radius: number) => {
    const id = `ZONE-${String(zones.length + 1).padStart(3, '0')}`;
    const newZone: ZoneData = {
      id,
      name: `신규 원형 구역 ${zones.length + 1}`,
      type: 'circle',
      center,
      radius,
      visible: true,
      category: 'other',
      capacity: 12000,
      description: '사용자가 지도 위에 직접 생성한 원형 관제 구역',
    };
    onAddZoneComplete(newZone);
    setCreatingZoneType(null);
    setCircleDraftCenter(null);
  };

  // Cancel Creation
  const cancelCreation = () => {
    setCreatingZoneType(null);
    setDrawingPoints([]);
    setCircleDraftCenter(null);
  };

  // Zoom handlers (0.5 step)
  const handleZoomIn = () => {
    const map = leafletMap.current;
    if (!map) return;
    const nextZoom = Math.min(map.getMaxZoom() || 19, map.getZoom() + 0.5);
    map.setZoom(Math.round(nextZoom / 0.5) * 0.5);
  };
  const handleZoomOut = () => {
    const map = leafletMap.current;
    if (!map) return;
    const curZoom = map.getZoom();
    if (curZoom > 13) {
      const nextZoom = Math.max(13, curZoom - 0.5);
      map.setZoom(Math.round(nextZoom / 0.5) * 0.5);
    }
  };
  const handleResetCenter = () => {
    const map = leafletMap.current;
    if (!map) return;
    map.invalidateSize();
    onSelectZone('');
    const bounds = getZonesBounds(zones);
    if (bounds) {
      map.flyToBounds(bounds, { padding: FIT_PADDING, duration: 0.8 });
    } else {
      map.flyToBounds(JONGNO_BOUNDS, { duration: 0.8 });
    }
  };

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden bg-neutral-900 select-none">
      {/* Actual Leaflet Map Canvas */}
      <div
        ref={mapRef}
        className="w-full h-full z-0 transition-all"
      />

      {/* Top Floating Prompt during Creation Mode */}
      {creatingZoneType && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-neutral-900/95 text-white px-5 py-2.5 rounded-lg shadow-xl border border-neutral-700 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            {creatingZoneType === 'polygon' ? (
              <Hexagon className="w-4 h-4 text-emerald-400" />
            ) : (
              <CircleDot className="w-4 h-4 text-blue-400" />
            )}
            <span className="font-semibold">
              {creatingZoneType === 'polygon'
                ? `다각형 그리기 모드: 지도 위 클릭하여 꼭짓점 지정 (현재 ${drawingPoints.length}개)`
                : circleDraftCenter
                  ? '원형 그리기: 원하는 반경 지점을 클릭하여 생성 완료'
                  : '원형 그리기: 지도를 클릭하여 중심점 위치 지정'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {creatingZoneType === 'polygon' && drawingPoints.length >= 3 && (
              <button
                type="button"
                onClick={completeNewPolygon}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow-xs cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>구역 생성 완료</span>
              </button>
            )}

            <button
              type="button"
              onClick={cancelCreation}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>취소</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit-mode hint: selected shape can be dragged as a whole */}
      {mode === 'edit' && selectedZoneId && !creatingZoneType && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-neutral-900/90 text-neutral-200 px-4 py-2 rounded-lg shadow-lg border border-neutral-700/80 flex items-center gap-2 text-xs backdrop-blur-xs pointer-events-none">
          <Move className="w-3.5 h-3.5 text-blue-400" />
          <span>선택한 구역 도형을 드래그하면 통째로 이동합니다 · 핸들로 형태/크기 편집</span>
        </div>
      )}

      {/* Map Floating Controls (Top Left) - 전체 구역 보기 */}
      <div className="absolute top-4 left-4 z-10">
        <button
          type="button"
          onClick={handleResetCenter}
          title="전체 구역 보기 (관제 중인 전체 구역 화면 맞춤)"
          className="flex items-center gap-1.5 h-9 px-3 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-700/80 rounded-lg shadow-md text-xs font-bold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer select-none backdrop-blur-xs"
        >
          <span className="text-sm leading-none font-bold">⛶</span>
          <span>전체 구역 보기</span>
        </button>
      </div>

      {/* Map Floating Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-center">
        {/* Zoom Controls */}
        <div className="w-9 flex flex-col bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-700/80 rounded-lg shadow-md overflow-hidden text-neutral-700 dark:text-neutral-200">
          <button
            type="button"
            onClick={handleZoomIn}
            title="지도 확대"
            className="w-full h-8 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
          </button>
          <div className="w-full text-[9.5px] font-mono font-bold text-center py-1 text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 flex items-center justify-center tracking-tight">
            Z{typeof currentZoom === 'number' ? (Number.isInteger(currentZoom) ? currentZoom : currentZoom.toFixed(2)) : currentZoom}
          </div>
          <button
            type="button"
            onClick={handleZoomOut}
            title="지도 축소"
            className="w-full h-8 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Minus className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="w-9 flex flex-col bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-700/80 rounded-lg shadow-md overflow-hidden text-neutral-700 dark:text-neutral-200">
          <button
            type="button"
            onClick={() => setShowCongestionLayers(!showCongestionLayers)}
            title={showCongestionLayers ? '혼잡도 레이어 숨김' : '혼잡도 레이어 표시'}
            className={`w-full h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer ${showCongestionLayers ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 opacity-60'
              }`}
          >
            <Layers className="w-4 h-4 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => setShowRoadNumbers((prev) => !prev)}
            title={showRoadNumbers ? '도로 번호 숨김' : '도로 번호 표시'}
            className={`w-full h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer ${showRoadNumbers
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-neutral-400 opacity-60'
              }`}
          >
            <Milestone className="w-4 h-4 shrink-0" />
          </button>

          {/* Dim Outside Toggle Button */}
          <button
            type="button"
            onClick={() => setDimOutside(!dimOutside)}
            title={dimOutside ? '종로구 외곽 음영 끄기 (전체 밝게)' : '종로구 외곽 어둡게 켜기 (포커스 모드)'}
            className={`w-full h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer ${dimOutside && showBoundary
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-neutral-400 opacity-60'
              }`}
          >
            <Contrast className="w-4 h-4 shrink-0" />
          </button>

          {/* Subway Layer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsSubwayPanelOpen(!isSubwayPanelOpen)}
            title="지하철 노선 및 지하철역 레이어 제어"
            className={`w-full h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer ${subwayConfig.showLines || subwayConfig.showStations
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-neutral-400 opacity-60'
              }`}
          >
            <Train className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>

      {/* Floating Coordinate Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-neutral-900/85 backdrop-blur-xs text-neutral-200 px-3 py-1.5 rounded-md border border-neutral-700/60 shadow-md text-xs font-mono tabular-nums">
        <Crosshair className="w-3.5 h-3.5 text-blue-400" />
        <span>
          {mouseCoords
            ? `${formatCoordinate(mouseCoords.lat, mouseCoords.lng)}`
            : `종로구 중심: ${formatCoordinate(JONGNO_CENTER.lat, JONGNO_CENTER.lng)}`}
        </span>
      </div>

      {/* Congestion Legend (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs p-3 rounded-lg border border-neutral-200 dark:border-neutral-700/80 shadow-lg text-xs space-y-1.5 min-w-[160px]">
        <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 pb-1 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <span>혼잡도 범례</span>
          <span className="text-[10px] text-neutral-400">6단계 관제</span>
        </div>
        {([1, 2, 3, 4, 5, 6] as CongestionLevel[]).map((lvl) => {
          const info = CONGESTION_LEVEL_MAP[lvl];
          return (
            <div key={lvl} className="flex items-center justify-between gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: info.color }}
                />
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                  {info.name}
                </span>
              </div>
              <span className="text-neutral-400 font-mono text-[10px]">
                {lvl === 1 ? '0~25%' : lvl === 2 ? '26~45%' : lvl === 3 ? '46~65%' : lvl === 4 ? '66~80%' : lvl === 5 ? '81~90%' : '91~100%'}
              </span>
            </div>
          );
        })}
      </div>




      {/* Subway Control Panel Popover */}
      <SubwayControlPanel
        isOpen={isSubwayPanelOpen}
        onClose={() => setIsSubwayPanelOpen(false)}
        config={subwayConfig}
        onChangeConfig={setSubwayConfig}
      />
    </div>
  );
};
