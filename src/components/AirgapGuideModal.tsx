import React, { useState } from 'react';
import {
  X,
  Server,
  Terminal,
  Layers,
  Cpu,
  Database,
  Radio,
  Cctv,
  Check,
  Copy,
  BookOpen,
  FolderTree,
  ShieldCheck,
  Code2,
} from 'lucide-react';

interface AirgapGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AirgapGuideModal: React.FC<AirgapGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'libraries' | 'airgap_prep' | 'backend_guide' | 'tileserver'>('libraries');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50/60 dark:bg-neutral-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                <span>시스템 아키텍처 & 폐쇄망 백엔드 개발 가이드</span>
                <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
                  v2.0 Architecture
                </span>
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                종로구 혼잡도 관제 시스템의 지도 렌더링 파이프라인, 프론트 폐쇄망 밑작업 현황 및 백엔드 개발 연동 가이드
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-2 bg-neutral-100/50 dark:bg-neutral-950/40 shrink-0 text-xs overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('libraries')}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'libraries'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. 지도 라이브러리 & 렌더링 구조</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('airgap_prep')}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'airgap_prep'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2. 폐쇄망 밑작업 현황 (완료 내역)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backend_guide')}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'backend_guide'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>3. 백엔드 개발(백개발) 연동 가이드</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tileserver')}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'tileserver'
                ? 'border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>4. 폐쇄망 타일 서버 호스팅 (Docker)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* TAB 1: 지도 라이브러리 & 렌더링 구조 */}
          {activeTab === 'libraries' && (
            <div className="space-y-6">
              <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-xl p-4">
                <h3 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span>하이브리드 GIS 렌더링 아키텍처: Leaflet + MapLibre GL</span>
                </h3>
                <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-1.5 leading-relaxed">
                  본 시스템은 <strong>Leaflet의 고성능 인터랙티브 GIS 레이어링 능력</strong>과{' '}
                  <strong>MapLibre GL의 WebGL 하드웨어 가속 벡터 타일 렌더링 능력</strong>을 결합한 하이브리드 아키텍처로 구축되어 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Leaflet (v1.9.4)</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                      GIS 레이어 오케스트레이션
                    </span>
                  </div>
                  <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc pl-4">
                    <li><strong>도형 편집/드래그</strong>: 구역 원형/다각형 생성, 실시간 꼭짓점 드래그 편집 (`L.divIcon`, `L.polygon`, `L.circle`)</li>
                    <li><strong>인터랙티브 레이어</strong>: 서울 지하철 노선/역/출구, 종로구 행정구역 경계선, 외곽 반전 마스크</li>
                    <li><strong>이벤트 제어</strong>: 0.5단위 마우스 휠 줌 스냅, 60fps 무지연 드래그, 다단계 줌 레벨 스위칭 (16.0 Threshold)</li>
                    <li><strong>초경량/독립성</strong>: 외부 대형 라이브러리 의존성 없이 순수 DOM/SVG 기반으로 폐쇄망에서 매우 안정적</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-neutral-900 dark:text-neutral-100">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>MapLibre GL (v5.1.0) & 브릿지</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                      WebGL 하드웨어 가속 배경 타일
                    </span>
                  </div>
                  <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc pl-4">
                    <li><strong>@maplibre/maplibre-gl-leaflet</strong>: Leaflet의 베이스 타일 레이어(`tileLayerRef`)에 MapLibre GL 캔버스를 완벽 마운트</li>
                    <li><strong>OpenFreeMap / MapLibre 스타일</strong>: `positron.json`(다크) 및 `bright.json`(라이트) 표준 벡터 스타일 규격 지원</li>
                    <li><strong>초고해상도 선명도</strong>: 레티나/4K 디스플레이에서도 텍스트와 도로선이 흐려지지 않고 선명하게 WebGL 렌더링</li>
                    <li><strong>Web Worker 로컬 번들링</strong>: 외부 CDN 없이 `maplibre-gl-worker.mjs`를 프로젝트 내부에서 자체 로드</li>
                  </ul>
                </div>
              </div>

              {/* Pipeline Diagram */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 text-white font-mono text-xs">
                <div className="text-neutral-400 mb-2 font-bold flex items-center justify-between">
                  <span>[GIS 렌더링 계층 구조 (Z-Index Hierarchy)]</span>
                  <span className="text-[11px] text-blue-400">MapContainer.tsx 기준</span>
                </div>
                <div className="space-y-1.5 text-neutral-300">
                  <div className="p-2 bg-neutral-800/90 rounded border border-neutral-700">
                    <span className="text-red-400 font-bold">Z: 600+</span> · <strong>혼잡도 심각/위험 상위 레이어 & 3D 상태 배지</strong> (DOM 순서 오름차순 정렬)
                  </div>
                  <div className="p-2 bg-neutral-800/80 rounded border border-neutral-700/80">
                    <span className="text-amber-400 font-bold">Z: 450</span> · <strong>관제 구역 (Zones) 다각형 & 스캐너 원형 (Radius 버퍼)</strong>
                  </div>
                  <div className="p-2 bg-neutral-800/70 rounded border border-neutral-700/70">
                    <span className="text-emerald-400 font-bold">Z: 400</span> · <strong>종로구 행정구역 경계선 (Yellow 점선)</strong>
                  </div>
                  <div className="p-2 bg-neutral-800/60 rounded border border-neutral-700/60">
                    <span className="text-purple-400 font-bold">Z: 350</span> · <strong>종로구 외곽 반전 음영 마스크 (Inverted Donut World Mask)</strong>
                  </div>
                  <div className="p-2 bg-neutral-800/50 rounded border border-neutral-700/50">
                    <span className="text-sky-400 font-bold">Z: 250</span> · <strong>서울 지하철 노선망 / 지하철역 / 출입구 레이어</strong>
                  </div>
                  <div className="p-2 bg-neutral-800/40 rounded border border-neutral-700/40">
                    <span className="text-blue-400 font-bold">Z: 0</span> · <strong>MapLibre GL WebGL 벡터 베이스 타일 (`positron.json` / `bright.json`)</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 폐쇄망 밑작업 현황 */}
          {activeTab === 'airgap_prep' && (
            <div className="space-y-5">
              <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-4">
                <h3 className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>외부 인터넷 연결 0% (완전 오프라인) 사전 작업 완료 내역</span>
                </h3>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
                  본 프론트엔드 프로젝트는 외부 인터넷 망(CDN, Google Fonts, Mapbox 서버 등)이 완전히 차단된 폐쇄망 환경에서도 100% 정상 구동되도록 아래 밑작업이 완료되어 있습니다.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>1. Web Worker 로컬 번들링 (`setWorkerUrl`)</span>
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">구현 완료</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    MapLibre GL은 일반적으로 외부 CDN에서 웹워커 스크립트를 비동기 로드합니다. 본 프로젝트는 Vite의 <code>?worker&url</code> 쿼리를 통해 빌드 산출물(<code>dist/assets/maplibre-gl-worker-*.js</code>)에 완전히 포함시켰습니다.
                  </p>
                  <pre className="p-2.5 bg-neutral-900 rounded-lg text-emerald-400 font-mono text-[11px] overflow-x-auto">
                    {`import { setWorkerUrl } from 'maplibre-gl';\nimport workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';\nsetWorkerUrl(workerUrl);`}
                  </pre>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>2. 글리프(폰트) & 스프라이트(아이콘) 로컬 호스팅</span>
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">구현 완료</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    지도 라벨용 폰트 바이너리(PBF)와 스프라이트 아이콘이 <code>public/fonts/</code> 및 <code>public/sprites/</code>에 내장되어 있어 지도 텍스트가 깨지거나 누락되지 않습니다.
                  </p>
                  <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-900/60 p-2.5 rounded-lg space-y-1">
                    <div>• 폰트 경로: <code>/fonts/&#123;fontstack&#125;/&#123;range&#125;.pbf</code> (Noto Sans, Roboto 등 CJK 한글 폰트 포함)</div>
                    <div>• 스프라이트 경로: <code>/sprites/ofm.json</code>, <code>/sprites/ofm.png</code></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>3. 종로구 관제 경계 및 서울 지하철 전역 GIS 데이터 내장</span>
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">구현 완료</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    외부 GIS 서버(VWorld, 국가공간정보포털 등) 호출 없이, 종로구 정밀 폴리곤과 1~9호선/경의중앙선/우이신설선 등 전체 지하철 데이터셋이 정적 JSON으로 컴포넌트에 포함되어 있습니다.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>4. 오프라인 줌/패닝 하드월(Hard Wall) 잠금</span>
                    </h4>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">구현 완료</span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    타일이 없는 외부 지역으로 지도가 드래그되어 회색 화면이 나타나는 것을 원천 차단하기 위해 <code>maxBoundsViscosity: 1.0</code>(벽 효과) 및 <code>minZoom: 13</code> 제한이 적용되어 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 백엔드 개발 연동 가이드 */}
          {activeTab === 'backend_guide' && (
            <div className="space-y-6">
              <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-4">
                <h3 className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <Server className="w-4 h-4 text-amber-500" />
                  <span>백엔드 개발(백개발) 작업 로드맵 & API 명세</span>
                </h3>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-1 leading-relaxed">
                  현재 프론트엔드는 <code>Vite Mock 미들웨어</code>와 <code>초기 시뮬레이션 타이머</code>로 구동되고 있습니다. 실제 운영 서버 구축을 위해 백엔드 개발자가 구현해야 하는 인터페이스 규격입니다.
                </p>
              </div>

              {/* Module 1: REST API */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-blue-500" />
                    <span>1. 관제 구역(Zone) 및 영역(Area) 관리 REST API</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'rest-spec',
                        `GET    /api/zones         -> ZoneData[]\nPOST   /api/zones         -> { zone: ZoneData }\nPUT    /api/zones/:id     -> { zone: ZoneData }\nDELETE /api/zones/:id     -> { success: true }\nGET    /api/areas         -> AreaInfo[]`
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedId === 'rest-spec' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>API 스펙 복사</span>
                  </button>
                </div>
                <div className="overflow-x-auto text-xs font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-700 text-neutral-500">
                        <th className="py-2">Method</th>
                        <th className="py-2">Endpoint</th>
                        <th className="py-2">설명</th>
                        <th className="py-2">프론트엔드 연동 파일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-neutral-700 dark:text-neutral-300">
                      <tr>
                        <td className="py-2 font-bold text-blue-600">GET</td>
                        <td className="py-2"><code>/api/zones</code></td>
                        <td>전체 48개 구역의 중심좌표, 반경, 다각형 꼭짓점, 수용량 조회</td>
                        <td className="py-2"><code>src/App.tsx</code> (초기화)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-amber-600">POST</td>
                        <td className="py-2"><code>/api/save-zones</code> (또는 <code>PUT /api/zones/:id</code>)</td>
                        <td>지도에서 도형 드래그 이동/핸들 수정 시 자동 저장 (기존 Vite 임시 미들웨어 대체)</td>
                        <td className="py-2"><code>src/App.tsx:saveZonesToFile</code></td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-emerald-600">POST</td>
                        <td className="py-2"><code>/api/zones</code></td>
                        <td>신규 원형/다각형 구역 생성 및 CCTV 스캐너 매핑</td>
                        <td className="py-2"><code>src/App.tsx:handleAddZoneComplete</code></td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-red-600">DELETE</td>
                        <td className="py-2"><code>/api/zones/:id</code></td>
                        <td>특정 구역 삭제 처리</td>
                        <td className="py-2"><code>src/App.tsx:handleDeleteZone</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Module 2: WebSocket */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-purple-500" />
                    <span>2. 실시간 혼잡도 수집 & WebSocket 브로드캐스트</span>
                  </h4>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  현장 AI 스마트스캐너/CCTV 인파 계수기에서 집계된 데이터가 백엔드로 인입되면, 백엔드는 혼잡도 단계(1~6단계) 및 체류 인원을 산출하여 관제 클라이언트에 WebSocket으로 푸시합니다.
                </p>
                <div className="p-3 bg-neutral-900 rounded-lg text-neutral-300 font-mono text-[11px] overflow-x-auto space-y-1">
                  <div className="text-neutral-500">// WebSocket 엔드포인트: ws://[서버IP]:8080/ws/congestion</div>
                  <div className="text-blue-400">// 클라이언트 수신 메시지 포맷 (JSON Payload):</div>
                  <pre className="text-emerald-400">
{`{
  "zoneId": "ZONE-IK-01",
  "level": 3,                   // 1: 정상, 2: 관심, 3: 주의, 4: 경계, 5: 심각, 6: 위험
  "value": 52,                  // 밀집도 퍼센트 (0 ~ 100)
  "estimatedVisitors": 1300,    // 추정 체류 인원(명)
  "trend": "increasing",        // 'increasing' | 'stable' | 'decreasing'
  "updatedAt": "2026-10-22T14:50:00Z"
}`}
                  </pre>
                </div>
              </div>

              {/* Module 3: CCTV Stream */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                    <Cctv className="w-4 h-4 text-red-500" />
                    <span>3. CCTV RTSP 영상 스트리밍 게이트웨이 연동</span>
                  </h4>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  지자체 관제망 내의 현장 CCTV 카메라(RTSP 프로토콜)는 웹 브라우저에서 직접 재생할 수 없으므로, 백엔드 경량 미디어 서버(예: <strong>MediaMTX</strong> 또는 <strong>go2rtc</strong>)를 두어 <code>WebRTC</code> 또는 <code>HLS(m3u8)</code>로 실시간 트랜스코딩하여 제공해야 합니다.
                </p>
                <div className="p-3 bg-neutral-900 rounded-lg text-neutral-300 font-mono text-[11px] space-y-1">
                  <div>• 스트리밍 URL 형식: <code>http://[미디어서버]:8888/live/&#123;zoneId&#125;/index.m3u8</code></div>
                  <div>• 프론트 연동 컴포넌트: <code>src/components/CctvModal.tsx</code>의 <code>&lt;video&gt;</code> 또는 HLS.js 플레이어와 즉시 연동 가능</div>
                </div>
              </div>

              {/* Module 4: DB Schema */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-3">
                <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span>4. 추천 데이터베이스(DB) 구성: PostgreSQL + PostGIS</span>
                </h4>
                <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1.5 list-disc pl-4">
                  <li><strong>PostgreSQL + PostGIS 확장</strong>: 원형 반경 버퍼(<code>ST_Buffer</code>), 다각형 중심점(<code>ST_Centroid</code>), 포함 여부(<code>ST_Contains</code>) 등 지리 연산 처리</li>
                  <li><strong>TimescaleDB / Redis</strong>: 초 단위로 수집되는 스캐너 인파 계수 시계열(Time-Series) 데이터 저장 및 최신 혼잡도 인메모리 캐싱</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: 폐쇄망 타일 서버 호스팅 */}
          {activeTab === 'tileserver' && (
            <div className="space-y-5">
              <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 rounded-xl p-4">
                <h3 className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-purple-500" />
                  <span>폐쇄망 온프레미스 타일 서버 구축 (Docker TileServer GL)</span>
                </h3>
                <p className="text-xs text-purple-800/80 dark:text-purple-300/80 mt-1 leading-relaxed">
                  인터넷이 없는 서버실 환경에서 1개 Docker 컨테이너 구동만으로 대한민국/서울 전역 벡터 지도를 즉시 서빙하는 방법입니다.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                    Step 1. Docker 컨테이너 원클릭 구동 명령어
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'docker-cmd',
                        `docker run --name jongno-tileserver -d \\\n  -p 8080:8080 \\\n  -v $(pwd)/tiles:/data \\\n  maptiler/tileserver-gl`
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {copiedId === 'docker-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>명령어 복사</span>
                  </button>
                </div>
                <pre className="p-3 bg-neutral-900 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto">
{`# 1. MBTiles 저장 디렉토리 생성 및 타일 파일 배치 (예: seoul.mbtiles 약 85MB)
mkdir -p ~/map-server/tiles && cd ~/map-server

# 2. TileServer GL 도커 컨테이너 구동 (포트 8080)
docker run --name jongno-tileserver -d \\
  -p 8080:8080 \\
  -v $(pwd)/tiles:/data \\
  --restart always \\
  maptiler/tileserver-gl`}
                </pre>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-800/40 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                    Step 2. Nginx 또는 프론트엔드 환경변수 연결
                  </h4>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  타일 서버 구동 후, 프론트엔드의 <code>public/styles/positron.json</code> 및 <code>bright.json</code> 내의 소스 URL만 내부 서버 주소(예: <code>http://192.168.1.100:8080/data/v3/&#123;z&#125;/&#123;x&#125;/&#123;y&#125;.pbf</code>)로 지정하면 외부 인터넷 통신 없이 완벽하게 동작합니다.
                </p>
                <div className="p-3 bg-neutral-900 rounded-lg text-neutral-300 font-mono text-[11px] space-y-1">
                  <div className="text-neutral-500"># Nginx 리버스 프록시 연동 예시 (/tiles 경로 포워딩):</div>
                  <pre className="text-blue-400">
{`location /tiles/ {
    proxy_pass http://localhost:8080/data/v3/;
    proxy_set_header Host $host;
    proxy_cache_valid 200 30d;
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
