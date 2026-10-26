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

  // Filtered zones (편집 모드에서는 필터/검색 없이 전체 구역 목록 노출)
  const filteredZones = useMemo(() => {
    if (mode === 'edit') {
      return zones;
    }
    const term = searchTerm.toLowerCase();
    return zones.filter((zone) => {
      const matchesSearch =
        zone.name.toLowerCase().includes(term) ||
        zone.id.toLowerCase().includes(term) ||
        (zone.scannerName && zone.scannerName.toLowerCase().includes(term)) ||
        (zone.areaName && zone.areaName.toLowerCase().includes(term)) ||
        (zone.description && zone.description.toLowerCase().includes(term));
      const zoneCongestion = congestions[zone.id];
      const matchesLevel =
        levelFilter === 'all' || (zoneCongestion && zoneCongestion.level === levelFilter);
      const matchesArea =
        selectedAreaId === 'all' ||
        zone.areaId === selectedAreaId ||
        zone.areaName === selectedAreaId ||
        (selectedAreaId && AREAS.find((a) => a.id === selectedAreaId)?.name === zone.areaName);
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
    <aside className="w-80 border-r flex flex-col shrink-0 h-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-colors select-none">
      {/* Top Title & Quick Add */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {mode === 'edit' ? '구역 목록 (편집)' : '관제 구역 목록'}
          </h2>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span>총 {totalZones}개 구역</span>
            {mode === 'edit' ? (
              <>
                <span className="mx-1.5 text-neutral-300 dark:text-neutral-600">·</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">구역순 정렬</span>
              </>
            ) : (
              <>
                <span className="mx-1.5 text-neutral-300 dark:text-neutral-600">·</span>
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
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="localStorage에 저장된 편집 데이터를 삭제하고 최초 기본값(48개 구역)으로 초기화합니다"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>초기화</span>
          </button>
        )}
      </div>

      {/* 관제 모드 전용 필터 및 정렬 컨트롤 (편집 모드에서는 구역 목록만 표시) */}
      {mode !== 'edit' && (
        <>
          {/* Level Breakdown Grid (6단계 2줄 그리드: 3열 x 2줄 카드 형태 강조) */}
          <div className="p-2.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 grid grid-cols-3 gap-2">
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
                  style={{
                    borderColor: isSelected ? info.color : undefined,
                    backgroundColor: isSelected ? `${info.color}18` : undefined,
                  }}
                  className={`px-2.5 py-2.5 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'ring-1 shadow-xs'
                      : 'border-neutral-200/90 dark:border-neutral-800 bg-white dark:bg-neutral-800/70 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-2xs'
                  }`}
                >
                  {/* 좌측: 컬러 인디케이터 도트 + 상태명 */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: info.color }}
                    />
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate">
                      {info.name}
                    </span>
                  </div>

                  {/* 우측: 대형 강조 숫자 */}
                  <span
                    className="text-xl font-black font-mono tabular-nums leading-none tracking-tight shrink-0 ml-1.5"
                    style={{ color: count > 0 ? info.color : undefined }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input & Filter Clear */}
          <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="구역명, 스캐너, 영역 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {(levelFilter !== 'all' || selectedAreaId !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setLevelFilter('all');
                  setSelectedAreaId('all');
                }}
                className="px-2 py-1.5 text-[11px] text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap font-medium cursor-pointer"
              >
                초기화
              </button>
            )}
          </div>

          {/* Area Filter Select Box (영역 선택 - 가나다순) */}
          <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 flex items-center gap-2">
            <label htmlFor="area-select" className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>영역:</span>
            </label>
            <div className="relative flex-1">
              <select
                id="area-select"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full appearance-none pl-2.5 pr-7 py-1.5 text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer transition-colors truncate"
              >
                <option value="all">전체 영역 ({zones.length}개 구역)</option>
                {sortedAreas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.count}개 구역)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Sort Bar (밀집도순 · 체류인원 · 구역순 정렬) */}
          <div className="px-3 py-1.5 bg-neutral-50/80 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
              <ArrowUpDown className="w-3 h-3 text-neutral-400 shrink-0" />
              <span>정렬</span>
            </div>
            <div className="flex items-center p-0.5 bg-neutral-200/70 dark:bg-neutral-800 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => handleSortChange('density')}
                title="밀집도(혼잡도) 순 정렬 (클릭 시 오름차순/내림차순 전환)"
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5 cursor-pointer ${
                  sortType === 'density'
                    ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <span>밀집도순</span>
                {sortType === 'density' && (
                  <span className="text-[10px] font-bold">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSortChange('visitors')}
                title="추정 체류 인원 순 정렬 (클릭 시 오름차순/내림차순 전환)"
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5 cursor-pointer ${
                  sortType === 'visitors'
                    ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <span>체류인원</span>
                {sortType === 'visitors' && (
                  <span className="text-[10px] font-bold">{sortOrder === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSortChange('name')}
                title="구역 이름순 정렬 (클릭 시 오름차순/내림차순 전환)"
                className={`px-2 py-0.5 rounded-md transition-all flex items-center gap-0.5 cursor-pointer ${
                  sortType === 'name'
                    ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                }`}
              >
                <span>구역순</span>
                {sortType === 'name' && (
                  <span className="text-[10px] font-bold">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Zones List View */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
        {sortedZones.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            일치하는 관제 구역이 없습니다.
          </div>
        ) : (
          sortedZones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const c = congestions[zone.id];
            const levelInfo = c ? CONGESTION_LEVEL_MAP[c.level] : CONGESTION_LEVEL_MAP[1];
            const area = AREAS.find((a) => a.id === zone.areaId || a.name === zone.areaName);
            const visitors = c?.estimatedVisitors ?? Math.round(((zone.capacity || 3000) * (c?.value || 0)) / 100);

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
                className={`p-3 cursor-pointer transition-all group relative flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 ring-2 ring-blue-500/80 shadow-xs z-10'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                } ${!zone.visible ? 'opacity-50' : ''}`}
              >
                {/* 지도 선택 타겟팅 인디케이터 (좌측 파란색 액센트 바) */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-r shadow-xs pointer-events-none" />
                )}

                {/* Left zone indicator */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 shrink-0">
                    <CircleDot className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-blue-500'}`} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs ${isSelected ? 'text-blue-700 dark:text-blue-300 font-extrabold' : 'text-neutral-900 dark:text-neutral-100 font-bold'}`}>
                        {zone.name}
                      </span>
                      {area && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200/80 dark:border-neutral-700/60">
                          {area.name}
                        </span>
                      )}
                    </div>

                    {zone.description && (
                      <div className="text-[11px] text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
                        {zone.description}
                      </div>
                    )}

                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mt-0.5 font-mono">
                      <span>{zone.id}</span>
                      <span>·</span>
                      <span>R={zone.radius || 30}m</span>
                      <span>·</span>
                      <span className={`font-sans ${sortType === 'visitors' && mode !== 'edit' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-neutral-500 dark:text-neutral-400'}`}>
                        {visitors.toLocaleString()}명
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Congestion Status & Actions */}
                <div className="flex items-center gap-2 shrink-0 self-center">
                  {c && (
                    <div className="text-right flex flex-col justify-center">
                      <div className="flex items-center justify-end gap-1">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: levelInfo.color }}
                        />
                        <span className="text-xs font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
                          {c.value}%
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {levelInfo.name}
                      </div>
                    </div>
                  )}

                  {/* Quick Zone Action Buttons (CCTV 버튼 아래로 지도 표시여부(show/hide) 토글 버튼 배치) */}
                  <div className="flex flex-col items-center justify-center gap-1 shrink-0 self-center">
                    {/* CCTV View Button (으르신 친화적 대형 원형 버튼) */}
                    <button
                      type="button"
                      title={`${zone.name} CCTV 실시간 영상 관제 (클릭 시 화면 표출)`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenCctv) onOpenCctv(zone);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-950/70 border border-blue-300/90 dark:border-blue-700/80 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white hover:border-blue-600 shadow-2xs hover:shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                      aria-label={`${zone.name} CCTV 실시간 영상 관제`}
                    >
                      <Cctv className="w-4.5 h-4.5 shrink-0" />
                    </button>

                    {mode === 'edit' && (
                      <button
                        type="button"
                        title={zone.visible ? '지도에서 숨기기' : '지도에 표시하기'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleZoneVisibility(zone.id);
                        }}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                          zone.visible
                            ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                        aria-label={zone.visible ? `${zone.name} 지도에서 숨기기` : `${zone.name} 지도에 표시하기`}
                      >
                        {zone.visible ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
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
      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/90 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
        {mode === 'edit' ? (
          <span>등록 구역: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{sortedZones.length}개</strong> 구역 (구역순)</span>
        ) : (
          <span>검색 결과: <strong className="font-semibold text-neutral-800 dark:text-neutral-200">{filteredZones.length}개</strong> 구역</span>
        )}
        <span className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
          <Cctv className="w-3 h-3 text-blue-500" />
          <span>CCTV 관제: {sortedZones.length}대</span>
        </span>
      </div>
    </aside>
  );
};
