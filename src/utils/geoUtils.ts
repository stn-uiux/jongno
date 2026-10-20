import { CongestionData, CongestionLevel, LatLng, ZoneData } from '../types';

/**
 * Calculates distance between two points in meters using Haversine formula
 */
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates destination point given starting point, distance in meters, and bearing in degrees (0 = North, 90 = East)
 */
export function getDestinationPoint(
  lat: number,
  lng: number,
  distanceMeters: number,
  bearingDegrees: number = 90
): LatLng {
  const R = 6371000;
  const dByR = distanceMeters / R;
  const radBearing = (bearingDegrees * Math.PI) / 180;
  const radLat1 = (lat * Math.PI) / 180;
  const radLng1 = (lng * Math.PI) / 180;

  const radLat2 = Math.asin(
    Math.sin(radLat1) * Math.cos(dByR) +
      Math.cos(radLat1) * Math.sin(dByR) * Math.cos(radBearing)
  );

  const radLng2 =
    radLng1 +
    Math.atan2(
      Math.sin(radBearing) * Math.sin(dByR) * Math.cos(radLat1),
      Math.cos(dByR) - Math.sin(radLat1) * Math.sin(radLat2)
    );

  return {
    lat: (radLat2 * 180) / Math.PI,
    lng: (radLng2 * 180) / Math.PI,
  };
}

/**
 * Calculates centroid of a set of coordinates [lat, lng]
 */
export function calculateCentroid(coordinates: [number, number][]): LatLng {
  if (!coordinates || coordinates.length === 0) {
    return { lat: 37.5730, lng: 126.9794 };
  }
  let sumLat = 0;
  let sumLng = 0;
  for (const [lat, lng] of coordinates) {
    sumLat += lat;
    sumLng += lng;
  }
  return {
    lat: sumLat / coordinates.length,
    lng: sumLng / coordinates.length,
  };
}

/**
 * Approximates a circle as a polygon coordinate array [lat, lng]
 */
export function circleToPolygon(
  centerLat: number,
  centerLng: number,
  radiusMeters: number,
  points: number = 32
): [number, number][] {
  const result: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const bearing = (i * 360) / points;
    const pt = getDestinationPoint(centerLat, centerLng, radiusMeters, bearing);
    result.push([pt.lat, pt.lng]);
  }
  return result;
}

/**
 * Determines congestion level from numeric value 0-100
 */
export function determineCongestionLevel(value: number): CongestionLevel {
  if (value <= 35) return 1;
  if (value <= 65) return 2;
  if (value <= 85) return 3;
  return 4;
}

/**
 * Formats coordinate to readable string
 */
export function formatCoordinate(lat: number, lng: number, decimals = 5): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(decimals)}°${ns}, ${Math.abs(lng).toFixed(decimals)}°${ew}`;
}

/**
 * Exports zones and congestion data to standard GeoJSON FeatureCollection
 */
export function exportToGeoJson(
  zones: ZoneData[],
  congestions: Record<string, CongestionData>
): string {
  const features = zones.map((zone) => {
    const congestion = congestions[zone.id];
    const properties = {
      id: zone.id,
      name: zone.name,
      zoneType: zone.type,
      radius: zone.radius,
      centerLat: zone.center.lat,
      centerLng: zone.center.lng,
      category: zone.category || 'other',
      description: zone.description || '',
      capacity: zone.capacity || 0,
      visible: zone.visible,
      customColor: zone.customColor,
      customBorderColor: zone.customBorderColor,
      customOpacity: zone.customOpacity,
      congestionLevel: congestion?.level ?? 1,
      congestionValue: congestion?.value ?? 0,
      estimatedVisitors: congestion?.estimatedVisitors ?? 0,
      updatedAt: congestion?.updatedAt ?? new Date().toISOString(),
    };

    let geometry: any;
    if (zone.type === 'circle') {
      // Use Point geometry with radius property, or polygon ring for standard GIS viewers
      // GeoJSON standard: [lng, lat]
      const approxRing = circleToPolygon(zone.center.lat, zone.center.lng, zone.radius || 200, 36).map(
        ([lat, lng]) => [lng, lat]
      );
      approxRing.push(approxRing[0]); // close loop

      geometry = {
        type: 'Polygon',
        coordinates: [approxRing],
      };
    } else {
      // Polygon: GeoJSON coordinates are [lng, lat]
      const ring = (zone.coordinates || []).map(([lat, lng]) => [lng, lat]);
      if (ring.length > 0 && (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1])) {
        ring.push(ring[0]);
      }
      geometry = {
        type: 'Polygon',
        coordinates: [ring],
      };
    }

    return {
      type: 'Feature',
      id: zone.id,
      geometry,
      properties,
    };
  });

  const geoJson = {
    type: 'FeatureCollection',
    metadata: {
      title: '서울특별시 종로구 지역별 혼잡도 관제 데이터',
      exportedAt: new Date().toISOString(),
      targetRegion: '서울특별시 종로구',
      system: 'Jongno Congestion Control System (Air-Gapped)',
    },
    features,
  };

  return JSON.stringify(geoJson, null, 2);
}

/**
 * Imports GeoJSON feature collection and returns zones & congestion states
 */
export function importFromGeoJson(geoJsonString: string): {
  zones: ZoneData[];
  congestions: Record<string, CongestionData>;
  error?: string;
} {
  try {
    const data = JSON.parse(geoJsonString);
    if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
      return { zones: [], congestions: {}, error: '유효한 GeoJSON FeatureCollection 형식이 아닙니다.' };
    }

    const zones: ZoneData[] = [];
    const congestions: Record<string, CongestionData> = {};

    data.features.forEach((feature: any, idx: number) => {
      const p = feature.properties || {};
      const id = p.id || `ZONE-IMP-${String(idx + 1).padStart(3, '0')}`;
      const name = p.name || `가져온 구역 ${idx + 1}`;
      const isCircle = p.zoneType === 'circle' || (p.radius && p.radius > 0);

      if (isCircle) {
        let lat = p.centerLat;
        let lng = p.centerLng;

        if (lat === undefined || lng === undefined) {
          if (feature.geometry?.type === 'Point') {
            lng = feature.geometry.coordinates[0];
            lat = feature.geometry.coordinates[1];
          } else if (feature.geometry?.type === 'Polygon' && feature.geometry.coordinates?.[0]?.length > 0) {
            const ring = feature.geometry.coordinates[0];
            let sumLat = 0;
            let sumLng = 0;
            ring.forEach((c: [number, number]) => {
              sumLng += c[0];
              sumLat += c[1];
            });
            lat = sumLat / ring.length;
            lng = sumLng / ring.length;
          } else {
            lat = 37.5730;
            lng = 126.9794;
          }
        }

        const radius = Number(p.radius) || 200;

        zones.push({
          id,
          name,
          type: 'circle',
          center: { lat: Number(lat), lng: Number(lng) },
          radius,
          visible: p.visible !== false,
          category: p.category || 'other',
          description: p.description || '',
          capacity: Number(p.capacity) || 10000,
          customColor: p.customColor,
          customBorderColor: p.customBorderColor,
          customOpacity: p.customOpacity,
        });
      } else if (feature.geometry?.type === 'Polygon') {
        const ring = feature.geometry.coordinates[0] || [];
        // Convert [lng, lat] to [lat, lng]
        const coords: [number, number][] = ring.map((pt: [number, number]) => [pt[1], pt[0]]);
        // Remove closing duplicate if present
        if (coords.length > 3) {
          const first = coords[0];
          const last = coords[coords.length - 1];
          if (Math.abs(first[0] - last[0]) < 0.00001 && Math.abs(first[1] - last[1]) < 0.00001) {
            coords.pop();
          }
        }

        const center = calculateCentroid(coords);

        zones.push({
          id,
          name,
          type: 'polygon',
          center,
          coordinates: coords,
          visible: p.visible !== false,
          category: p.category || 'other',
          description: p.description || '',
          capacity: Number(p.capacity) || 10000,
          customColor: p.customColor,
          customBorderColor: p.customBorderColor,
          customOpacity: p.customOpacity,
        });
      }

      const val = Number(p.congestionValue) || 30;
      congestions[id] = {
        zoneId: id,
        level: determineCongestionLevel(val),
        value: val,
        estimatedVisitors: Number(p.estimatedVisitors) || Math.round(val * 150),
        updatedAt: p.updatedAt || new Date().toISOString(),
        trend: 'stable',
      };
    });

    return { zones, congestions };
  } catch (err: any) {
    return { zones: [], congestions: {}, error: `파싱 실패: ${err?.message || '알 수 없는 오류'}` };
  }
}
