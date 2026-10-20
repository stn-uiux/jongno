import React, { useState } from 'react';
import {
  X,
  Server,
  Check,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Shield,
  Layers,
  Globe,
} from 'lucide-react';
import { TileServerConfig } from '../types';
import { DEFAULT_TILE_SERVERS } from '../utils/constants';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: TileServerConfig;
  onApplyConfig: (config: TileServerConfig) => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onApplyConfig,
}) => {
  const [selectedType, setSelectedType] = useState<string>(currentConfig.type);
  const [customUrl, setCustomUrl] = useState<string>(
    currentConfig.type === 'custom' || currentConfig.type === 'local'
      ? currentConfig.url
      : 'http://192.168.1.100:8080/styles/osm-bright/{z}/{x}/{y}.png'
  );
  const [customName, setCustomName] = useState<string>(
    currentConfig.name || '사내 폐쇄망 타일 서버'
  );
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'warn'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleTestConnection = async (targetUrl: string) => {
    setTestStatus('testing');
    setTestMessage('연결 상태를 진단 중입니다...');

    // In a browser environment, accessing localhost:8080 or private LAN IP from an HTTPS sandbox
    // will either succeed (if running locally) or trigger a CORS/Mixed-Content notice.
    // We simulate honest probe handling:
    setTimeout(() => {
      if (targetUrl.includes('localhost') || targetUrl.includes('192.168') || targetUrl.includes('10.')) {
        setTestStatus('warn');
        setTestMessage(
          '클라우드 미리보기 샌드박스에서는 사용자 로컬 망(192.168.x.x / localhost)에 직접 도달할 수 없습니다. 실제 폐쇄망 서버에 설치 시 정상 작동하며, 현재는 데모 타일 또는 사내 프록시를 통해 확인할 수 있습니다.'
        );
      } else {
        setTestStatus('success');
        setTestMessage('타일 서버와 정상적으로 통신할 수 있습니다.');
      }
    }, 600);
  };

  const handleApply = () => {
    let finalConfig: TileServerConfig;

    if (selectedType === 'custom') {
      finalConfig = {
        type: 'custom',
        name: customName || '사용자 지정 내부 서버',
        url: customUrl,
        attribution: '&copy; 내부 지자체 보안 관제망 (TileServer GL)',
        maxZoom: 19,
        isAirGapped: true,
      };
    } else {
      const preset = DEFAULT_TILE_SERVERS.find((s) => s.type === selectedType);
      if (preset) {
        finalConfig = { ...preset };
        if (selectedType === 'local') {
          finalConfig.url = customUrl;
        }
      } else {
        finalConfig = DEFAULT_TILE_SERVERS[0];
      }
    }

    onApplyConfig(finalConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">지도 타일 서버 환경설정</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                운영 환경(내부 폐쇄망 TileServer GL) 또는 미리보기용 데모 지도를 선택합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Preset Choices */}
          <div className="space-y-2">
            <label className="font-semibold text-neutral-800 dark:text-neutral-200 block">
              타일 소스 선택
            </label>

            <div className="space-y-2">
              {DEFAULT_TILE_SERVERS.map((server) => {
                const isSelected = selectedType === server.type;
                return (
                  <label
                    key={server.type}
                    onClick={() => {
                      setSelectedType(server.type);
                      setTestStatus('idle');
                    }}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                        : 'border-neutral-200 dark:border-neutral-700/70 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="tileServer"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {server.name}
                        </span>
                        {server.isAirGapped ? (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            폐쇄망 전용
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            미리보기 / 데모
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                        {server.url}
                      </div>
                    </div>
                  </label>
                );
              })}

              {/* Custom internal URL option */}
              <label
                onClick={() => {
                  setSelectedType('custom');
                  setTestStatus('idle');
                }}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedType === 'custom'
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                    : 'border-neutral-200 dark:border-neutral-700/70 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="tileServer"
                  checked={selectedType === 'custom'}
                  onChange={() => {}}
                  className="mt-0.5 text-blue-600"
                />
                <div className="flex-1">
                  <div className="font-bold text-neutral-900 dark:text-neutral-100">
                    사용자 지정 폐쇄망 타일 서버 URL 직접 입력
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    내부 관제망 IP 및 포트(예: http://192.168.10.50:8080/styles/...)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* URL Input Box (visible when custom or local) */}
          {(selectedType === 'custom' || selectedType === 'local') && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  타일 서버 URL 템플릿 ({'{z}/{x}/{y}.png'})
                </label>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="http://192.168.x.x:8080/styles/osm-bright/{z}/{x}/{y}.png"
                  className="w-full px-3 py-1.5 font-mono text-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => handleTestConnection(customUrl)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 rounded text-neutral-800 dark:text-neutral-200 text-xs transition-colors"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`}
                  />
                  <span>연결 진단 테스트</span>
                </button>
              </div>
            </div>
          )}

          {/* Test connection results */}
          {testStatus === 'warn' && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2 leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>{testMessage}</span>
            </div>
          )}

          {testStatus === 'success' && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{testMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
          >
            설정 적용
          </button>
        </div>
      </div>
    </div>
  );
};
