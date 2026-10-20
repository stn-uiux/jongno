import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Compass,
  Plus,
  Minus,
  Maximize2,
  Layers,
  Tag,
  Crosshair,
  Check,
  X,
  CircleDot,
  Hexagon,
  Move,
  Info,
  Palette,
  Sparkles,
} from 'lucide-react';
import {
  ZoneData,
  CongestionData,
  AppMode,
  TileServerConfig,
  LatLng,
  MapConceptConfig,
} from '../types';
import {
  JONGNO_CENTER,
  DEFAULT_ZOOM,
  CONGESTION_LEVEL_MAP,
  JONGNO_BOUNDARY,
} from '../utils/constants';
import {
  calculateDistance,
  getDestinationPoint,
  calculateCentroid,
  determineCongestionLevel,
  formatCoordinate,
} from '../utils/geoUtils';

interface MapContainerProps {
  zones: ZoneData[];
  congestions: Record<string, CongestionData>;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  onUpdateZone: (zone: ZoneData) => void;
  mode: AppMode;
  tileServer: TileServerConfig;
  isDarkMode: boolean;
  concept: MapConceptConfig;
  onOpenConcept: () => void;
  onAddZoneComplete: (newZone: ZoneData) => void;
  creatingZoneType: 'circle' | 'polygon' | null;
  setCreatingZoneType: (type: 'circle' | 'polygon' | null) => void;
  focusTarget: LatLng | null;
  onFocusHandled: () => void;
}

// Custom DivIcons with SVG for zero-dependency offline rendering
const createCenterHandleIcon = () =>
  L.divIcon({
    className: 'custom-drag-handle-center',
    html: `
      <div style="
        width: 22px; height: 22px;
        background: #2563EB;
        border: 2px solid #FFFFFF;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        display: flex; align-items: center; justify-content: center;
        cursor: grab;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
          <circle cx="12" cy="12" r="4"></circle>
          <line x1="12" y1="2" x2="12" y2="6"></line>
          <line x1="12" y1="18" x2="12" y2="22"></line>
          <line x1="2" y1="12" x2="6" y2="12"></line>
          <line x1="18" y1="12" x2="22" y2="12"></line>
        </svg>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
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

export const MapContainer: React.FC<MapContainerProps> = ({
  zones,
  congestions,
  selectedZoneId,
  onSelectZone,
  onUpdateZone,
  mode,
  tileServer,
  isDarkMode,
  concept,
  onOpenConcept,
  onAddZoneComplete,
  creatingZoneType,
  setCreatingZoneType,
  focusTarget,
  onFocusHandled,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const zoneLayersGroup = useRef<L.FeatureGroup | null>(null);
  const editHandlesGroup = useRef<L.FeatureGroup | null>(null);
  const boundaryLayer = useRef<L.Polygon | null>(null);
  const drawingLayerGroup = useRef<L.FeatureGroup | null>(null);

  // Map state
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_ZOOM);
  const [mouseCoords, setMouseCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showCongestionLayers, setShowCongestionLayers] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [showBoundary, setShowBoundary] = useState<boolean>(true);
  const [tileErrorOccurred, setTileErrorOccurred] = useState<boolean>(false);

  // In-progress creation state for polygon drawing
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  // In-progress creation state for circle
  const [circleDraftCenter, setCircleDraftCenter] = useState<LatLng | null>(null);
  const [circleDraftRadius, setCircleDraftRadius] = useState<number>(250);

  // Latest props for map-level listeners registered once at init
  const zonesRef = useRef<ZoneData[]>(zones);
  zonesRef.current = zones;
  const onUpdateZoneRef = useRef(onUpdateZone);
  onUpdateZoneRef.current = onUpdateZone;
  // Whole-shape drag state (edit mode): zone snapshot + pointer position at drag start
  const shapeDragRef = useRef<{ zone: ZoneData; start: L.LatLng } | null>(null);
  const initialFitDone = useRef<boolean>(false);

  // 1. Initialize Map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const map = L.map(mapRef.current, {
      center: [JONGNO_CENTER.lat, JONGNO_CENTER.lng],
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // We render sleek custom controls
      attributionControl: false,
      zoomSnap: 0.25, // finer snapping for tight fitBounds / zoom limit
      // Keep panning around Jongno-gu only
      maxBounds: JONGNO_BOUNDS.pad(0.15),
      maxBoundsViscosity: 1.0,
    });

    leafletMap.current = map;

    // Feature groups
    zoneLayersGroup.current = L.featureGroup().addTo(map);
    editHandlesGroup.current = L.featureGroup().addTo(map);
    drawingLayerGroup.current = L.featureGroup().addTo(map);

    // Official administrative boundary of Jongno-gu
    boundaryLayer.current = L.polygon(JONGNO_BOUNDARY, {
      color: '#3B82F6',
      weight: 1.5,
      fillOpacity: 0.03,
      fillColor: '#3B82F6',
      interactive: false,
    }).addTo(map);

    // Event listeners
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setMouseCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    map.on('mouseout', () => {
      setMouseCoords(null);
    });

    // Zoom-out limit: never zoom out further than the level showing all of Jongno-gu
    const applyZoomLimit = () => {
      const size = map.getSize();
      if (size.x === 0 || size.y === 0) return;
      map.setMinZoom(map.getBoundsZoom(JONGNO_BOUNDS, false));
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
      onUpdateZoneRef.current(translateZone(drag.zone, dLat, dLng));
    };
    const endShapeDrag = () => {
      if (!shapeDragRef.current) return;
      shapeDragRef.current = null;
      map.dragging.enable();
      map.getContainer().classList.remove('zone-dragging');
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

  // 2. Handle Tile Layer updates
  useEffect(() => {
    if (!leafletMap.current) return;

    if (tileLayerRef.current) {
      leafletMap.current.removeLayer(tileLayerRef.current);
    }

    setTileErrorOccurred(false);

    const newTileLayer = L.tileLayer(tileServer.url, {
      subdomains: tileServer.subdomains || ['a', 'b', 'c', 'd'],
      maxZoom: tileServer.maxZoom || 19,
      attribution: tileServer.attribution,
      crossOrigin: true,
    });

    newTileLayer.on('tileerror', () => {
      setTileErrorOccurred(true);
    });

    newTileLayer.on('tileload', () => {
      setTileErrorOccurred(false);
    });

    newTileLayer.addTo(leafletMap.current);
    tileLayerRef.current = newTileLayer;
    leafletMap.current.invalidateSize();
  }, [tileServer.url, tileServer.subdomains, tileServer.maxZoom]);

  // 3. Handle External Focus Target (fly to zone)
  useEffect(() => {
    if (focusTarget && leafletMap.current) {
      leafletMap.current.flyTo([focusTarget.lat, focusTarget.lng], 16, {
        duration: 1.2,
      });
      onFocusHandled();
    }
  }, [focusTarget, onFocusHandled]);

  // 4. Handle Boundary Visibility and Concept Styling
  useEffect(() => {
    if (!boundaryLayer.current) return;
    if (showBoundary) {
      boundaryLayer.current.setStyle({
        color: concept.boundaryColor,
        dashArray: concept.boundaryDashArray,
        weight: concept.boundaryWeight,
        fillColor: concept.boundaryColor,
        opacity: 0.85,
        fillOpacity: 0.04,
      });
    } else {
      boundaryLayer.current.setStyle({ opacity: 0, fillOpacity: 0 });
    }
  }, [showBoundary, concept.boundaryColor, concept.boundaryDashArray, concept.boundaryWeight]);

  // Dynamic Map Concept Filter & Canvas Styling
  useEffect(() => {
    if (!leafletMap.current) return;
    const tilePane = leafletMap.current.getPane('tilePane');
    const container = leafletMap.current.getContainer();

    const tileFilter = concept.invert
      ? `invert(100%) hue-rotate(${concept.hueRotate}deg) brightness(${concept.brightness}%) contrast(${concept.contrast}%) saturate(${concept.saturate}%)`
      : `hue-rotate(${concept.hueRotate}deg) brightness(${concept.brightness}%) contrast(${concept.contrast}%) saturate(${concept.saturate}%)`;

    if (tilePane) {
      tilePane.style.filter = tileFilter;
      tilePane.style.backgroundColor = concept.bgColor;
    }
    if (container) {
      container.style.backgroundColor = concept.bgColor;
    }
  }, [
    concept.invert,
    concept.hueRotate,
    concept.brightness,
    concept.contrast,
    concept.saturate,
    concept.bgColor,
  ]);

  // 5. Render Zones and Popups
  useEffect(() => {
    const map = leafletMap.current;
    const group = zoneLayersGroup.current;
    if (!map || !group) return;

    group.clearLayers();

    if (!showCongestionLayers) return;

    zones.forEach((zone) => {
      if (!zone.visible) return;

      const isSelected = selectedZoneId === zone.id;
      // In edit mode the selected shape itself can be dragged to move the whole zone
      const isShapeDraggable = mode === 'edit' && isSelected && !creatingZoneType;
      const c = congestions[zone.id];
      const level = c ? c.level : 1;
      const levelInfo = CONGESTION_LEVEL_MAP[level];

      const fillColor = zone.customColor || levelInfo.color;
      const strokeColor = isSelected
        ? '#2563EB'
        : zone.customBorderColor || levelInfo.borderColor;
      const baseOpacity = concept.zoneDefaultOpacity || 0.35;
      const fillOpacity = zone.customOpacity ?? (isSelected ? Math.min(0.75, baseOpacity + 0.15) : baseOpacity);
      const weight = isSelected ? 3.5 : concept.zoneGlow ? 3 : 2;

      let layer: L.Circle | L.Polygon;

      if (zone.type === 'circle') {
        layer = L.circle([zone.center.lat, zone.center.lng], {
          radius: zone.radius || 200,
          color: strokeColor,
          weight,
          fillColor,
          fillOpacity,
          dashArray: isSelected ? '5, 5' : undefined,
          className: isShapeDraggable ? 'zone-shape-draggable' : undefined,
        });
      } else {
        layer = L.polygon(zone.coordinates || [], {
          color: strokeColor,
          weight,
          fillColor,
          fillOpacity,
          dashArray: isSelected ? '5, 5' : undefined,
          className: isShapeDraggable ? 'zone-shape-draggable' : undefined,
        });
      }

      // Zone Label Tooltip
      if (showLabels) {
        layer.bindTooltip(
          `<div style="font-family: inherit; font-size: 11px; font-weight: 600; padding: 2px 4px;">
            <span>${zone.name}</span>
            <span style="margin-left: 4px; color: ${levelInfo.color}; font-weight: 700; font-family: monospace;">${c ? c.value + '%' : ''}</span>
          </div>`,
          {
            permanent: true,
            direction: 'center',
            className: 'custom-map-tooltip',
          }
        );
      }

      // Rich Interactive Popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; line-height: 1.4; min-width: 200px; color: #1E293B;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 6px;">
            <strong style="font-size: 13px; color: #0F172A;">${zone.name}</strong>
            <span style="font-size: 10px; font-family: monospace; background: #F1F5F9; padding: 1px 4px; border-radius: 4px; color: #64748B;">${zone.id}</span>
          </div>
          <div style="margin-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${levelInfo.color};"></span>
              <span style="font-weight: 600; color: ${levelInfo.textColor};">${levelInfo.name} (${c ? c.value : 0}%)</span>
            </div>
            <p style="margin: 0; font-size: 11px; color: #64748B;">${zone.description || levelInfo.description}</p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; background: #F8FAFC; padding: 6px; border-radius: 4px; font-size: 11px; margin-bottom: 8px;">
            <div>
              <span style="color: #64748B; font-size: 10px; display: block;">추정 체류</span>
              <strong style="font-family: monospace;">${(c?.estimatedVisitors || 0).toLocaleString()}명</strong>
            </div>
            <div>
              <span style="color: #64748B; font-size: 10px; display: block;">수용 인원</span>
              <strong style="font-family: monospace;">${(zone.capacity || 0).toLocaleString()}명</strong>
            </div>
          </div>
          <div style="font-size: 10px; color: #94A3B8; text-align: right;">
            최종 갱신: ${c ? new Date(c.updatedAt).toLocaleTimeString('ko-KR') : '-'}
          </div>
        </div>
      `;

      if (isShapeDraggable) {
        // Whole-shape drag: freeze map panning and record the start point.
        // Movement/end are handled by map-level listeners registered at init.
        layer.on('mousedown', (e: L.LeafletMouseEvent) => {
          if (e.originalEvent.button !== 0) return;
          L.DomEvent.stop(e.originalEvent);
          map.dragging.disable();
          map.closePopup();
          shapeDragRef.current = { zone, start: e.latlng };
          map.getContainer().classList.add('zone-dragging');
        });
      } else {
        // Popup is skipped for the draggable shape so it doesn't pop open after each drag
        layer.bindPopup(popupHtml, { closeButton: true });
      }

      // Click event selects zone
      layer.on('click', () => {
        onSelectZone(zone.id);
      });

      layer.addTo(group);
    });
  }, [
    zones,
    congestions,
    selectedZoneId,
    showCongestionLayers,
    showLabels,
    mode,
    creatingZoneType,
    concept.zoneDefaultOpacity,
    concept.zoneGlow,
  ]);

  // 6. Render Edit Handles in Edit Mode
  useEffect(() => {
    const map = leafletMap.current;
    const group = editHandlesGroup.current;
    if (!map || !group) return;

    group.clearLayers();

    // Only render handles in Edit Mode when a zone is selected
    if (mode !== 'edit' || !selectedZoneId || creatingZoneType) return;

    const selectedZone = zones.find((z) => z.id === selectedZoneId);
    if (!selectedZone) return;

    if (selectedZone.type === 'circle') {
      const center = selectedZone.center;
      const radius = selectedZone.radius || 200;

      // Center Move Handle
      const centerMarker = L.marker([center.lat, center.lng], {
        icon: createCenterHandleIcon(),
        draggable: true,
        zIndexOffset: 1000,
      });

      centerMarker.on('drag', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const newPos = marker.getLatLng();
        onUpdateZone({
          ...selectedZone,
          center: { lat: newPos.lat, lng: newPos.lng },
        });
      });

      centerMarker.addTo(group);

      // Radius Resize Handle placed on the perimeter (due East)
      const perimeterPt = getDestinationPoint(center.lat, center.lng, radius, 90);
      const radiusMarker = L.marker([perimeterPt.lat, perimeterPt.lng], {
        icon: createRadiusHandleIcon(),
        draggable: true,
        zIndexOffset: 1001,
      });

      radiusMarker.on('drag', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const newPos = marker.getLatLng();
        const newDist = calculateDistance(center.lat, center.lng, newPos.lat, newPos.lng);
        const clampedRadius = Math.max(20, Math.min(4000, Math.round(newDist)));
        onUpdateZone({
          ...selectedZone,
          radius: clampedRadius,
        });
      });

      radiusMarker.addTo(group);
    } else if (selectedZone.type === 'polygon' && selectedZone.coordinates) {
      const coords = selectedZone.coordinates;

      // 1. Polygon Center Move Handle (moves all vertices by offset)
      const centroid = selectedZone.center || calculateCentroid(coords);
      let lastCentroidPos = L.latLng(centroid.lat, centroid.lng);

      const centroidMarker = L.marker([centroid.lat, centroid.lng], {
        icon: createCenterHandleIcon(),
        draggable: true,
        zIndexOffset: 999,
        title: '다각형 전체 이동',
      });

      centroidMarker.on('drag', (e: L.LeafletEvent) => {
        const marker = e.target as L.Marker;
        const currentPos = marker.getLatLng();
        const dLat = currentPos.lat - lastCentroidPos.lat;
        const dLng = currentPos.lng - lastCentroidPos.lng;
        lastCentroidPos = currentPos;

        const shiftedCoords: [number, number][] = coords.map(([lat, lng]) => [
          lat + dLat,
          lng + dLng,
        ]);
        const newCentroid = calculateCentroid(shiftedCoords);

        onUpdateZone({
          ...selectedZone,
          coordinates: shiftedCoords,
          center: newCentroid,
        });
      });

      centroidMarker.addTo(group);

      // 2. Vertex Handles (drag to reshape vertex)
      coords.forEach(([lat, lng], idx) => {
        const vertexMarker = L.marker([lat, lng], {
          icon: createVertexHandleIcon(idx),
          draggable: true,
          zIndexOffset: 1000 + idx,
        });

        vertexMarker.on('drag', (e: L.LeafletEvent) => {
          const marker = e.target as L.Marker;
          const newPos = marker.getLatLng();
          const newCoords = [...coords];
          newCoords[idx] = [newPos.lat, newPos.lng];
          const newCentroid = calculateCentroid(newCoords);

          onUpdateZone({
            ...selectedZone,
            coordinates: newCoords,
            center: newCentroid,
          });
        });

        vertexMarker.addTo(group);

        // 3. Midpoint Add Handles between vertices
        const nextIdx = (idx + 1) % coords.length;
        const nextCoord = coords[nextIdx];
        const midLat = (lat + nextCoord[0]) / 2;
        const midLng = (lng + nextCoord[1]) / 2;

        const midpointMarker = L.marker([midLat, midLng], {
          icon: createMidpointHandleIcon(),
          zIndexOffset: 950,
          title: '새 꼭짓점 삽입',
        });

        midpointMarker.on('click', () => {
          const newCoords = [...coords];
          newCoords.splice(idx + 1, 0, [midLat, midLng]);
          const newCentroid = calculateCentroid(newCoords);
          onUpdateZone({
            ...selectedZone,
            coordinates: newCoords,
            center: newCentroid,
          });
        });

        midpointMarker.addTo(group);
      });
    }
  }, [mode, selectedZoneId, zones, creatingZoneType]);

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

  // Zoom handlers
  const handleZoomIn = () => leafletMap.current?.zoomIn();
  const handleZoomOut = () => leafletMap.current?.zoomOut();
  const handleResetCenter = () => {
    const map = leafletMap.current;
    if (!map) return;
    const bounds = getZonesBounds(zones);
    if (bounds) {
      map.flyToBounds(bounds, { padding: FIT_PADDING, duration: 0.8 });
    } else {
      map.flyToBounds(JONGNO_BOUNDS, { duration: 0.8 });
    }
  };
  const isDarkStyle = isDarkMode || tileServer.type === 'dark';

  return (
    <div className="relative flex-1 h-full w-full overflow-hidden bg-neutral-900 select-none">
      {/* Actual Leaflet Map Canvas */}
      <div
        ref={mapRef}
        className={`w-full h-full z-0 transition-all ${isDarkStyle ? 'dark-map-tiles' : ''}`}
      />

      {/* Floating notice if local tile server has errors */}
      {tileErrorOccurred && tileServer.isAirGapped && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-neutral-900/90 text-neutral-200 border border-amber-600/60 px-4 py-2 rounded-lg text-xs flex items-center gap-2 shadow-lg backdrop-blur-xs">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>내부 TileServer GL({tileServer.url}) 연결 대기 중입니다.</span>
        </div>
      )}

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
                className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>구역 생성 완료</span>
              </button>
            )}

            <button
              type="button"
              onClick={cancelCreation}
              className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded"
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

      {/* Map Floating Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="flex flex-col bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-700/80 rounded-lg shadow-md overflow-hidden text-neutral-700 dark:text-neutral-200">
          <button
            type="button"
            onClick={handleZoomIn}
            title="지도 확대"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="text-[10px] font-mono font-bold text-center py-1 text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50">
            Z{currentZoom}
          </div>
          <button
            type="button"
            onClick={handleZoomOut}
            title="지도 축소"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Reset to Jongno-gu Center */}
        <button
          type="button"
          onClick={handleResetCenter}
          title="전체 관제 구역을 화면 중앙에 맞춤"
          className="p-2.5 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-700/80 rounded-lg shadow-md text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          <Compass className="w-4 h-4 text-blue-500" />
        </button>

        {/* Layer Toggles */}
        <div className="flex flex-col bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-700/80 rounded-lg shadow-md overflow-hidden text-neutral-700 dark:text-neutral-200">
          <button
            type="button"
            onClick={() => setShowCongestionLayers(!showCongestionLayers)}
            title={showCongestionLayers ? '혼잡도 레이어 숨김' : '혼잡도 레이어 표시'}
            className={`p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 ${
              showCongestionLayers ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 opacity-60'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? '구역명 라벨 숨김' : '구역명 라벨 표시'}
            className={`p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 ${
              showLabels ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 opacity-60'
            }`}
          >
            <Tag className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowBoundary(!showBoundary)}
            title={showBoundary ? '종로구 행정경계선 숨김' : '종로구 행정경계선 표시'}
            className={`p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 ${
              showBoundary ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 opacity-60'
            }`}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenConcept}
            title="지도 컨셉 및 시각화 스타일링 스튜디오"
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <Palette className="w-4 h-4" />
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
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xs p-3 rounded-lg border border-neutral-200 dark:border-neutral-700/80 shadow-lg text-xs space-y-1.5 min-w-[150px]">
        <div className="text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 pb-1 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <span>혼잡도 범례</span>
          <span className="text-[10px] text-neutral-400">4단계 관제</span>
        </div>
        {[1, 2, 3, 4].map((lvl) => {
          const info = CONGESTION_LEVEL_MAP[lvl as 1 | 2 | 3 | 4];
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
                {lvl === 1 ? '0~35%' : lvl === 2 ? '36~65%' : lvl === 3 ? '66~85%' : '86~100%'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Demo Data Disclaimer & Active Map Concept Badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className="bg-neutral-900/80 text-neutral-300 px-2.5 py-1 rounded text-[10px] border border-neutral-800 backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
          <Info className="w-3 h-3 text-amber-400 shrink-0" />
          <span>혼잡도: 시뮬레이션 데모 데이터</span>
        </div>
        <button
          type="button"
          onClick={onOpenConcept}
          title="클릭하여 지도 컨셉 및 색상 테마 변경"
          className="bg-neutral-900/80 text-neutral-200 hover:text-white px-2.5 py-1 rounded text-[10px] border border-neutral-700/80 backdrop-blur-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
        >
          <Palette className="w-3 h-3 text-indigo-400" />
          <span>컨셉: <strong className="text-indigo-300">{concept.name}</strong></span>
        </button>
      </div>
    </div>
  );
};
