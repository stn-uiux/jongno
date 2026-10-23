import React from 'react';
import { X, Train, Check, Eye, EyeOff, Tag, ShieldCheck } from 'lucide-react';
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
    <div className="absolute top-16 right-16 z-30 w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100 animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="p-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/80">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Train className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-tight">지하철 노선 & 역 레이어</h3>
            <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
              실제 OSM 공간정보 (ODbL) 기반
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3.5 space-y-3.5 max-h-[75vh] overflow-y-auto">
        {/* Global Master Toggles */}
        <div className="space-y-1.5 pb-3 border-b border-neutral-200 dark:border-neutral-800 text-xs">
          <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <span className="font-semibold flex items-center gap-1.5">
              <Train className="w-3.5 h-3.5 text-blue-500" />
              지하철 선로 궤적 표시
            </span>
            <input
              type="checkbox"
              checked={config.showLines}
              onChange={(e) => onChangeConfig({ ...config, showLines: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <span className="font-semibold flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full border-2 border-orange-500 bg-white inline-block"></span>
              지하철역 마커 표시
            </span>
            <input
              type="checkbox"
              checked={config.showStations}
              onChange={(e) => onChangeConfig({ ...config, showStations: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-neutral-100/70 dark:bg-neutral-800/50 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
            <span className="font-semibold flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-purple-500" />
              역명 한글 텍스트 표시
            </span>
            <input
              type="checkbox"
              checked={config.showStationLabels}
              onChange={(e) => onChangeConfig({ ...config, showStationLabels: e.target.checked })}
              className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleSelectAllLines(true)}
            className="flex-1 py-1 px-2 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors text-neutral-700 dark:text-neutral-300"
          >
            전체 노선
          </button>
          <button
            type="button"
            onClick={handleSelectJongnoCore}
            className="flex-1 py-1 px-2 text-[10px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
          >
            종로 핵심(1·3·4·5)
          </button>
          <button
            type="button"
            onClick={() => handleSelectAllLines(false)}
            className="py-1 px-2 text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors text-neutral-500"
          >
            전체 해제
          </button>
        </div>

        {/* Individual Line Toggles */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 flex items-center justify-between">
            <span>호선별 표시 선택</span>
            <span className="text-[10px]">클릭하여 켜기/끄기</span>
          </div>

          <div className="space-y-1">
            {LINE_ITEMS.map((item) => {
              const isChecked = config.visibleLines[item.id] !== false;
              return (
                <div
                  key={item.id}
                  onClick={() => handleToggleLine(item.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                    isChecked
                      ? 'border-neutral-200 dark:border-neutral-700/80 bg-neutral-50/50 dark:bg-neutral-800/30'
                      : 'border-transparent opacity-45 hover:opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                    >
                      {item.name}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-[11px] truncate">
                        {item.fullName}
                      </span>
                      <span className="text-[10px] text-neutral-400 dark:text-neutral-500 truncate">
                        {item.keyStations}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isChecked ? (
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                        style={{ backgroundColor: item.color }}
                      >
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-neutral-400 dark:border-neutral-600"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Airgap & Data License Notice */}
        <div className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-[10px] text-neutral-600 dark:text-neutral-400 space-y-1">
          <div className="flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>100% 폐쇄망 로컬 데이터 탑재</span>
          </div>
          <p className="leading-relaxed">
            실제 선로 궤적 및 역 중심 좌표가 내부 GeoJSON(public/geojson/)에 사전 저장되어 있어 외부 인터넷 연결 없이 즉시 작동합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
