import { ZoneData, CongestionData } from '../types';

/**
 * Default monitoring zones (4 zones: A–D)
 * Layout follows the reference control-room mockup:
 *  - A: 익선동 (east, between 낙원동 and 종로3가역)
 *  - B: 헌법재판소 일대 (north, 재동·가회동 / 북촌 남측)
 *  - C: 낙원동 (center, 안국역 ~ 종각역)
 *  - D: 광화문광장 접점 (southwest, 세종대로 사거리 ~ 서울시청 방면)
 */
export const INITIAL_ZONES: ZoneData[] = [
  {
    id: 'ZONE-001',
    name: '익선동',
    type: 'polygon',
    center: {
      lat: 37.574521,
      lng: 126.989365,
    },
    coordinates: [
      [37.57785, 126.988962],
      [37.575063, 126.992066],
      [37.573205, 126.991721],
      [37.572195, 126.989997],
      [37.573424, 126.98679],
      [37.575391, 126.986652],
    ],
    visible: true,
    category: 'tourist',
    description: '익선동 한옥거리 및 종로3가역 북측 골목 상권 밀집 구역',
    capacity: 6000,
  },
  {
    id: 'ZONE-002',
    name: '헌법재판소 일대',
    type: 'polygon',
    center: {
      lat: 37.581123,
      lng: 126.98311,
    },
    coordinates: [
      [37.585664, 126.980169],
      [37.585036, 126.982928],
      [37.583533, 126.985341],
      [37.581348, 126.987066],
      [37.579708, 126.987238],
      [37.577932, 126.986203],
      [37.576839, 126.983272],
      [37.577522, 126.980341],
      [37.579572, 126.979479],
      [37.58408, 126.979066],
    ],
    visible: true,
    category: 'cultural',
    description: '헌법재판소·재동·가회동 일대 집회 및 보행 관제 구역',
    capacity: 9000,
  },
  {
    id: 'ZONE-003',
    name: '낙원동',
    type: 'polygon',
    center: {
      lat: 37.573816,
      lng: 126.983437,
    },
    coordinates: [
      [37.576566, 126.983203],
      [37.576648, 126.985514],
      [37.575009, 126.986307],
      [37.572823, 126.986031],
      [37.570965, 126.984824],
      [37.570555, 126.981721],
      [37.571921, 126.979997],
      [37.574244, 126.981031],
      [37.57561, 126.982307],
    ],
    visible: true,
    category: 'commercial',
    description: '안국역~종각역 사이 낙원상가·인사동 남측 보행 밀집 구역',
    capacity: 10000,
  },
  {
    id: 'ZONE-004',
    name: '광화문광장 접점',
    type: 'polygon',
    center: {
      lat: 37.5707,
      lng: 126.976184,
    },
    coordinates: [
      [37.573643, 126.977928],
      [37.572604, 126.979066],
      [37.569872, 126.978721],
      [37.568014, 126.976893],
      [37.56714, 126.975341],
      [37.571293, 126.971721],
      [37.572331, 126.973617],
    ],
    visible: true,
    category: 'plaza',
    description: '광화문광장 남단 세종대로 사거리 ~ 서울시청 방면 인파 접점',
    capacity: 20000,
  },
];

export const INITIAL_CONGESTIONS: Record<string, CongestionData> = {
  'ZONE-001': {
    zoneId: 'ZONE-001',
    level: 4,
    value: 92,
    updatedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    estimatedVisitors: 5520,
    trend: 'increasing',
  },
  'ZONE-002': {
    zoneId: 'ZONE-002',
    level: 1,
    value: 30,
    updatedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    estimatedVisitors: 2700,
    trend: 'stable',
  },
  'ZONE-003': {
    zoneId: 'ZONE-003',
    level: 2,
    value: 48,
    updatedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    estimatedVisitors: 4800,
    trend: 'stable',
  },
  'ZONE-004': {
    zoneId: 'ZONE-004',
    level: 1,
    value: 25,
    updatedAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    estimatedVisitors: 5000,
    trend: 'decreasing',
  },
};
