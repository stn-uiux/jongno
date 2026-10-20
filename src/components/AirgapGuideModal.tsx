import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Server,
  HardDrive,
  Copy,
  Check,
  Terminal,
  FileCode,
  BookOpen,
  Info,
  ExternalLink,
} from 'lucide-react';
import {
  AIRGAP_GUIDE_SECTIONS,
  STORAGE_ESTIMATES,
  SERVER_HARDWARE_SPECS,
  GuideSection,
} from '../data/airgapGuideData';

interface AirgapGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AirgapGuideModal: React.FC<AirgapGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'storage' | 'license'>('guide');
  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    AIRGAP_GUIDE_SECTIONS[0].id
  );
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentSection =
    AIRGAP_GUIDE_SECTIONS.find((s) => s.id === selectedSectionId) ||
    AIRGAP_GUIDE_SECTIONS[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl w-full max-w-5xl h-[86vh] flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                폐쇄망(망분리) 지도 타일 서버 구축 및 운영 가이드
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                인터넷이 차단된 종로구 관제 환경을 위한 OSM 데이터 추출, MBTiles 변환, TileServer GL 완벽 패키징 가이드
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-4 bg-neutral-50 dark:bg-neutral-900/60 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>구축 단계별 상세 가이드 (1~10단계)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('storage')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'storage'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            <span>예상 서버 사양 & 저장 용량</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('license')}
            className={`py-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'license'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:text-neutral-400'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>오픈소스 및 라이선스 정보</span>
          </button>
        </div>

        {/* Tab 1: Detailed Step-by-Step Guide */}
        {activeTab === 'guide' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Steps List */}
            <div className="w-72 border-r border-neutral-200 dark:border-neutral-800 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 shrink-0 bg-neutral-50/50 dark:bg-neutral-900/40">
              {AIRGAP_GUIDE_SECTIONS.map((sec, idx) => {
                const isSelected = sec.id === selectedSectionId;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setSelectedSectionId(sec.id)}
                    className={`w-full p-3 text-left transition-colors flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'hover:bg-neutral-100/60 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-[10px] flex items-center justify-center shrink-0 font-mono">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs truncate">{sec.title.replace(/^\d+\.\s*/, '')}</div>
                      <div className="text-[10px] text-neutral-400 truncate mt-0.5">{sec.summary}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Guide Content View */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
                  {currentSection.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  {currentSection.summary}
                </p>
              </div>

              {/* Explanatory text */}
              <div className="prose prose-xs dark:prose-invert max-w-none text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700/60">
                {currentSection.content}
              </div>

              {/* Copyable code block */}
              {currentSection.codeSnippet && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-blue-500" />
                      <span>{currentSection.codeSnippet.description}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          currentSection.id,
                          currentSection.codeSnippet?.code || ''
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded transition-colors"
                    >
                      {copiedCodeId === currentSection.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-500 font-semibold">복사 완료</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>명령어 복사</span>
                        </>
                      )}
                    </button>
                  </div>

                  <pre className="p-4 bg-neutral-950 text-neutral-100 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed border border-neutral-800">
                    <code>{currentSection.codeSnippet.code}</code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Storage Sizing & Hardware Specs */}
        {activeTab === 'storage' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* Storage Sizing Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-blue-500" />
                  <span>종로구 관제 기준 지도 데이터 및 서버 용량 산정표</span>
                </h3>
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  ※ 실제 측정치가 아닌 공학적 추정치(Estimate)임을 명시합니다.
                </span>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold">
                      <th className="py-2.5 px-4">구분</th>
                      <th className="py-2.5 px-4">항목명</th>
                      <th className="py-2.5 px-4 text-right">종로구 단일 지역 (추정)</th>
                      <th className="py-2.5 px-4 text-right">서울시 전체 (참고)</th>
                      <th className="py-2.5 px-4">산출 비고 및 사유</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 font-mono text-[11px]">
                    {STORAGE_ESTIMATES.map((item, idx) => {
                      const isTotal = item.category === '전체 합계';
                      return (
                        <tr
                          key={idx}
                          className={`${
                            isTotal
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 font-bold text-blue-900 dark:text-blue-100'
                              : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
                          }`}
                        >
                          <td className="py-2.5 px-4 font-sans font-medium">{item.category}</td>
                          <td className="py-2.5 px-4 font-sans">{item.item}</td>
                          <td className="py-2.5 px-4 text-right text-blue-600 dark:text-blue-400 font-bold">
                            {item.jongnoEstimatedSize}
                          </td>
                          <td className="py-2.5 px-4 text-right text-neutral-500">
                            {item.seoulEstimatedSize}
                          </td>
                          <td className="py-2.5 px-4 font-sans text-neutral-500 dark:text-neutral-400">
                            {item.notes}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Hardware Specifications */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
                <h4 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                  최소 권장 서버 사양 (Minimal Spec)
                </h4>
                <div className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                  <div className="flex justify-between">
                    <span>CPU:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.minimum.cpu}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>RAM:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.minimum.ram}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>저장장치:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.minimum.disk}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>권장 OS:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.minimum.os}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>네트워크:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.minimum.network}</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-blue-50/50 dark:bg-blue-950/20">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-200 mb-2">
                  프로덕션 통합관제 권장 사양 (Production Spec)
                </h4>
                <div className="space-y-1.5 text-[11px] text-neutral-600 dark:text-neutral-300">
                  <div className="flex justify-between">
                    <span>CPU:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.recommended.cpu}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>RAM:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.recommended.ram}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>저장장치:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.recommended.disk}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>권장 OS:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.recommended.os}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>네트워크:</span>
                    <strong className="font-mono">{SERVER_HARDWARE_SPECS.recommended.network}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Open Source Licenses */}
        {activeTab === 'license' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              상업적 및 공공 폐쇄망 구축용 오픈소스 라이선스 검증 현황
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Google Maps, Kakao Maps, Naver Maps 등의 유료/외부 종속 API를 배제하고, 상업적 이용 및 완전 폐쇄망 배포가 승인된 무상 라이선스 소프트웨어만을 채택하였습니다.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                {
                  name: 'Leaflet.js',
                  version: 'v1.9.4',
                  license: 'BSD-2-Clause',
                  commercial: '상업적 이용 가능',
                  role: '웹 클라이언트 2D 타일 맵 렌더링 및 구역 인터랙션 엔진',
                },
                {
                  name: 'OpenStreetMap (OSM)',
                  version: 'Latest Planet Extract',
                  license: 'ODbL 1.0 (Open Database License)',
                  commercial: '상업적 및 공공 이용 가능',
                  role: '종로구 도로망, 건물, 보행로 원본 벡터 데이터베이스',
                },
                {
                  name: 'TileServer GL',
                  version: 'v4.x (Docker)',
                  license: 'BSD-2-Clause',
                  commercial: '상업적 이용 가능',
                  role: '독립형 내부 래스터/벡터 타일 서빙 웹 서버',
                },
                {
                  name: 'Tilemaker / Planetiler',
                  version: 'v2.x / v0.8.x',
                  license: 'BSD-2-Clause / Apache 2.0',
                  commercial: '상업적 이용 가능',
                  role: 'PBF 지리 데이터를 MBTiles 단일 패키지로 컴파일',
                },
                {
                  name: 'Osmium Tool',
                  version: 'v1.16+',
                  license: 'GPL v3 / LGPL',
                  commercial: '서버 내부 도구 활용 가능',
                  role: '대한민국 PBF에서 종로구 Bounding Box 고속 클리핑',
                },
                {
                  name: 'Lucide React',
                  version: 'v0.546.0',
                  license: 'ISC License',
                  commercial: '상업적 이용 가능',
                  role: '오프라인 인라인 SVG 시스템 아이콘 라이브러리',
                },
              ].map((sw, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-neutral-50 dark:bg-neutral-800/40 rounded-lg border border-neutral-200 dark:border-neutral-700/60"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{sw.name}</span>
                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                      {sw.license}
                    </span>
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                    {sw.commercial}
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-normal">
                    {sw.role}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between shrink-0">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-500" />
            <span>본 가이드는 지자체 통합관제센터 및 군·경찰 폐쇄망 보안 심의 규정을 준수합니다.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-lg transition-colors"
          >
            가이드 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
