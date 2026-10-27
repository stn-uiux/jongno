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
    <div className="ds-modal-backdrop">
      <div className="ds-modal-dialog ds-modal-dialog-lg" style={{ height: '75vh' }}>
        {/* Header */}
        <div className="ds-modal-header">
          <div className="ds-modal-title-row">
            <div className="ds-header-logo-box" style={{ width: 32, height: 32 }}>
              <FileJson style={{ width: 16, height: 16 }} />
            </div>
            <div>
              <h3 className="ds-modal-title">GeoJSON 데이터 관리</h3>
              <p className="text-xs text-muted">
                표준 GIS 호환 GeoJSON 규격으로 관제 구역 및 혼잡도 데이터를 내보내거나 가져옵니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ds-btn-icon"
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="ds-segmented-group" style={{ margin: '8px 16px 0 16px' }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setImportError(null);
            }}
            className={`ds-segmented-item flex-1 justify-center ${activeTab === 'export' ? 'active' : ''}`}
          >
            데이터 내보내기 (Export)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setImportError(null);
            }}
            className={`ds-segmented-item flex-1 justify-center ${activeTab === 'import' ? 'active' : ''}`}
          >
            데이터 가져오기 (Import)
          </button>
        </div>

        {/* Body */}
        <div className="ds-modal-body flex flex-col">
          {activeTab === 'export' ? (
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">
                  현재 등록된 관제 구역 ({zones.length}개)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="ds-btn ds-btn-secondary ds-btn-xs"
                  >
                    {copied ? (
                      <>
                        <Check style={{ width: 14, height: 14, color: '#10b981' }} />
                        <span style={{ color: '#10b981', fontWeight: 'bold' }}>복사 완료</span>
                      </>
                    ) : (
                      <>
                        <Copy style={{ width: 14, height: 14 }} />
                        <span>클립보드 복사</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    className="ds-btn ds-btn-primary ds-btn-xs"
                  >
                    <Download style={{ width: 14, height: 14 }} />
                    <span>.geojson 파일 다운로드</span>
                  </button>
                </div>
              </div>

              <textarea
                readOnly
                value={currentGeoJsonStr}
                className="flex-1 ds-input ds-input-mono"
                style={{ resize: 'none' }}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">
                  GeoJSON 파일 업로드 또는 코드 직접 붙여넣기
                </span>
                <label className="ds-btn ds-btn-secondary ds-btn-xs cursor-pointer">
                  <Upload style={{ width: 14, height: 14, color: '#3b82f6' }} />
                  <span>파일 선택</span>
                  <input
                    type="file"
                    accept=".json,.geojson"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {importError && (
                <div style={{
                  padding: 10,
                  backgroundColor: 'var(--ds-danger-subtle)',
                  border: '1px solid var(--ds-danger-border)',
                  borderRadius: 'var(--ds-radius-md)',
                  color: 'var(--ds-danger-text)',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccessMessage && (
                <div style={{
                  padding: 10,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 'var(--ds-radius-md)',
                  color: '#34d399',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <Check style={{ width: 16, height: 16, flexShrink: 0 }} />
                  <span>{importSuccessMessage}</span>
                </div>
              )}

              <textarea
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"type": "FeatureCollection", "features": [ ... ]} 형식의 GeoJSON 텍스트를 붙여넣으세요.'
                className="flex-1 ds-input ds-input-mono"
                style={{ resize: 'none' }}
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setImportJsonText('')}
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                >
                  지우기
                </button>
                <button
                  type="button"
                  onClick={handleExecuteImport}
                  className="ds-btn ds-btn-primary ds-btn-sm"
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
