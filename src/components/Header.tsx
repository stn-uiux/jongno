import React from 'react';
import {
  ShieldAlert,
  Play,
  Pause,
  RefreshCw,
  Sun,
  Moon,
  FileJson,
  Server,
  Layers,
  Edit3,
  Eye,
  Sliders,
  Palette,
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
  onOpenServerConfig: () => void;
  onOpenGeoJson: () => void;
  onOpenConcept: () => void;
  currentConceptName: string;
  isAirGappedActive: boolean;
  tileServerName: string;
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
  onOpenServerConfig,
  onOpenGeoJson,
  onOpenConcept,
  currentConceptName,
  isAirGappedActive,
  tileServerName,
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
            <span className="truncate max-w-[170px]" title={tileServerName}>
              {isAirGappedActive ? '폐쇄망 타일' : tileServerName}
            </span>
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
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              mode === 'view'
                ? 'bg-white dark:bg-neutral-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>관제 모드</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              mode === 'edit'
                ? 'bg-white dark:bg-neutral-900 text-amber-600 dark:text-amber-400 shadow-xs font-semibold'
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
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
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
            className="p-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* GeoJSON & Server Tools */}
        <button
          type="button"
          onClick={onOpenGeoJson}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 rounded-lg transition-colors whitespace-nowrap"
        >
          <FileJson className="w-3.5 h-3.5 text-blue-500" />
          <span>GeoJSON 입출력</span>
        </button>

        <button
          type="button"
          onClick={onOpenServerConfig}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700/60 rounded-lg transition-colors whitespace-nowrap"
        >
          <Server className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
          <span>타일 서버 설정</span>
        </button>

        <button
          type="button"
          onClick={onOpenConcept}
          title="지도 테마, 색조 회전, 밝기, 대비 등 그래픽 컨셉 실시간 수정"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/80 rounded-lg transition-colors whitespace-nowrap"
        >
          <Palette className="w-3.5 h-3.5 text-indigo-500" />
          <span>지도 컨셉 ({currentConceptName})</span>
        </button>
      </div>

      {/* Zone 3: Air-Gap Guide & Dark/Light Switch */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onOpenGuide}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors whitespace-nowrap shadow-xs"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>폐쇄망 구축 가이드</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/60 rounded-lg transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
        </button>
      </div>
    </header>
  );
};
