import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Eye,
  EyeOff,
  CircleDot,
  RotateCcw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  ArrowUpDown,
  MapPin,
  ChevronDown,
  Cctv,
} from 'lucide-react';
import { ZoneData, CongestionData, CongestionLevel, AppMode } from '../types';
import { CONGESTION_LEVEL_MAP } from '../utils/constants';
import { AREAS } from '../data/defaultZones';

interface LeftPanelProps {
  mode: AppMode;
  zones: ZoneData[];
  congestions: Record<string, CongestionData>;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  onToggleZoneVisibility: (zoneId: string) => void;
  onDuplicateZone: (zoneId: string) => void;
  onDeleteZone: (zoneId: string) => void;
  onCreateZone?: (type: 'circle' | 'polygon') => void;
  onFocusZoneOnMap: (zoneId: string) => void;
  onOpenCctv?: (zone: ZoneData) => void;
  onResetZones?: () => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  mode,
  zones,
  congestions,
  selectedZoneId,
  onSelectZone,
  onToggleZoneVisibility,
  onDuplicateZone,
  onDeleteZone,
  onCreateZone,
  onFocusZoneOnMap,
  onOpenCctv,
  onResetZones,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<CongestionLevel | 'all'>('all');
  const [selectedAreaId, setSelectedAreaId] = useState<string | 'all'>('all');
  const [sortType, setSortType] = useState<'density' | 'visitors' | 'name'>('density');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // 구역 카드 요소 ref 보관소 (지도에서 선택 시 스크롤 타겟팅용)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 지도에서 구역 선택 시 좌측 리스트에서 해당 카드가 화면 중앙으로 부드럽게 스크롤되어 타겟팅되도록 처리
  useEffect(() => {
    if (selectedZoneId && itemRefs.current[selectedZoneId]) {
      itemRefs.current[selectedZoneId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedZoneId]);

  const handleSortChange = (type: 'density' | 'visitors' | 'name') => {
    if (sortType === type) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortType(type);
      setSortOrder(type === 'name' ? 'asc' : 'desc');
    }
  };

  // Statistics calculation
  const totalZones = zones.length;
  const levelCounts: Record<CongestionLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let totalScore = 0;
  let scoreCount = 0;

  zones.forEach((zone) => {
    const c = congestions[zone.id];
    if (c) {
      levelCounts[c.level] = (levelCounts[c.level] || 0) + 1;
      totalScore += c.value;
      scoreCount++;
    }
  });

  const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;

  // Sorted Areas (가나다 순 정렬)
  const sortedAreas = useMemo(() => {
    const areaMap = new Map<string, { id: string; name: string; count: number }>();

    AREAS.forEach((a) => {
      areaMap.set(a.id, { id: a.id, name: a.name, count: 0 });
    });

    zones.forEach((z) => {
      const match = AREAS.find((a) => a.id === z.areaId || a.name === z.areaName);
      if (match) {
        const item = areaMap.get(match.id);
        if (item) item.count++;
      } else if (z.areaName || z.areaId) {
        const key = z.areaId || z.areaName || 'unknown';
        const name = z.areaName || z.areaId || '기타';
        const existing = areaMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          areaMap.set(key, { id: key, name, count: 1 });
        }
      }
    });

    return Array.from(areaMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [zones]);

  // Filtered zones (관제 모드: 혼잡도/검색/영역 필터, 편집 모드: 검색/영역 필터)
  const filteredZones = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return zones.filter((zone) => {
      const matchesSearch =
        !term ||
        zone.name.toLowerCase().includes(term) ||
        zone.id.toLowerCase().includes(term) ||
        (zone.scannerName && zone.scannerName.toLowerCase().includes(term)) ||
        (zone.areaName && zone.areaName.toLowerCase().includes(term)) ||
        (zone.description && zone.description.toLowerCase().includes(term));

      const matchesArea =
        selectedAreaId === 'all' ||
        zone.areaId === selectedAreaId ||
        zone.areaName === selectedAreaId ||
        (selectedAreaId && AREAS.find((a) => a.id === selectedAreaId)?.name === zone.areaName);

      if (mode === 'edit') {
        return matchesSearch && matchesArea;
      }

      const zoneCongestion = congestions[zone.id];
      const matchesLevel =
        levelFilter === 'all' || (zoneCongestion && zoneCongestion.level === levelFilter);
      return matchesSearch && matchesLevel && matchesArea;
    });
  }, [zones, mode, searchTerm, congestions, levelFilter, selectedAreaId]);

  // Sorted zones (편집 모드에서는 구역명 기준 오름차순으로 정적으로만 고정하여 목록 흔들림 방지)
  const sortedZones = useMemo(() => {
    if (mode === 'edit') {
      return [...filteredZones].sort((a, b) =>
        a.name.localeCompare(b.name, 'ko', { numeric: true })
      );
    }

    return [...filteredZones].sort((a, b) => {
      const cA = congestions[a.id];
      const cB = congestions[b.id];
      const valA = cA ? cA.value : 0;
      const valB = cB ? cB.value : 0;

      const visitorsA = cA?.estimatedVisitors ?? Math.round(((a.capacity || 3000) * valA) / 100);
      const visitorsB = cB?.estimatedVisitors ?? Math.round(((b.capacity || 3000) * valB) / 100);

      if (sortType === 'density') {
        if (valA !== valB) {
          return sortOrder === 'desc' ? valB - valA : valA - valB;
        }
        return visitorsB - visitorsA || a.name.localeCompare(b.name, 'ko', { numeric: true });
      }

      if (sortType === 'visitors') {
        if (visitorsA !== visitorsB) {
          return sortOrder === 'desc' ? visitorsB - visitorsA : visitorsA - visitorsB;
        }
        return valB - valA || a.name.localeCompare(b.name, 'ko', { numeric: true });
      }

      if (sortType === 'name') {
        const cmp = a.name.localeCompare(b.name, 'ko', { numeric: true });
        return sortOrder === 'asc' ? cmp : -cmp;
      }

      return 0;
    });
  }, [filteredZones, mode, sortType, sortOrder, congestions]);

  return (
    <aside className="ds-panel-left">
      {/* Top Title & Quick Reset */}
      <div className="ds-panel-header">
        <div>
          <h2 className="text-sm font-semibold text-primary">
            {mode === 'edit' ? '구역 목록 (편집)' : '관제 구역 목록'}
          </h2>
          <div className="text-xs text-muted mt-0-5">
            <span>총 {totalZones}개 구역</span>
            {filteredZones.length !== totalZones && (
              <span className="text-blue font-medium ml-1">({filteredZones.length}개 표시)</span>
            )}
            {mode === 'edit' ? (
              <>
                <span className="mx-1-5 text-muted">·</span>
                <span className="text-blue font-medium">구역순 정렬</span>
              </>
            ) : (
              <>
                <span className="mx-1-5 text-muted">·</span>
                <span>평균 혼잡도 <span className="font-mono tabular-nums font-semibold">{avgScore}%</span></span>
              </>
            )}
          </div>
        </div>

        {/* Edit Mode Reset Button */}
        {mode === 'edit' && (
          <button
            type="button"
            onClick={onResetZones}
            className="ds-btn ds-btn-secondary ds-btn-xs"
            title="localStorage에 저장된 편집 데이터를 삭제하고 최초 기본값(48개 구역)으로 초기화합니다"
          >
            <RotateCcw style={{ width: 14, height: 14 }} />
            <span>초기화</span>
          </button>
        )}
      </div>

      {/* Level Breakdown Grid (6단계 2줄 그리드: 3열 x 2줄 카드 형태 - 관제 모드 전용) */}
      {mode !== 'edit' && (
        <div className="ds-level-grid">
          {([1, 2, 3, 4, 5, 6] as CongestionLevel[]).map((lvl) => {
            const info = CONGESTION_LEVEL_MAP[lvl];
            const count = levelCounts[lvl];
            const isSelected = levelFilter === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(isSelected ? 'all' : lvl)}
                title={`${info.name}: ${info.description} (클릭 시 ${info.name} 구역만 필터)`}
                className={`ds-level-grid-card ds-level-grid-card-${lvl} ${isSelected ? 'is-selected' : ''}`}
              >
                <div className="ds-level-label-box">
                  <span className={`ds-lvl-dot ds-lvl-dot-${lvl}`} />
                  <span className="ds-level-title">{info.name}</span>
                </div>
                <span className="ds-level-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search Input & Filter Clear (관제 모드 & 구역편집 모드 공통 표출) */}
      <div className="ds-search-bar">
        <div className="ds-search-wrapper">
          <Search className="ds-search-icon" style={{ width: 14, height: 14 }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="구역명, 스캐너, 영역 검색..."
            className="ds-search-input"
          />
        </div>
        {(searchTerm || (mode !== 'edit' && levelFilter !== 'all') || selectedAreaId !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setLevelFilter('all');
              setSelectedAreaId('all');
            }}
            className="ds-btn ds-btn-ghost ds-btn-xs text-blue"
          >
            초기화
          </button>
        )}
      </div>

      {/* Area Filter Select Box (영역 선택 - 가나다순, 관제 모드 & 구역편집 모드 공통 표출) */}
      <div className="ds-area-filter-bar">
        <label htmlFor="area-select" className="ds-form-label" style={{ marginBottom: 0 }}>
          <MapPin style={{ width: 14, height: 14, color: '#3b82f6', flexShrink: 0 }} />
          <span>영역:</span>
        </label>
        <div className="ds-select-wrapper">
          <select
            id="area-select"
            value={selectedAreaId}
            onChange={(e) => setSelectedAreaId(e.target.value)}
            className="ds-select"
            style={{ padding: '5px 28px 5px 10px', fontSize: '11px' }}
          >
            <option value="all">전체 영역 ({zones.length}개 구역)</option>
            {sortedAreas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.count}개 구역)
              </option>
            ))}
          </select>
          <ChevronDown className="ds-select-icon" style={{ width: 14, height: 14 }} />
        </div>
      </div>

      {/* Sort Bar (밀집도순 · 체류인원 · 구역순 정렬 - 관제 모드 전용) */}
      {mode !== 'edit' && (
        <div className="ds-sort-bar">
          <div className="ds-sort-label">
            <ArrowUpDown style={{ width: 12, height: 12 }} />
            <span>정렬</span>
          </div>
          <div className="ds-segmented-group" style={{ padding: 2 }}>
            <button
              type="button"
              onClick={() => handleSortChange('density')}
              title="밀집도(혼잡도) 순 정렬"
              className={`ds-segmented-item ${sortType === 'density' ? 'active' : ''}`}
              style={{ padding: '3px 8px', fontSize: '10px' }}
            >
              <span>밀집도순</span>
              {sortType === 'density' && (
                <span style={{ fontSize: 9, fontWeight: 'bold' }}>{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSortChange('visitors')}
              title="추정 체류 인원 순 정렬"
              className={`ds-segmented-item ${sortType === 'visitors' ? 'active' : ''}`}
              style={{ padding: '3px 8px', fontSize: '10px' }}
            >
              <span>체류인원</span>
              {sortType === 'visitors' && (
                <span style={{ fontSize: 9, fontWeight: 'bold' }}>{sortOrder === 'desc' ? '↓' : '↑'}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleSortChange('name')}
              title="구역 이름순 정렬"
              className={`ds-segmented-item ${sortType === 'name' ? 'active' : ''}`}
              style={{ padding: '3px 8px', fontSize: '10px' }}
            >
              <span>구역순</span>
              {sortType === 'name' && (
                <span style={{ fontSize: 9, fontWeight: 'bold' }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Zones List View */}
      <div className="ds-panel-body">
        {sortedZones.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', fontSize: 12, color: 'var(--ds-text-muted)' }}>
            {mode === 'edit' ? '일치하는 구역이 없습니다.' : '일치하는 관제 구역이 없습니다.'}
          </div>
        ) : (
          sortedZones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const c = congestions[zone.id];
            const levelInfo = c ? CONGESTION_LEVEL_MAP[c.level] : CONGESTION_LEVEL_MAP[1];
            const area = AREAS.find((a) => a.id === zone.areaId || a.name === zone.areaName);
            const visitors = c?.estimatedVisitors ?? Math.round(((zone.capacity || 3000) * (c?.value || 0)) / 100);
            const levelNum = c ? c.level : 1;

            return (
              <div
                key={zone.id}
                ref={(el) => {
                  itemRefs.current[zone.id] = el;
                }}
                id={`zone-card-${zone.id}`}
                onClick={() => {
                  onSelectZone(zone.id);
                  onFocusZoneOnMap(zone.id);
                }}
                className={`ds-zone-card ${isSelected ? 'is-selected' : ''} ${!zone.visible ? 'is-hidden' : ''}`}
              >
                {/* 지도 선택 타겟팅 인디케이터 (좌측 파란색 액센트 바) */}
                {isSelected && <div className="ds-zone-accent-bar" />}

                {/* Left zone indicator & texts */}
                <div className="ds-zone-info-left">
                  <div style={{ color: isSelected ? 'var(--ds-primary)' : 'var(--ds-text-muted)', flexShrink: 0 }}>
                    <CircleDot style={{ width: 16, height: 16 }} />
                  </div>

                  <div className="ds-zone-texts">
                    <div className="ds-zone-title-row">
                      <span className="ds-zone-name">{zone.name}</span>
                      {area && <span className="ds-area-tag">{area.name}</span>}
                    </div>

                    {zone.description && (
                      <div className="ds-zone-desc">{zone.description}</div>
                    )}

                    <div className="ds-zone-meta">
                      <span>{zone.id}</span>
                      <span>·</span>
                      <span>R={zone.radius || 30}m</span>
                      <span>·</span>
                      <span className={sortType === 'visitors' && mode !== 'edit' ? 'text-blue font-bold' : ''}>
                        {visitors.toLocaleString()}명
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Congestion Status & Action Buttons */}
                <div className="ds-zone-actions-right">
                  {c && (
                    <div className="ds-zone-congestion-box">
                      <div className="ds-zone-congestion-value-row">
                        <span className={`ds-lvl-dot ds-lvl-dot-${levelNum}`} />
                        <span className="ds-zone-percent">{c.value}%</span>
                      </div>
                      <span className="ds-zone-level-name">{levelInfo.name}</span>
                    </div>
                  )}

                  {/* Quick Zone Action Buttons */}
                  <div className="ds-zone-buttons-col">
                    <button
                      type="button"
                      title={`${zone.name} CCTV 실시간 영상 관제 (클릭 시 화면 표출)`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenCctv) onOpenCctv(zone);
                      }}
                      className="ds-btn-cctv"
                      aria-label={`${zone.name} CCTV 실시간 영상 관제`}
                    >
                      <Cctv style={{ width: 16, height: 16 }} />
                    </button>

                    {mode === 'edit' && (
                      <button
                        type="button"
                        title={zone.visible ? '지도에서 숨기기' : '지도에 표시하기'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleZoneVisibility(zone.id);
                        }}
                        className="ds-btn-icon"
                        aria-label={zone.visible ? `${zone.name} 지도에서 숨기기` : `${zone.name} 지도에 표시하기`}
                      >
                        {zone.visible ? (
                          <Eye style={{ width: 15, height: 15, color: 'var(--ds-primary)' }} />
                        ) : (
                          <EyeOff style={{ width: 15, height: 15, color: 'var(--ds-text-disabled)' }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="ds-panel-footer">
        {mode === 'edit' ? (
          <span>등록 구역: <strong style={{ color: 'var(--ds-text-primary)' }}>{sortedZones.length}개</strong> 구역 (구역순)</span>
        ) : (
          <span>검색 결과: <strong style={{ color: 'var(--ds-text-primary)' }}>{filteredZones.length}개</strong> 구역</span>
        )}
        <span className="flex items-center gap-1 text-muted">
          <Cctv style={{ width: 13, height: 13, color: 'var(--ds-primary)' }} />
          <span>CCTV 관제: {sortedZones.length}대</span>
        </span>
      </div>
    </aside>
  );
};
