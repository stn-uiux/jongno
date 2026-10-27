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
    <header className="ds-header">
      {/* Zone 1: Single element brand & location mark */}
      <div className="ds-header-brand">
        <div className="ds-header-logo-box">
          <Layers style={{ width: 18, height: 18 }} />
        </div>
        <div className="ds-header-titles">
          <div className="ds-header-title-row">
            <span className="ds-header-title">종로구 혼잡도 관제 시스템</span>
            <span className="ds-header-dot">·</span>
            <span className="ds-header-location">서울특별시 종로구</span>
          </div>
          <div className="ds-header-meta">
            <span>최종 갱신: <time className="font-mono tabular-nums">{lastUpdated}</time></span>
            <span>·</span>
            <span>오픈프리맵 로컬 내장 (오프라인/폐쇄망 지원)</span>
          </div>
        </div>
      </div>

      {/* Zone 2: Controls & View/Edit Switch */}
      <div className="ds-header-center-controls">
        {/* Mode Selector Segmented Control */}
        <div className="ds-segmented-group">
          <button
            type="button"
            onClick={() => setMode('view')}
            className={`ds-segmented-item ${mode === 'view' ? 'active' : ''}`}
          >
            <Eye style={{ width: 14, height: 14 }} />
            <span>관제 모드</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`ds-segmented-item ${mode === 'edit' ? 'active-amber' : ''}`}
          >
            <Edit3 style={{ width: 14, height: 14 }} />
            <span>구역 편집</span>
          </button>
        </div>

        {/* Live Simulation Toggles */}
        <div className="ds-segmented-group">
          <button
            type="button"
            onClick={() => setIsSimulating(!isSimulating)}
            title={isSimulating ? '실시간 혼잡도 시뮬레이션 일시정지' : '실시간 혼잡도 시뮬레이션 시작'}
            className={`ds-segmented-item ${isSimulating ? 'active-emerald' : ''}`}
          >
            {isSimulating ? <Pause style={{ width: 14, height: 14 }} /> : <Play style={{ width: 14, height: 14 }} />}
            <span>{isSimulating ? '시뮬레이션 가동 중' : '시뮬레이션 정지'}</span>
          </button>

          <button
            type="button"
            onClick={onRefreshCongestion}
            title="즉시 혼잡도 데이터 재측정 시뮬레이션"
            className="ds-btn-icon"
          >
            <RefreshCw style={{ width: 14, height: 14 }} />
          </button>
        </div>

        {/* GeoJSON & Server Tools */}
        <button
          type="button"
          onClick={onOpenGeoJson}
          className="ds-btn ds-btn-secondary ds-btn-sm"
        >
          <FileJson style={{ width: 14, height: 14, color: '#3b82f6' }} />
          <span>GeoJSON 입출력</span>
        </button>
      </div>

      {/* Zone 3: Air-Gap Guide & Dark/Light Switch */}
      <div className="ds-header-right-tools">
        <button
          type="button"
          onClick={onOpenGuide}
          className="ds-btn ds-btn-primary ds-btn-sm"
        >
          <Layers style={{ width: 16, height: 16 }} />
          <span>시스템 & 백엔드 개발 가이드</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'}
          className="ds-btn-icon bordered"
        >
          {isDarkMode ? <Sun style={{ width: 16, height: 16, color: '#fbbf24' }} /> : <Moon style={{ width: 16, height: 16 }} />}
        </button>
      </div>
    </header>
  );
};
