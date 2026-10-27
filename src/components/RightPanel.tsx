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
  ChevronDown,
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
      <aside className="ds-panel-right" style={{ padding: 24 }}>
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'var(--ds-accent-edit-subtle)',
            border: '1px solid var(--ds-accent-edit-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--ds-accent-edit)',
            marginBottom: 12
          }}>
            <Sliders style={{ width: 24, height: 24 }} />
          </div>
          <div className="ds-badge ds-badge-xs text-amber" style={{
            backgroundColor: 'var(--ds-accent-edit-subtle)',
            borderColor: 'var(--ds-accent-edit-border)',
            marginBottom: 10
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--ds-accent-edit)' }} />
            <span>구역 편집 모드</span>
          </div>
          <h3 className="text-sm font-semibold text-primary" style={{ marginBottom: 4 }}>
            편집할 관제 구역을 선택하세요
          </h3>
          <p className="text-xs text-muted" style={{ maxWidth: 260, lineHeight: 1.6 }}>
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
    <aside className="ds-panel-right">
      {/* Header */}
      <div className="ds-panel-header" style={{ backgroundColor: 'var(--ds-bg-surface-subtle)' }}>
        <div className="flex items-center gap-2">
          {draftZone.type === 'circle' ? (
            <CircleDot style={{ width: 14, height: 14, color: '#3b82f6' }} />
          ) : (
            <Hexagon style={{ width: 14, height: 14, color: '#10b981' }} />
          )}
          <span className="text-xs font-semibold text-primary">
            속성 편집
          </span>
          <span className="text-xs text-muted">·</span>
          <span className="font-mono text-xs text-muted">{draftZone.id}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onCenterMapOnZone(draftZone)}
            title="지도 중심 이동"
            className="ds-btn-icon"
          >
            <Navigation style={{ width: 14, height: 14 }} />
          </button>
          <button
            type="button"
            onClick={onClose}
            title="닫기"
            className="ds-btn-icon"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="ds-panel-body p-5 flex flex-col gap-6 text-xs">
        {/* Basic Info */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="ds-form-label">구역명</label>
              <input
                type="text"
                value={draftZone.name}
                onChange={(e) => handleZoneFieldChange({ name: e.target.value })}
                className="ds-input ds-input-bold"
              />
            </div>
            <div>
              <label className="ds-form-label">소속 영역 (Area)</label>
              <div className="ds-select-wrapper">
                <select
                  value={draftZone.areaId || ''}
                  onChange={(e) => {
                    const targetArea = AREAS.find((a) => a.id === e.target.value);
                    handleZoneFieldChange({
                      areaId: e.target.value,
                      areaName: targetArea ? targetArea.name : '',
                    });
                  }}
                  className="ds-select"
                >
                  <option value="">(미지정)</option>
                  {AREAS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.code})
                    </option>
                  ))}
                </select>
                <ChevronDown className="ds-select-icon" style={{ width: 14, height: 14 }} />
              </div>
            </div>
          </div>

          <div>
            <label className="ds-form-label text-left justify-start">
              <SmartScannerIcon size={14} className="shrink-0" style={{ color: 'var(--ds-primary)' }} />
              <span>스마트 스캐너 기기명</span>
            </label>
            <input
              type="text"
              value={draftZone.scannerName || ''}
              placeholder="예: CCTV 방범574"
              onChange={(e) => handleZoneFieldChange({ scannerName: e.target.value })}
              className="ds-input"
            />
          </div>

          <div>
            <label className="ds-form-label text-left">
              구역 설명 (Description)
            </label>
            <input
              type="text"
              value={draftZone.description || ''}
              placeholder="예: 서울공예박물관 남동측 보행광장"
              onChange={(e) => handleZoneFieldChange({ description: e.target.value })}
              className="ds-input"
            />
          </div>

          <div>
            <label className="ds-form-label">지도 표시 여부</label>
            <button
              type="button"
              onClick={() => handleZoneFieldChange({ visible: !draftZone.visible })}
              className={`ds-toggle-btn ${draftZone.visible ? 'is-active' : 'is-inactive'}`}
            >
              {draftZone.visible ? (
                <>
                  <Eye style={{ width: 15, height: 15 }} />
                  <span>지도에 표시 중</span>
                </>
              ) : (
                <>
                  <EyeOff style={{ width: 15, height: 15 }} />
                  <span>지도에서 숨김</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Spatial Coordinates & Geometry */}
        <div className="ds-form-section">
          <div className="ds-form-section-header">
            <span className="font-semibold text-primary flex items-center gap-1-5">
              <MapPin style={{ width: 14, height: 14, color: '#3b82f6' }} />
              <span>좌표 및 형상 설정 (원형)</span>
            </span>
            <span className="text-2xs text-muted">실시간 지도 동기화</span>
          </div>

          {/* Circle Geometry Inputs */}
          <div style={{
            backgroundColor: 'var(--ds-bg-surface-sunken)',
            padding: 12,
            borderRadius: 'var(--ds-radius-md)',
            border: '1px solid var(--ds-border-default)'
          }} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="ds-form-label" style={{ fontSize: 10 }}>중심 위도 (Lat)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={draftZone.center.lat}
                  onChange={(e) => handleCenterChange('lat', parseFloat(e.target.value) || 0)}
                  className="ds-input ds-input-mono ds-input-sm"
                  style={{ backgroundColor: 'var(--ds-bg-surface)' }}
                />
              </div>
              <div>
                <label className="ds-form-label" style={{ fontSize: 10 }}>중심 경도 (Lng)</label>
                <input
                  type="number"
                  step="0.0001"
                  value={draftZone.center.lng}
                  onChange={(e) => handleCenterChange('lng', parseFloat(e.target.value) || 0)}
                  className="ds-input ds-input-mono ds-input-sm"
                  style={{ backgroundColor: 'var(--ds-bg-surface)' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="ds-form-label" style={{ fontSize: 10, marginBottom: 0 }}>반경 (Radius)</label>
                <span className="font-mono text-xs font-bold tabular-nums text-primary">
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
                className="ds-slider"
              />
              <div className="ds-delta-btn-group">
                {[-20, -10, +10, +20].map((delta) => (
                  <button
                    key={delta}
                    type="button"
                    onClick={() => handleRadiusChange((draftZone.radius || 30) + delta)}
                    className="ds-delta-btn"
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
          <div className="ds-form-section">
            <div className="ds-form-section-header">
              <span className="font-semibold text-primary flex items-center gap-1-5">
                <Sliders style={{ width: 14, height: 14, color: '#f59e0b' }} />
                <span>혼잡도 설정</span>
              </span>
              <span className={`ds-badge ds-badge-sm ds-badge-lvl-${currentLevel}`}>
                {levelInfo.name} ({draftCongestion.value}%)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1-5">
                <span className="text-xs text-muted">혼잡도 수치</span>
                <span className="font-mono text-xs font-bold tabular-nums text-primary">
                  {draftCongestion.value} %
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={draftCongestion.value}
                onChange={(e) => handleCongestionValueChange(parseInt(e.target.value, 10))}
                className="ds-slider"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div style={{
                padding: '10px 12px',
                backgroundColor: 'var(--ds-bg-surface-sunken)',
                borderRadius: 'var(--ds-radius-sm)',
                border: '1px solid var(--ds-border-default)'
              }}>
                <span className="text-muted block mb-1" style={{ fontSize: 11 }}>추정 체류 인원</span>
                <span className="font-mono font-bold text-xs text-primary">
                  {(draftCongestion.estimatedVisitors || 0).toLocaleString()} 명
                </span>
              </div>

              <div style={{
                padding: '10px 12px',
                backgroundColor: 'var(--ds-bg-surface-sunken)',
                borderRadius: 'var(--ds-radius-sm)',
                border: '1px solid var(--ds-border-default)'
              }}>
                <span className="text-muted block mb-1" style={{ fontSize: 11 }}>수용 한계치</span>
                <span className="font-mono font-bold text-xs text-primary">
                  {(draftZone.capacity || 10000).toLocaleString()} 명
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Action Buttons */}
      <div className="ds-panel-footer">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDuplicateZone(draftZone.id)}
            title="구역 복제"
            className="ds-btn-icon"
          >
            <Copy style={{ width: 16, height: 16 }} />
          </button>
          <button
            type="button"
            onClick={() => onDeleteZone(draftZone.id)}
            title="구역 삭제"
            className="ds-btn-icon"
            style={{ color: 'var(--ds-danger)' }}
          >
            <Trash2 style={{ width: 16, height: 16 }} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasChanges && (
            <button
              type="button"
              onClick={handleReset}
              className="ds-btn ds-btn-ghost ds-btn-sm"
            >
              <RotateCcw style={{ width: 14, height: 14 }} />
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
            className="ds-btn ds-btn-primary ds-btn-sm"
          >
            <Save style={{ width: 14, height: 14 }} />
            <span>수정사항 저장</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
