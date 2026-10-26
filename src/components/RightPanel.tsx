import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  RotateCcw,
  Trash2,
  Copy,
  MapPin,
  CircleDot,
  Hexagon,
  Plus,
  Minus,
  Navigation,
  Sliders,
  Eye,
  EyeOff,
  Crosshair,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { ZoneData, CongestionData, CongestionLevel } from '../types';
import { CONGESTION_LEVEL_MAP } from '../utils/constants';
import { calculateCentroid, determineCongestionLevel } from '../utils/geoUtils';
import { AREAS } from '../data/defaultZones';
import { SmartScannerIcon } from './SmartScannerIcon';

interface RightPanelProps {
  zone: ZoneData | null;
  congestion: CongestionData | null;
  onUpdateZone: (updatedZone: ZoneData) => void;
  onUpdateCongestion: (updatedCongestion: CongestionData) => void;
  onClose: () => void;
  onDeleteZone: (zoneId: string) => void;
  onDuplicateZone: (zoneId: string) => void;
  onCenterMapOnZone: (zone: ZoneData) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  zone,
  congestion,
  onUpdateZone,
  onUpdateCongestion,
  onClose,
  onDeleteZone,
  onDuplicateZone,
  onCenterMapOnZone,
}) => {
  // Local editable draft state for instant live two-way editing
  const [draftZone, setDraftZone] = useState<ZoneData | null>(null);
  const [draftCongestion, setDraftCongestion] = useState<CongestionData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (zone) {
      setDraftZone(JSON.parse(JSON.stringify(zone)));
      setHasChanges(false);
    } else {
      setDraftZone(null);
    }
  }, [zone?.id]);

  useEffect(() => {
    if (congestion) {
      setDraftCongestion(JSON.parse(JSON.stringify(congestion)));
    } else {
      setDraftCongestion(null);
    }
  }, [congestion?.zoneId]);

  // Keep coordinates updated if user dragged markers on the map
  useEffect(() => {
    if (zone && draftZone && zone.id === draftZone.id) {
      if (zone.type === 'circle') {
        if (
          Math.abs(zone.center.lat - draftZone.center.lat) > 0.000001 ||
          Math.abs(zone.center.lng - draftZone.center.lng) > 0.000001 ||
          zone.radius !== draftZone.radius
        ) {
          setDraftZone((prev) =>
            prev
              ? {
                  ...prev,
                  center: { ...zone.center },
                  radius: zone.radius,
                }
              : null
          );
        }
      } else if (zone.type === 'polygon' && zone.coordinates) {
        // Check if map coordinates changed
        const mapCoordsStr = JSON.stringify(zone.coordinates);
        const draftCoordsStr = JSON.stringify(draftZone.coordinates);
        if (mapCoordsStr !== draftCoordsStr) {
          setDraftZone((prev) =>
            prev
              ? {
                  ...prev,
                  coordinates: JSON.parse(mapCoordsStr),
                  center: { ...zone.center },
                }
              : null
          );
        }
      }
    }
  }, [zone?.center.lat, zone?.center.lng, zone?.radius, JSON.stringify(zone?.coordinates)]);

  if (!zone || !draftZone) {
    return (
      <aside className="w-88 border-l flex flex-col shrink-0 h-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-colors p-6 select-none">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-500 mb-3">
            <Sliders className="w-6 h-6" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 font-bold text-[10px] mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>구역 편집 모드</span>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
            편집할 관제 구역을 선택하세요
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs leading-relaxed">
            지도 위 구역 또는 좌측 목록에서 구역을 클릭하면 위치 좌표, 반경, 혼잡도 상태를 실시간 편집할 수 있습니다.
          </p>
        </div>
      </aside>
    );
  }

  const currentLevel = draftCongestion ? draftCongestion.level : 1;
  const levelInfo = CONGESTION_LEVEL_MAP[currentLevel];

  // Handler for instant update
  const handleZoneFieldChange = (updates: Partial<ZoneData>) => {
    if (!draftZone) return;
    const next = { ...draftZone, ...updates };
    setDraftZone(next);
    setHasChanges(true);
    onUpdateZone(next); // instant live reflection to map
  };

  const handleCenterChange = (key: 'lat' | 'lng', val: number) => {
    if (!draftZone) return;
    const nextCenter = { ...draftZone.center, [key]: val };
    handleZoneFieldChange({ center: nextCenter });
  };

  const handleRadiusChange = (radiusVal: number) => {
    if (radiusVal < 10) radiusVal = 10;
    if (radiusVal > 5000) radiusVal = 5000;
    handleZoneFieldChange({ radius: radiusVal });
  };

  const handleVertexChange = (index: number, key: 'lat' | 'lng', val: number) => {
    if (!draftZone || !draftZone.coordinates) return;
    const newCoords = [...draftZone.coordinates];
    const cur = newCoords[index] || [37.5730, 126.9794];
    newCoords[index] = key === 'lat' ? [val, cur[1]] : [cur[0], val];
    const newCenter = calculateCentroid(newCoords);
    handleZoneFieldChange({ coordinates: newCoords, center: newCenter });
  };

  const handleAddVertex = () => {
    if (!draftZone || !draftZone.coordinates) return;
    const coords = [...draftZone.coordinates];
    // Add a point offset from the last point
    const last = coords[coords.length - 1] || [draftZone.center.lat, draftZone.center.lng];
    coords.push([last[0] + 0.001, last[1] + 0.001]);
    const newCenter = calculateCentroid(coords);
    handleZoneFieldChange({ coordinates: coords, center: newCenter });
  };

  const handleRemoveVertex = (index: number) => {
    if (!draftZone || !draftZone.coordinates || draftZone.coordinates.length <= 3) {
      alert('다각형 구역은 최소 3개의 꼭짓점이 필요합니다.');
      return;
    }
    const coords = draftZone.coordinates.filter((_, i) => i !== index);
    const newCenter = calculateCentroid(coords);
    handleZoneFieldChange({ coordinates: coords, center: newCenter });
  };

  const handleCongestionValueChange = (val: number) => {
    if (!draftCongestion) return;
    const lvl = determineCongestionLevel(val);
    const next = {
      ...draftCongestion,
      value: val,
      level: lvl,
      estimatedVisitors: Math.round(((draftZone.capacity || 10000) * val) / 100),
      updatedAt: new Date().toISOString(),
    };
    setDraftCongestion(next);
    onUpdateCongestion(next);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (zone) {
      setDraftZone(JSON.parse(JSON.stringify(zone)));
      onUpdateZone(zone);
    }
    if (congestion) {
      setDraftCongestion(JSON.parse(JSON.stringify(congestion)));
      onUpdateCongestion(congestion);
    }
    setHasChanges(false);
  };

  return (
    <aside className="w-88 border-l flex flex-col shrink-0 h-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-colors select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-amber-500/5 dark:bg-amber-500/10">
        <div className="flex items-center gap-2">
          {draftZone.type === 'circle' ? (
            <CircleDot className="w-3.5 h-3.5 text-blue-500" />
          ) : (
            <Hexagon className="w-3.5 h-3.5 text-emerald-500" />
          )}
          <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
            속성 편집
          </span>
          <span className="text-xs text-neutral-400">·</span>
          <span className="font-mono text-xs text-neutral-500">{draftZone.id}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCenterMapOnZone(draftZone)}
            title="지도 중심 이동"
            className="p-1.5 text-neutral-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Navigation className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="닫기"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Basic Info */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">구역명</label>
              <input
                type="text"
                value={draftZone.name}
                onChange={(e) => handleZoneFieldChange({ name: e.target.value })}
                className="w-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 font-bold focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">소속 영역 (Area)</label>
              <select
                value={draftZone.areaId || ''}
                onChange={(e) => {
                  const targetArea = AREAS.find((a) => a.id === e.target.value);
                  handleZoneFieldChange({
                    areaId: e.target.value,
                    areaName: targetArea ? targetArea.name : '',
                  });
                }}
                className="w-full px-2.5 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 font-medium focus:ring-1 focus:ring-blue-500"
              >
                <option value="">(미지정)</option>
                {AREAS.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400 mb-1 font-medium text-left justify-start">
              <SmartScannerIcon size={14} className="text-blue-500 shrink-0" />
              <span>스마트 스캐너 기기명</span>
            </label>
            <input
              type="text"
              value={draftZone.scannerName || ''}
              placeholder="예: CCTV 방범574"
              onChange={(e) => handleZoneFieldChange({ scannerName: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium text-left">
              구역 설명 (Description)
            </label>
            <input
              type="text"
              value={draftZone.description || ''}
              placeholder="예: 서울공예박물관 남동측 보행광장"
              onChange={(e) => handleZoneFieldChange({ description: e.target.value })}
              className="w-full px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-neutral-600 dark:text-neutral-400 mb-1 font-medium">지도 표시 여부</label>
            <button
              type="button"
              onClick={() => handleZoneFieldChange({ visible: !draftZone.visible })}
              className={`w-full py-2 px-3 rounded-md border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                draftZone.visible
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                  : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500'
              }`}
            >
              {draftZone.visible ? (
                <>
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>지도에 표시 중</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-neutral-400" />
                  <span>지도에서 숨김</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Spatial Coordinates & Geometry */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              <span>좌표 및 형상 설정 (원형)</span>
            </span>
            <span className="text-[11px] text-neutral-400">실시간 지도 동기화</span>
          </div>

          {/* Circle Geometry Inputs */}
          <div className="space-y-3 bg-neutral-50 dark:bg-neutral-800/40 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">중심 위도 (Lat)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={draftZone.center.lat}
                  onChange={(e) => handleCenterChange('lat', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 text-xs font-mono tabular-nums bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">중심 경도 (Lng)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={draftZone.center.lng}
                  onChange={(e) => handleCenterChange('lng', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1 text-xs font-mono tabular-nums bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded text-neutral-900 dark:text-neutral-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-neutral-500 dark:text-neutral-400">반경 (Radius)</label>
                <span className="font-mono text-xs font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {draftZone.radius || 30} m
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="5"
                value={draftZone.radius || 30}
                onChange={(e) => handleRadiusChange(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex items-center gap-1.5 mt-1">
                {[-20, -10, +10, +20].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleRadiusChange((draftZone.radius || 30) + delta)}
                    className="flex-1 py-0.5 text-[10px] font-mono bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 cursor-pointer"
                  >
                    {delta > 0 ? `+${delta}m` : `${delta}m`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Congestion Metrics */}
        {draftCongestion && (
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-500" />
                <span>혼잡도 설정</span>
              </span>
              <span
                className="font-bold text-xs px-2 py-0.5 rounded"
                style={{
                  backgroundColor: levelInfo.bgLight,
                  color: levelInfo.textColor,
                  border: `1px solid ${levelInfo.borderColor}`,
                }}
              >
                {levelInfo.name} ({draftCongestion.value}%)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">혼잡도 수치</span>
                <span className="font-mono text-xs font-bold tabular-nums text-neutral-900 dark:text-neutral-100">
                  {draftCongestion.value} %
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={draftCongestion.value}
                onChange={(e) => handleCongestionValueChange(parseInt(e.target.value, 10))}
                className="w-full accent-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5">추정 체류 인원</span>
                <span className="font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100">
                  {(draftCongestion.estimatedVisitors || 0).toLocaleString()} 명
                </span>
              </div>

              <div className="p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded border border-neutral-200 dark:border-neutral-700/60">
                <span className="text-neutral-500 dark:text-neutral-400 block mb-0.5">수용 한계치</span>
                <span className="font-mono font-bold text-xs text-neutral-900 dark:text-neutral-100">
                  {(draftZone.capacity || 10000).toLocaleString()} 명
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicateZone(draftZone.id)}
            title="구역 복제"
            className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 rounded-md"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteZone(draftZone.id)}
            title="구역 삭제"
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>원래대로</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onUpdateZone(draftZone);
              if (draftCongestion) onUpdateCongestion(draftCongestion);
              setHasChanges(false);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            <span>수정사항 저장</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
