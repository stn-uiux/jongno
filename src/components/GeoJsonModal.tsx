import React, { useState } from 'react';
import {
  X,
  FileJson,
  Download,
  Upload,
  Copy,
  Check,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { ZoneData, CongestionData } from '../types';
import { exportToGeoJson, importFromGeoJson } from '../utils/geoUtils';

interface GeoJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: ZoneData[];
  congestions: Record<string, CongestionData>;
  onImport: (newZones: ZoneData[], newCongestions: Record<string, CongestionData>) => void;
}

export const GeoJsonModal: React.FC<GeoJsonModalProps> = ({
  isOpen,
  onClose,
  zones,
  congestions,
  onImport,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importJsonText, setImportJsonText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentGeoJsonStr = exportToGeoJson(zones, congestions);

  const handleCopy = () => {
    navigator.clipboard.writeText(currentGeoJsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentGeoJsonStr], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jongno_congestion_zones_${new Date().toISOString().slice(0, 10)}.geojson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setImportJsonText(text);
      setImportError(null);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = () => {
    if (!importJsonText.trim()) {
      setImportError('가져올 GeoJSON 텍스트를 입력하거나 파일을 업로드해 주세요.');
      return;
    }

    const result = importFromGeoJson(importJsonText);
    if (result.error || result.zones.length === 0) {
      setImportError(result.error || '유효한 구역(Feature)을 찾을 수 없습니다.');
      setImportSuccessMessage(null);
      return;
    }

    onImport(result.zones, result.congestions);
    setImportSuccessMessage(`총 ${result.zones.length}개의 관제 구역을 성공적으로 반영했습니다.`);
    setImportError(null);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl h-[75vh] flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FileJson className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">GeoJSON 데이터 관리</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                표준 GIS 호환 GeoJSON 규격으로 관제 구역 및 혼잡도 데이터를 내보내거나 가져옵니다.
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

        {/* Tab switch */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setImportError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 text-center transition-colors ${
              activeTab === 'export'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
            }`}
          >
            데이터 내보내기 (Export)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setImportError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 text-center transition-colors ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
            }`}
          >
            데이터 가져오기 (Import)
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {activeTab === 'export' ? (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">
                  현재 등록된 관제 구역 ({zones.length}개)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md text-xs font-medium transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-500 font-semibold">복사 완료</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>클립보드 복사</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>.geojson 파일 다운로드</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={currentGeoJsonStr}
                className="flex-1 w-full p-3 font-mono text-xs bg-neutral-950 text-neutral-100 rounded-lg border border-neutral-800 resize-none focus:outline-none"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-600 dark:text-neutral-400">
                  GeoJSON 파일 업로드 또는 코드 직접 붙여넣기
                </span>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md text-xs font-medium cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5 text-blue-500" />
                  <span>파일 선택</span>
                  <input
                    type="file"
                    accept=".json,.geojson"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {importError && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{importSuccessMessage}</span>
                </div>
              )}

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"type": "FeatureCollection", "features": [ ... ]} 형식의 GeoJSON 텍스트를 붙여넣으세요.'
                className="flex-1 w-full p-3 font-mono text-xs bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 rounded-lg border border-neutral-200 dark:border-neutral-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportJsonText('')}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                >
                  지우기
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                >
                  관제 시스템에 반영하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
