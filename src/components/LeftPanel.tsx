import React, { useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  CircleDot,
  Hexagon,
  Copy,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { ZoneData, CongestionData, CongestionLevel } from '../types';
import { CONGESTION_LEVEL_MAP } from '../utils/constants';

interface LeftPanelProps {
  zones: ZoneData[];
  congestions: Record<string, CongestionData>;
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  onToggleZoneVisibility: (zoneId: string) => void;
  onDuplicateZone: (zoneId: string) => void;
  onDeleteZone: (zoneId: string) => void;
  onCreateZone: (type: 'circle' | 'polygon') => void;
  onFocusZoneOnMap: (zoneId: string) => void;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
  zones,
  congestions,
  selectedZoneId,
  onSelectZone,
  onToggleZoneVisibility,
  onDuplicateZone,
  onDeleteZone,
  onCreateZone,
  onFocusZoneOnMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<CongestionLevel | 'all'>('all');
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Statistics calculation
  const totalZones = zones.length;
  const levelCounts: Record<CongestionLevel, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
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

  // Filtered zones
  const filteredZones = zones.filter((zone) => {
    const matchesSearch =
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.id.toLowerCase().includes(searchTerm.toLowerCase());
    const zoneCongestion = congestions[zone.id];
    const matchesLevel =
      levelFilter === 'all' || (zoneCongestion && zoneCongestion.level === levelFilter);
    return matchesSearch && matchesLevel;
  });

  return (
    <aside className="w-80 border-r flex flex-col shrink-0 h-full bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 transition-colors select-none">
      {/* Top Title & Quick Add */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">관제 구역 목록</h2>
          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            <span>총 {totalZones}개 구역</span>
            <span className="mx-1.5 text-neutral-300 dark:text-neutral-600">·</span>
            <span>평균 혼잡도 <span className="font-mono tabular-nums font-semibold">{avgScore}%</span></span>
          </div>
        </div>

        {/* Add Zone Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>구역 추가</span>
          </button>

          {showAddMenu && (
            <div className="absolute right-0 top-9 w-40 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 p-1">
              <button
                type="button"
                onClick={() => {
                  onCreateZone('circle');
                  setShowAddMenu(false);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 rounded-md"
              >
                <CircleDot className="w-3.5 h-3.5 text-blue-500" />
                <span>원형 구역 생성</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onCreateZone('polygon');
                  setShowAddMenu(false);
                }}
                className="w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700/60 rounded-md"
              >
                <Hexagon className="w-3.5 h-3.5 text-emerald-500" />
                <span>다각형 구역 생성</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Level Breakdown Grid */}
      <div className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-800 grid grid-cols-4 gap-1.5 text-center">
        {([1, 2, 3, 4] as CongestionLevel[]).map((lvl) => {
          const info = CONGESTION_LEVEL_MAP[lvl];
          const count = levelCounts[lvl];
          const isSelected = levelFilter === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => setLevelFilter(isSelected ? 'all' : lvl)}
              className={`p-1.5 rounded-md border transition-all text-left flex flex-col ${
                isSelected
                  ? 'border-neutral-400 dark:border-neutral-500 bg-white dark:bg-neutral-800 shadow-xs'
                  : 'border-transparent hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60'
              }`}
            >
              <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
                <span>{info.name}</span>
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: info.color }}
                />
              </span>
              <span className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100 mt-0.5">
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
            placeholder="구역명 또는 ID 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        {levelFilter !== 'all' && (
          <button
            type="button"
            onClick={() => setLevelFilter('all')}
            className="px-2 py-1.5 text-[11px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 whitespace-nowrap"
          >
            초기화
          </button>
        )}
      </div>

      {/* Zones List View */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
        {filteredZones.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400">
            일치하는 관제 구역이 없습니다.
          </div>
        ) : (
          filteredZones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            const c = congestions[zone.id];
            const levelInfo = c ? CONGESTION_LEVEL_MAP[c.level] : CONGESTION_LEVEL_MAP[1];

            return (
              <div
                key={zone.id}
                onClick={() => {
                  onSelectZone(zone.id);
                  onFocusZoneOnMap(zone.id);
                }}
                className={`p-3 cursor-pointer transition-colors group relative flex items-start justify-between gap-2 ${
                  isSelected
                    ? 'bg-blue-50/80 dark:bg-blue-950/30'
                    : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                } ${!zone.visible ? 'opacity-50' : ''}`}
              >
                {/* Left zone indicator */}
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300">
                    {zone.type === 'circle' ? (
                      <CircleDot className="w-4 h-4 text-blue-500" />
                    ) : (
                      <Hexagon className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                        {zone.name}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 mt-0.5">
                      <span className="font-mono text-[10px]">{zone.id}</span>
                      <span>·</span>
                      <span>{zone.type === 'circle' ? `반경 ${zone.radius || 200}m` : `정점 ${zone.coordinates?.length || 0}개`}</span>
                    </div>
                  </div>
                </div>

                {/* Right Congestion Status & Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {c && (
                    <div className="text-right">
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

                  {/* Quick Zone Action Buttons */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      title={zone.visible ? '지도에서 숨기기' : '지도에 표시하기'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleZoneVisibility(zone.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                    >
                      {zone.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-neutral-400" />}
                    </button>

                    <button
                      type="button"
                      title="구역 복제"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateZone(zone.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      title="구역 삭제"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteZone(zone.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Summary Bar */}
      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/90 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
        <span>표시 중: {filteredZones.filter((z) => z.visible).length}개</span>
        <span>숨김: {filteredZones.filter((z) => !z.visible).length}개</span>
      </div>
    </aside>
  );
};
