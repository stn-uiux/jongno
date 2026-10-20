import React, { useState } from 'react';
import {
  X,
  Palette,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Sun,
  Moon,
  Contrast,
  Droplet,
  Layers,
  Eye,
} from 'lucide-react';
import { MapConceptConfig, MapConceptPresetId } from '../types';
import { MAP_CONCEPT_PRESETS, DEFAULT_MAP_CONCEPT } from '../utils/constants';

interface MapConceptModalProps {
  isOpen: boolean;
  onClose: () => void;
  concept: MapConceptConfig;
  onApplyConcept: (concept: MapConceptConfig) => void;
}

export const MapConceptModal: React.FC<MapConceptModalProps> = ({
  isOpen,
  onClose,
  concept,
  onApplyConcept,
}) => {
  const [draft, setDraft] = useState<MapConceptConfig>(concept);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: MapConceptConfig) => {
    const updated = { ...preset };
    setDraft(updated);
    onApplyConcept(updated); // Real-time preview on map!
  };

  const handleFieldChange = (updates: Partial<MapConceptConfig>) => {
    const updated = { ...draft, presetId: 'custom' as MapConceptPresetId, ...updates };
    setDraft(updated);
    onApplyConcept(updated); // Instant live reflection
  };

  const handleReset = () => {
    setDraft(DEFAULT_MAP_CONCEPT);
    onApplyConcept(DEFAULT_MAP_CONCEPT);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl h-[82vh] flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold">지도 컨셉 및 시각화 스타일링 스튜디오</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                관제실 조명 환경, 스크린 해상도, 시각적 기호에 맞춰 지도 테마와 그래픽 필터를 실시간 조정합니다.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Section 1: Concept Preset Cards */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>테마 컨셉 프리셋 선택</span>
              </span>
              <span className="text-[11px] text-neutral-400">클릭 즉시 실시간 반영</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {MAP_CONCEPT_PRESETS.map((preset) => {
                const isSelected = draft.presetId === preset.presetId;
                return (
                  <button
                    key={preset.presetId}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-500 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-700/70 hover:bg-neutral-50 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div>
                      {/* Color Preview bar */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-600"
                          style={{ backgroundColor: preset.bgColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full"
                          style={{ backgroundColor: preset.boundaryColor }}
                        />
                        <span className="text-[10px] text-neutral-400 font-mono ml-auto">
                          {preset.invert ? '다크' : '라이트'}
                        </span>
                      </div>

                      <div className="font-bold text-neutral-900 dark:text-neutral-100 text-xs truncate">
                        {preset.name}
                      </div>
                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-1 leading-snug">
                        {preset.description}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="mt-2 pt-1.5 border-t border-indigo-200 dark:border-indigo-800 flex items-center justify-end text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold gap-1">
                        <Check className="w-3 h-3" />
                        <span>적용 중</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Precise Graphic Filter Tuning */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-500" />
                <span>그래픽 렌더링 필터 정밀 미세조정</span>
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                {draft.presetId === 'custom' ? '커스텀 조정 모드' : `${draft.name} 기반`}
              </span>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700/60 space-y-4">
              {/* Invert toggle & Background color */}
              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-700/60">
                <div>
                  <label className="block text-[11px] text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">
                    색상 명암 반전 (Invert Mode)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange({ invert: !draft.invert })}
                      className={`flex-1 py-1.5 px-3 rounded-md border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                        draft.invert
                          ? 'bg-neutral-900 text-white border-neutral-700'
                          : 'bg-white text-neutral-900 border-neutral-300'
                      }`}
                    >
                      {draft.invert ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{draft.invert ? '다크 모드 반전 활성' : '표준 라이트 모드'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-neutral-600 dark:text-neutral-400 mb-1.5 font-medium">
                    배경 캔버스 색상 (Canvas Color)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={draft.bgColor}
                      onChange={(e) => handleFieldChange({ bgColor: e.target.value })}
                      className="w-8 h-8 rounded border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={draft.bgColor}
                      onChange={(e) => handleFieldChange({ bgColor: e.target.value })}
                      className="flex-1 px-2.5 py-1 text-xs font-mono uppercase bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Sliders: Brightness, Contrast, Saturation, Hue */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                {/* Brightness */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400">밝기 (Brightness)</span>
                    <span className="font-mono text-xs font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                      {draft.brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="150"
                    step="5"
                    value={draft.brightness}
                    onChange={(e) => handleFieldChange({ brightness: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Contrast */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400">대비 (Contrast)</span>
                    <span className="font-mono text-xs font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                      {draft.contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="200"
                    step="5"
                    value={draft.contrast}
                    onChange={(e) => handleFieldChange({ contrast: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400">
                      채도 (Saturation) {draft.saturate === 0 && <span className="text-emerald-500 font-bold ml-1">· 완전 흑백</span>}
                    </span>
                    <span className="font-mono text-xs font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                      {draft.saturate}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="5"
                    value={draft.saturate}
                    onChange={(e) => handleFieldChange({ saturate: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Hue Rotate */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-neutral-600 dark:text-neutral-400">색조 회전 (Hue Rotate)</span>
                    <span className="font-mono text-xs font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                      {draft.hueRotate}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={draft.hueRotate}
                    onChange={(e) => handleFieldChange({ hueRotate: parseInt(e.target.value, 10) })}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Boundary & Overlay Style */}
          <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>행정구역 경계선 및 관제 구역 오버레이 스타일</span>
            </span>

            <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
              <div>
                <label className="block text-[11px] text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  종로구 경계선 색상 (Boundary Color)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={draft.boundaryColor}
                    onChange={(e) => handleFieldChange({ boundaryColor: e.target.value })}
                    className="w-8 h-8 rounded border border-neutral-300 dark:border-neutral-700 cursor-pointer p-0"
                  />
                  <input
                    type="text"
                    value={draft.boundaryColor}
                    onChange={(e) => handleFieldChange({ boundaryColor: e.target.value })}
                    className="flex-1 px-2.5 py-1 text-xs font-mono uppercase bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  경계선 선 형태 (Line Style)
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: '점선', val: '4, 6' },
                    { label: '실선', val: '' },
                    { label: '대시', val: '8, 4' },
                  ].map((st) => (
                    <button
                      key={st.label}
                      type="button"
                      onClick={() => handleFieldChange({ boundaryDashArray: st.val })}
                      className={`py-1 text-xs rounded border transition-colors ${
                        draft.boundaryDashArray === st.val
                          ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                          : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-neutral-600 dark:text-neutral-400">구역 기본 채우기 투명도</span>
                  <span className="font-mono text-xs font-bold tabular-nums text-neutral-800 dark:text-neutral-200">
                    {Math.round(draft.zoneDefaultOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.15"
                  max="0.65"
                  step="0.05"
                  value={draft.zoneDefaultOpacity}
                  onChange={(e) => handleFieldChange({ zoneDefaultOpacity: parseFloat(e.target.value) })}
                  className="w-full accent-blue-600"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-600 dark:text-neutral-400 mb-1 font-medium">
                  네온 글로우 / 펄스 이펙트
                </label>
                <button
                  type="button"
                  onClick={() => handleFieldChange({ zoneGlow: !draft.zoneGlow })}
                  className={`w-full py-1.5 px-3 rounded-md border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    draft.zoneGlow
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                      : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{draft.zoneGlow ? '네온 강조 활성화됨' : '일반 평면 렌더링'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>기본 컨셉으로 복원</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-xs transition-colors"
          >
            설정 완료
          </button>
        </div>
      </div>
    </div>
  );
};
