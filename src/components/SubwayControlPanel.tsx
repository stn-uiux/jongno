import React from 'react';
import { X, Train, Check, Tag, ShieldCheck } from 'lucide-react';
import { SubwayConfig } from '../types';

interface SubwayControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: SubwayConfig;
  onChangeConfig: (newConfig: SubwayConfig) => void;
}

const LINE_ITEMS = [
  { id: '1호선', name: '1호선', fullName: '수도권 1호선', color: '#303B94', keyStations: '종각, 종로3가, 종로5가, 동대문, 동묘앞' },
  { id: '2호선', name: '2호선', fullName: '서울 2호선', color: '#4AB34B', keyStations: '시청, 을지로입구, 을지로3가, DDP, 신설동' },
  { id: '3호선', name: '3호선', fullName: '수도권 3호선', color: '#EE7B3F', keyStations: '경복궁, 안국, 종로3가, 독립문' },
  { id: '4호선', name: '4호선', fullName: '수도권 4호선', color: '#499CDC', keyStations: '혜화, 동대문, DDP, 한성대입구' },
  { id: '5호선', name: '5호선', fullName: '수도권 5호선', color: '#843ED9', keyStations: '광화문, 종로3가, 서대문, 을지로4가' },
  { id: '6호선', name: '6호선', fullName: '서울 6호선', color: '#AE541A', keyStations: '동묘앞, 창신, 신당, 청구' },
  { id: '우이신설선', name: '우이신설', fullName: '우이신설선', color: '#BABA46', keyStations: '신설동, 보문, 성신여대입구' },
];

export const SubwayControlPanel: React.FC<SubwayControlPanelProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
}) => {
  if (!isOpen) return null;

  const handleToggleLine = (lineId: string) => {
    const nextVisible = {
      ...config.visibleLines,
      [lineId]: !config.visibleLines[lineId],
    };
    onChangeConfig({ ...config, visibleLines: nextVisible });
  };

  const handleSelectAllLines = (enabled: boolean) => {
    const nextVisible: Record<string, boolean> = {};
    LINE_ITEMS.forEach((item) => {
      nextVisible[item.id] = enabled;
    });
    onChangeConfig({ ...config, visibleLines: nextVisible });
  };

  const handleSelectJongnoCore = () => {
    const nextVisible: Record<string, boolean> = {
      '1호선': true,
      '2호선': false,
      '3호선': true,
      '4호선': true,
      '5호선': true,
      '6호선': false,
      '우이신설선': false,
    };
    onChangeConfig({ ...config, visibleLines: nextVisible });
  };

  return (
    <div className="ds-subway-panel">
      {/* Header */}
      <div className="ds-subway-header">
        <div className="flex items-center gap-2-5">
          <div className="ds-header-logo-box" style={{ width: 28, height: 28 }}>
            <Train style={{ width: 15, height: 15 }} />
          </div>
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--ds-text-primary)' }}>지하철 노선 & 역 레이어</h3>
            <p style={{ fontSize: 10, color: 'var(--ds-text-muted)' }}>실제 OSM 공간정보 (ODbL) 기반</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ds-btn-icon"
          title="닫기"
        >
          <X style={{ width: 15, height: 15 }} />
        </button>
      </div>

      <div className="ds-subway-body">
        {/* Global Master Toggles */}
        <div className="ds-subway-toggles">
          <div
            className="ds-subway-toggle-row"
            onClick={() => onChangeConfig({ ...config, showLines: !config.showLines })}
          >
            <div className="ds-subway-toggle-left">
              <div className="ds-subway-toggle-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                <Train style={{ width: 14, height: 14 }} />
              </div>
              <span>지하철 선로 궤적 표시</span>
            </div>
            <div className={`ds-switch ${config.showLines ? 'active' : ''}`}>
              <div className="ds-switch-knob" />
            </div>
          </div>

          <div
            className="ds-subway-toggle-row"
            onClick={() => onChangeConfig({ ...config, showStations: !config.showStations })}
          >
            <div className="ds-subway-toggle-left">
              <div className="ds-subway-toggle-icon" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#f97316' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', border: '2px solid #f97316', backgroundColor: '#ffffff', display: 'inline-block' }} />
              </div>
              <span>지하철역 마커 표시</span>
            </div>
            <div className={`ds-switch ${config.showStations ? 'active' : ''}`}>
              <div className="ds-switch-knob" />
            </div>
          </div>

          <div
            className="ds-subway-toggle-row"
            onClick={() => onChangeConfig({ ...config, showStationLabels: !config.showStationLabels })}
          >
            <div className="ds-subway-toggle-left">
              <div className="ds-subway-toggle-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Tag style={{ width: 14, height: 14 }} />
              </div>
              <span>역명 한글 텍스트 표시</span>
            </div>
            <div className={`ds-switch ${config.showStationLabels ? 'active' : ''}`}>
              <div className="ds-switch-knob" />
            </div>
          </div>
        </div>

        {/* Quick Filter Buttons */}
        <div className="ds-subway-filter-bar">
          <button
            type="button"
            onClick={() => handleSelectAllLines(true)}
            className="ds-subway-filter-btn"
          >
            전체 노선
          </button>
          <button
            type="button"
            onClick={handleSelectJongnoCore}
            className="ds-subway-filter-btn primary"
          >
            종로 핵심 (1·3·4·5)
          </button>
          <button
            type="button"
            onClick={() => handleSelectAllLines(false)}
            className="ds-subway-filter-btn"
          >
            전체 해제
          </button>
        </div>

        {/* Individual Line Toggles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="ds-subway-section-label">
            <span>호선별 표시 선택</span>
            <span style={{ fontSize: 10, color: 'var(--ds-text-muted)' }}>클릭하여 켜기/끄기</span>
          </div>

          <div className="ds-subway-lines-list">
            {LINE_ITEMS.map((item) => {
              const isChecked = config.visibleLines[item.id] !== false;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleLine(item.id)}
                  className={`ds-subway-line-card ${isChecked ? '' : 'inactive'}`}
                >
                  <div className="ds-subway-line-content">
                    <span
                      className="ds-subway-badge"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.name}
                    </span>
                    <div className="ds-subway-line-meta">
                      <span className="ds-subway-line-title">
                        {item.fullName}
                      </span>
                      <span className="ds-subway-line-subtitle">
                        {item.keyStations}
                      </span>
                    </div>
                  </div>

                  <div
                    className="ds-subway-check-circle"
                    style={{
                      backgroundColor: isChecked ? item.color : 'transparent',
                      border: isChecked ? 'none' : '1.5px solid var(--ds-border-default)',
                    }}
                  >
                    {isChecked && <Check style={{ width: 12, height: 12, strokeWidth: 3 }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Airgap & Data License Notice */}
        <div className="ds-subway-notice-box">
          <div className="ds-subway-notice-title">
            <ShieldCheck style={{ width: 14, height: 14, flexShrink: 0 }} />
            <span>100% 폐쇄망 로컬 데이터 탑재</span>
          </div>
          <p className="ds-subway-notice-body">
            실제 선로 궤적 및 역 중심 좌표가 내부 GeoJSON(public/geojson/)에 사전 저장되어 있어 외부 인터넷 연결 없이 즉시 작동합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
