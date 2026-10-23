import React from 'react';
import {
  Layers,
  ShieldAlert,
  Play,
  Pause,
  RefreshCw,
  Sun,
  Moon,
  FileJson,
  Edit3,
  Eye,
} from 'lucide-react';
import { AppMode } from '../types';

interface HeaderProps {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  isSimulating: boolean;
  setIsSimulating: (sim: boolean) => void;
  onRefreshCongestion: () => void;
  lastUpdated: string;
  onOpenGuide: () => void;
  onOpenGeoJson: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  setMode,
  isDarkMode,
  setIsDarkMode,
  isSimulating,
  setIsSimulating,
  onRefreshCongestion,
  lastUpdated,
  onOpenGuide,
  onOpenGeoJson,
}) => {
  return (
    <header className="h-16 px-5 border-b flex items-center justify-between gap-6 shrink-0 transition-colors bg-white border-neutral-200 dark:bg-neutral-900 dark:border-neutral-800">
      {/* Zone 1: Single element brand & location mark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
          <Layers className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
              종로구 혼잡도 관제 시스템
            </span>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">·</span>
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
              서울특별시 종로구
            </span>
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
            <span>최종 갱신: <time className="font-mono tabular-nums">{lastUpdated}</time></span>
            <span>·</span>
            <span>오픈프리맵 로컬 내장 (오프라인/폐쇄망 지원)</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Controls & View/Edit Switch */}
      <div className="flex items-center gap-3">
        {/* Mode Selector Segmented Control */}
        <div className="flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
          <button
            type="button"
            onClick={() => setMode('view')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              mode === 'view'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>관제 모드</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              mode === 'edit'
                ? 'bg-amber-600 text-white shadow-xs font-semibold'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>구역 편집</span>
          </button>
        </div>

        {/* Live Simulation Toggles */}
        <div className="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg border border-neutral-200 dark:border-neutral-700/50">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            title={isSimulating ? '실시간 혼잡도 시뮬레이션 일시정지' : '실시간 혼잡도 시뮬레이션 시작'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
              isSimulating
                ? 'bg-emerald-600 text-white'
                : 'bg-transparent text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700'
            }`}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? '시뮬레이션 가동 중' : '시뮬레이션 정지'}</span>
          </button>

          <button
            type="button"
            onClick={onRefreshCongestion}
            title="즉시 혼잡도 데이터 재측정 시뮬레이션"
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-md transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* GeoJSON & Server Tools */}
        <button
          type="button"
          onClick={onOpenGeoJson}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
        >
          <FileJson className="w-3.5 h-3.5 text-blue-500" />
          <span>GeoJSON 입출력</span>
        </button>
      </div>

      {/* Zone 3: Air-Gap Guide & Dark/Light Switch */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenGuide}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-xs cursor-pointer"
        >
          <Layers className="w-4 h-4" />
          <span>시스템 & 백엔드 개발 가이드</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 rounded-lg transition-colors cursor-pointer"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
        </button>
      </div>
    </header>
  );
};
