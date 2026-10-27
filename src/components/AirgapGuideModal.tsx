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
    <div className="ds-modal-backdrop">
      <div className="ds-modal-dialog ds-guide-dialog">
        {/* Header */}
        <div className="ds-modal-header">
          <div className="ds-modal-title-row">
            <div className="ds-header-logo-box" style={{ width: 36, height: 36 }}>
              <Layers style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="ds-modal-title">시스템 아키텍처 & 폐쇄망 백엔드 개발 가이드</h2>
                <span className="ds-badge ds-badge-xs text-blue">v2.0 Architecture</span>
              </div>
              <p className="text-xs text-muted mt-0-5">
                종로구 혼잡도 관제 시스템의 지도 렌더링 파이프라인, 프론트 폐쇄망 밑작업 현황 및 백엔드 개발 연동 가이드
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ds-btn-icon"
            title="닫기 (Esc)"
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="ds-guide-tabs">
          <button
            type="button"
            onClick={() => setActiveTab('libraries')}
            className={`ds-guide-tab ${activeTab === 'libraries' ? 'active' : ''}`}
          >
            <Cpu style={{ width: 15, height: 15 }} />
            <span>1. 지도 라이브러리 & 렌더링 구조</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('airgap_prep')}
            className={`ds-guide-tab ${activeTab === 'airgap_prep' ? 'active' : ''}`}
          >
            <ShieldCheck style={{ width: 15, height: 15 }} />
            <span>2. 폐쇄망 밑작업 현황 (완료 내역)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backend_guide')}
            className={`ds-guide-tab ${activeTab === 'backend_guide' ? 'active' : ''}`}
          >
            <Server style={{ width: 15, height: 15 }} />
            <span>3. 백엔드 개발(백개발) 연동 가이드</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tileserver')}
            className={`ds-guide-tab ${activeTab === 'tileserver' ? 'active' : ''}`}
          >
            <Terminal style={{ width: 15, height: 15 }} />
            <span>4. 폐쇄망 타일 서버 호스팅 (Docker)</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="ds-modal-body flex flex-col gap-5">
          {/* TAB 1: 지도 라이브러리 & 렌더링 구조 */}
          {activeTab === 'libraries' && (
            <div className="flex flex-col gap-4">
              <div className="ds-guide-hero">
                <div className="ds-guide-hero-title">
                  <Cpu style={{ width: 18, height: 18, color: '#3b82f6' }} />
                  <span>하이브리드 GIS 렌더링 아키텍처: Leaflet + MapLibre GL</span>
                </div>
                <p className="ds-guide-hero-desc">
                  본 관제 시스템은 <strong>Leaflet의 고성능 인터랙티브 GIS 레이어링 능력</strong>과{' '}
                  <strong>MapLibre GL의 WebGL 하드웨어 가속 벡터 타일 렌더링 능력</strong>을 결합한 하이브리드 아키텍처로 구축되어 있습니다.
                </p>
              </div>

              <div className="ds-guide-grid-2">
                <div className="ds-guide-card">
                  <div className="ds-guide-card-header">
                    <div className="ds-guide-card-title">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span>Leaflet (v1.9.4)</span>
                    </div>
                    <span className="ds-badge ds-badge-xs">GIS 레이어 오케스트레이션</span>
                  </div>
                  <ul className="ds-guide-list">
                    <li className="ds-guide-list-item">
                      <span className="ds-guide-list-dot" />
                      <div><strong>도형 편집/드래그</strong>: 구역 원형/다각형 생성, 실시간 꼭짓점 드래그 편집 (<code>L.divIcon</code>, <code>L.circle</code>)</div>
                    </li>
                    <li className="ds-guide-list-item">
                      <span className="ds-guide-list-dot" />
                      <div><strong>인터랙티브 레이어</strong>: 서울 지하철 노선/역/출구, 종로구 행정구역 경계선, 외곽 반전 마스크</div>
                    </li>
                    <li className="ds-guide-list-item">
                      <span className="ds-guide-list-dot" />
                      <div><strong>이벤트 제어</strong>: 0.5단위 마우스 휠 줌 스냅, 60fps 무지연 드래그, 다단계 줌 레벨 스위칭 (16.0 Threshold)</div>
                    </li>
                    <li className="ds-guide-list-item">
                      <span className="ds-guide-list-dot" />
                      <div><strong>CSS 전담 SVG 렌더러</strong>: Leaflet 내장 기본 파란색 속성을 차단하고 순수 CSS 클래스로 색상/테두리 제어</div>
                    </li>
                  </ul>
                </div>

                <div className="ds-guide-card">
                  <div className="ds-guide-card-header">
                    <div className="ds-guide-card-title">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
                      <span>MapLibre GL (v6.15.0) & 브릿지</span>
                    </div>
                    <span className="ds-badge ds-badge-xs">WebGL 하드웨어 가속 타일</span>
                  </div>
                  <ul className="ds-guide-list">
                    <li className="ds-guide-list-item">
                      <span className="ds-guide-list-dot" />
                      <div><strong>@maplibre/maplibre-gl-leaflet</strong>: Leaflet 베이스 타일 레이어에 WebGL 캔버스 완벽 마운트</div>
                    </li>
                    <li className="ds-guide-list-item">
                      <span className="ds-guide-list-dot" />
                      <div><strong>온프레미스 관제 스타일</strong>: 상업시설 POI가 제거된 <code>jongno-dark</code> 및 고선명 <code>bright.json</code> 벡터 규격 지원</div>
                    </li>
                    <li className="ds-guide-list-item">
                      <span className="ds-guide-list-dot" />
                      <div><strong>도로 번호 쉴드 제어</strong>: 국도/고속도로 번호 표출 토글 기능 연동 지원</div>
                    </li>
                    <li className="ds-guide-list-item">
                      <span className="ds-guide-list-dot" />
                      <div><strong>Web Worker 로컬 번들링</strong>: 외부 CDN 없이 <code>maplibre-gl-worker.mjs</code>를 프로젝트 내부에서 자체 로드</div>
                    </li>
                  </ul>
                </div>
              </div>

              {/* 줌 레벨 16.0 Threshold 렌더링 파이프라인 */}
              <div className="ds-guide-card">
                <div className="ds-guide-card-header">
                  <div className="ds-guide-card-title">
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#6366f1' }} />
                    <span>다단계 줌 스위칭 (16.0 Threshold) & 혼잡도 시각화 파이프라인</span>
                  </div>
                </div>
                <div className="ds-guide-grid-2">
                  <div style={{ padding: 12, borderRadius: 'var(--ds-radius-lg)', backgroundColor: 'var(--ds-bg-surface-subtle)', border: '1px solid var(--ds-border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontWeight: 700, color: '#6366f1', fontSize: 12 }}>Zoom &lt; 16.0 (광역 영역 뷰)</div>
                    <p style={{ fontSize: 11.5, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                      4대 핵심 영역(Convex Hull 자동 생성)의 혼잡도 그라데이션(<code>radialGradient</code>) 배경 + 3D 상태 배지 표출. 다크 모드(<code>hard-light</code>)와 라이트 모드(<code>multiply</code>) 최적화 블렌딩 적용.
                    </p>
                  </div>
                  <div style={{ padding: 12, borderRadius: 'var(--ds-radius-lg)', backgroundColor: 'var(--ds-bg-surface-subtle)', border: '1px solid var(--ds-border-subtle)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontWeight: 700, color: '#10b981', fontSize: 12 }}>Zoom &ge; 16.0 (상세 구역 뷰)</div>
                    <p style={{ fontSize: 11.5, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                      <strong>영역 Fill 완전 투명화</strong>: 영역 내부 채우기를 0으로 제거하고 은은한 점선 테두리(<code>dashArray: 6, 6</code>)만 유지하여, 내부 개별 구역(스마트스캐너 원형 히트/CCTV)의 색상과 골목길명이 또렷하게 표출.
                    </p>
                  </div>
                </div>
              </div>

              {/* GIS Hierarchy Stack */}
              <div className="ds-guide-card">
                <div className="ds-guide-card-header">
                  <div className="ds-guide-card-title">
                    <span>[GIS 렌더링 계층 구조 (Z-Index Hierarchy)]</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ds-primary)', fontFamily: 'var(--ds-font-mono)' }}>MapContainer.tsx 기준</span>
                </div>
                <div className="ds-hierarchy-stack">
                  <div className="ds-hierarchy-layer">
                    <span className="ds-hierarchy-badge" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.35)' }}>Z: 600+ (markerPane)</span>
                    <span><strong>스마트스캐너 / CCTV 마커 & 3D 상태 배지</strong> (DOM 순서 오름차순 정렬)</span>
                  </div>
                  <div className="ds-hierarchy-layer">
                    <span className="ds-hierarchy-badge" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.35)' }}>Z: 400 (overlayPane)</span>
                    <span><strong>관제 구역 (Zones) 다각형 & 스캐너 원형 (Radius 버퍼)</strong></span>
                  </div>
                  <div className="ds-hierarchy-layer">
                    <span className="ds-hierarchy-badge" style={{ backgroundColor: 'rgba(249, 115, 22, 0.15)', color: '#f97316', border: '1px solid rgba(249, 115, 22, 0.35)' }}>Z: 400 (overlayPane)</span>
                    <span><strong>4대 핵심 영역 (Areas)</strong>: Zoom &lt; 16 혼잡도 그라데이션 면 / Zoom &ge; 16 투명 점선 테두리</span>
                  </div>
                  <div className="ds-hierarchy-layer">
                    <span className="ds-hierarchy-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.35)' }}>Z: 400 (overlayPane)</span>
                    <span><strong>종로구 행정구역 경계선</strong> (Yellow 점선 / Blue 점선)</span>
                  </div>
                  <div className="ds-hierarchy-layer">
                    <span className="ds-hierarchy-badge" style={{ backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.35)' }}>Z: 350 (outerMaskPane)</span>
                    <span><strong>종로구 외곽 반전 음영 마스크</strong> (Inverted Donut World Mask)</span>
                  </div>
                  <div className="ds-hierarchy-layer">
                    <span className="ds-hierarchy-badge" style={{ backgroundColor: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.35)' }}>Z: 300 (subwayStationsPane)</span>
                    <span><strong>서울 지하철 역사 / 출입구 레이어</strong> (노선망 위 독립 Pane)</span>
                  </div>
                  <div className="ds-hierarchy-layer">
                    <span className="ds-hierarchy-badge" style={{ backgroundColor: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.35)' }}>Z: 250 (subwayLinesPane)</span>
                    <span><strong>서울 지하철 1~9호선 선로/노선망 폴리라인</strong></span>
                  </div>
                  <div className="ds-hierarchy-layer">
                    <span className="ds-hierarchy-badge" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.35)' }}>Z: 0~200 (tilePane)</span>
                    <span><strong>MapLibre GL WebGL 벡터 베이스 타일</strong> (<code>jongno-dark</code> / <code>bright.json</code>)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 폐쇄망 밑작업 현황 */}
          {activeTab === 'airgap_prep' && (
            <div className="flex flex-col gap-4">
              <div className="ds-guide-hero emerald">
                <div className="ds-guide-hero-title">
                  <ShieldCheck style={{ width: 18, height: 18, color: '#10b981' }} />
                  <span>외부 인터넷 연결 0% (완전 오프라인) 사전 작업 완료 내역</span>
                </div>
                <p className="ds-guide-hero-desc">
                  본 프론트엔드 프로젝트는 외부 인터넷 망(CDN, Google Fonts, Mapbox 서버 등)이 완전히 차단된 폐쇄망 환경에서도 100% 정상 구동되도록 아래 밑작업이 완료되어 있습니다.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="ds-guide-card">
                  <div className="ds-guide-card-header">
                    <div className="ds-guide-card-title">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span>1. Web Worker 로컬 번들링 (<code>setWorkerUrl</code>)</span>
                    </div>
                    <span className="ds-badge ds-badge-xs text-green" style={{ fontWeight: 700 }}>구현 완료</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                    MapLibre GL은 일반적으로 외부 CDN에서 웹워커 스크립트를 비동기 로드합니다. 본 프로젝트는 Vite의 <code>?worker&url</code> 쿼리를 통해 빌드 산출물(<code>dist/assets/maplibre-gl-worker-*.js</code>)에 완전히 포함시켰습니다.
                  </p>
                  <div className="ds-code-block">
                    <pre>{`import { setWorkerUrl } from 'maplibre-gl';\nimport workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';\nsetWorkerUrl(workerUrl);`}</pre>
                  </div>
                </div>

                <div className="ds-guide-card">
                  <div className="ds-guide-card-header">
                    <div className="ds-guide-card-title">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span>2. 글리프(폰트) & 스프라이트(아이콘) 로컬 호스팅</span>
                    </div>
                    <span className="ds-badge ds-badge-xs text-green" style={{ fontWeight: 700 }}>구현 완료</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                    지도 라벨용 폰트 바이너리(PBF)와 스프라이트 아이콘이 <code>public/fonts/</code> 및 <code>public/sprites/</code>에 내장되어 있어 지도 텍스트가 깨지거나 누락되지 않습니다.
                  </p>
                  <div className="ds-code-block" style={{ color: '#94a3b8' }}>
                    <div>• 폰트 경로: <code>/fonts/&#123;fontstack&#125;/&#123;range&#125;.pbf</code> (Noto Sans, Roboto 등 CJK 한글 폰트 포함)</div>
                    <div>• 스프라이트 경로: <code>/sprites/ofm.json</code>, <code>/sprites/ofm.png</code></div>
                  </div>
                </div>

                <div className="ds-guide-card">
                  <div className="ds-guide-card-header">
                    <div className="ds-guide-card-title">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span>3. 종로구 관제 경계 및 서울 지하철 전역 GIS 데이터 내장</span>
                    </div>
                    <span className="ds-badge ds-badge-xs text-green" style={{ fontWeight: 700 }}>구현 완료</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                    외부 GIS 서버(VWorld, 국가공간정보포털 등) 호출 없이, 종로구 정밀 폴리곤과 1~9호선/경의중앙선/우이신설선 등 전체 지하철 데이터셋이 정적 JSON으로 컴포넌트에 포함되어 있습니다.
                  </p>
                </div>

                <div className="ds-guide-card">
                  <div className="ds-guide-card-header">
                    <div className="ds-guide-card-title">
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <span>4. 오프라인 줌/패닝 하드월(Hard Wall) 잠금</span>
                    </div>
                    <span className="ds-badge ds-badge-xs text-green" style={{ fontWeight: 700 }}>구현 완료</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                    타일이 없는 외부 지역으로 지도가 드래그되어 회색 화면이 나타나는 것을 원천 차단하기 위해 <code>maxBoundsViscosity: 1.0</code>(벽 효과) 및 <code>minZoom: 13</code> 제한이 적용되어 있습니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 백엔드 개발 연동 가이드 */}
          {activeTab === 'backend_guide' && (
            <div className="flex flex-col gap-4">
              <div className="ds-guide-hero amber">
                <div className="ds-guide-hero-title">
                  <Server style={{ width: 18, height: 18, color: '#f59e0b' }} />
                  <span>백엔드 개발(백개발) 작업 로드맵 & API 명세</span>
                </div>
                <p className="ds-guide-hero-desc">
                  현재 프론트엔드는 <code>Vite Mock 미들웨어</code>와 <code>초기 시뮬레이션 타이머</code>로 구동되고 있습니다. 실제 운영 서버 구축을 위해 백엔드 개발자가 구현해야 하는 인터페이스 규격입니다.
                </p>
              </div>

              {/* Module 1: REST API */}
              <div className="ds-guide-card">
                <div className="ds-guide-card-header">
                  <div className="ds-guide-card-title">
                    <Code2 style={{ width: 16, height: 16, color: '#3b82f6' }} />
                    <span>1. 관제 구역(Zone) 및 영역(Area) 관리 REST API</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'rest-spec',
                        `GET    /api/zones         -> ZoneData[]\nPOST   /api/zones         -> { zone: ZoneData }\nPUT    /api/zones/:id     -> { zone: ZoneData }\nDELETE /api/zones/:id     -> { success: true }\nGET    /api/areas         -> AreaInfo[]`
                      )
                    }
                    className="ds-btn ds-btn-secondary ds-btn-xs"
                  >
                    {copiedId === 'rest-spec' ? <Check style={{ width: 14, height: 14, color: '#10b981' }} /> : <Copy style={{ width: 14, height: 14 }} />}
                    <span>API 스펙 복사</span>
                  </button>
                </div>

                <div className="ds-guide-table-wrapper">
                  <table className="ds-guide-table">
                    <thead>
                      <tr>
                        <th style={{ width: 90 }}>Method</th>
                        <th style={{ width: 220 }}>Endpoint</th>
                        <th>설명</th>
                        <th style={{ width: 240 }}>프론트엔드 연동 파일</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="ds-method-badge ds-method-get">GET</span></td>
                        <td><code>/api/zones</code></td>
                        <td>전체 48개 구역의 중심좌표, 반경, 다각형 꼭짓점, 수용량 조회</td>
                        <td><code>src/App.tsx</code> (초기화)</td>
                      </tr>
                      <tr>
                        <td><span className="ds-method-badge ds-method-post">POST</span></td>
                        <td><code>/api/save-zones</code></td>
                        <td>지도에서 도형 드래그 이동/핸들 수정 시 자동 저장 (JSON 파일 동기화)</td>
                        <td><code>src/App.tsx:saveZonesToFile</code></td>
                      </tr>
                      <tr>
                        <td><span className="ds-method-badge ds-method-post">POST</span></td>
                        <td><code>/api/zones</code></td>
                        <td>신규 원형 구역 생성 및 CCTV 스캐너 매핑</td>
                        <td><code>src/App.tsx:handleAddZoneComplete</code></td>
                      </tr>
                      <tr>
                        <td><span className="ds-method-badge ds-method-delete">DELETE</span></td>
                        <td><code>/api/zones/:id</code></td>
                        <td>특정 구역 삭제 처리</td>
                        <td><code>src/App.tsx:handleDeleteZone</code></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Module 2: WebSocket */}
              <div className="ds-guide-card">
                <div className="ds-guide-card-header">
                  <div className="ds-guide-card-title">
                    <Radio style={{ width: 16, height: 16, color: '#a855f7' }} />
                    <span>2. 실시간 혼잡도 수집 & WebSocket 브로드캐스트</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                  현장 AI 스마트스캐너/CCTV 인파 계수기에서 집계된 데이터가 백엔드로 인입되면, 백엔드는 혼잡도 단계(1~6단계) 및 체류 인원을 산출하여 관제 클라이언트에 WebSocket으로 푸시합니다.
                </p>
                <div className="ds-code-block">
                  <div style={{ color: '#64748b', marginBottom: 6 }}>// WebSocket 엔드포인트: ws://[서버IP]:8080/ws/congestion</div>
                  <div style={{ color: '#38bdf8', marginBottom: 4 }}>// 클라이언트 수신 메시지 포맷 (JSON Payload):</div>
                  <pre>{`{
  "zoneId": "ZONE-IK-01",
  "level": 3,                   // 1: 정상, 2: 관심, 3: 주의, 4: 경계, 5: 심각, 6: 위험
  "value": 52,                  // 밀집도 퍼센트 (0 ~ 100)
  "estimatedVisitors": 1300,    // 추정 체류 인원(명)
  "trend": "increasing",        // 'increasing' | 'stable' | 'decreasing'
  "updatedAt": "2026-10-22T14:50:00Z"
}`}</pre>
                </div>
              </div>

              {/* Module 3: CCTV Stream */}
              <div className="ds-guide-card">
                <div className="ds-guide-card-header">
                  <div className="ds-guide-card-title">
                    <Cctv style={{ width: 16, height: 16, color: '#ef4444' }} />
                    <span>3. CCTV RTSP 영상 스트리밍 게이트웨이 연동</span>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                  지자체 관제망 내의 현장 CCTV 카메라(RTSP 프로토콜)는 웹 브라우저에서 직접 재생할 수 없으므로, 백엔드 경량 미디어 서버(예: <strong>MediaMTX</strong> 또는 <strong>go2rtc</strong>)를 두어 <code>WebRTC</code> 또는 <code>HLS(m3u8)</code>로 실시간 트랜스코딩하여 제공해야 합니다.
                </p>
                <div className="ds-code-block" style={{ color: '#94a3b8' }}>
                  <div>• 스트리밍 URL 형식: <code>http://[미디어서버]:8888/live/&#123;zoneId&#125;/index.m3u8</code></div>
                  <div>• 프론트 연동 컴포넌트: <code>src/components/CctvModal.tsx</code>의 <code>&lt;video&gt;</code> 또는 HLS.js 플레이어와 즉시 연동 가능</div>
                </div>
              </div>

              {/* Module 4: DB Schema */}
              <div className="ds-guide-card">
                <div className="ds-guide-card-title">
                  <Database style={{ width: 16, height: 16, color: '#10b981' }} />
                  <span>4. 추천 데이터베이스(DB) 구성: PostgreSQL + PostGIS</span>
                </div>
                <ul className="ds-guide-list">
                  <li className="ds-guide-list-item">
                    <span className="ds-guide-list-dot" />
                    <div><strong>PostgreSQL + PostGIS 확장</strong>: 원형 반경 버퍼(<code>ST_Buffer</code>), 다각형 중심점(<code>ST_Centroid</code>), 포함 여부(<code>ST_Contains</code>) 등 지리 연산 처리</div>
                  </li>
                  <li className="ds-guide-list-item">
                    <span className="ds-guide-list-dot" />
                    <div><strong>TimescaleDB / Redis</strong>: 초 단위로 수집되는 스캐너 인파 계수 시계열(Time-Series) 데이터 저장 및 최신 혼잡도 인메모리 캐싱</div>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: 폐쇄망 타일 서버 호스팅 */}
          {activeTab === 'tileserver' && (
            <div className="flex flex-col gap-4">
              <div className="ds-guide-hero purple">
                <div className="ds-guide-hero-title">
                  <Terminal style={{ width: 18, height: 18, color: '#a855f7' }} />
                  <span>폐쇄망 온프레미스 타일 서버 구축 (Docker TileServer GL)</span>
                </div>
                <p className="ds-guide-hero-desc">
                  인터넷이 없는 서버실 환경에서 1개 Docker 컨테이너 구동만으로 대한민국/서울 전역 벡터 지도를 즉시 서빙하는 방법입니다.
                </p>
              </div>

              <div className="ds-guide-card">
                <div className="ds-guide-card-header">
                  <div className="ds-guide-card-title">
                    <span>Step 1. 내장 패키지(tileserver/) Docker 원클릭 구동</span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        'docker-cmd',
                        `cd tileserver\ndocker compose up -d`
                      )
                    }
                    className="ds-btn ds-btn-secondary ds-btn-xs"
                  >
                    {copiedId === 'docker-cmd' ? <Check style={{ width: 14, height: 14, color: '#10b981' }} /> : <Copy style={{ width: 14, height: 14 }} />}
                    <span>명령어 복사</span>
                  </button>
                </div>
                <div className="ds-code-block">
                  <pre>{`# 1. 외부망 PC에서 MBTiles 다운로드 (배치 스크립트 실행)
tileserver/download-mbtiles.bat

# 2. 폐쇄망 서버로 tileserver/ 폴더 반입 후 백그라운드 구동
cd tileserver
docker compose up -d

# 3. 서비스 정상 가동 확인 (포트 8080)
curl http://localhost:8080/health
# 브라우저 확인: http://localhost:8080/styles/jongno-dark/`}</pre>
                </div>
              </div>

              <div className="ds-guide-card">
                <div className="ds-guide-card-title">
                  <span>Step 2. 종로구 전용 관제 스타일 (jongno-dark) & Nginx 연동</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ds-text-secondary)', lineHeight: 1.55 }}>
                  <code>tileserver/data/styles/jongno-dark/style.json</code>은 <strong>상업시설(음식점/카페/쇼핑) 및 버스정류장 POI를 100% 제거</strong>하고 도로망·수계·녹지만을 명확하게 강조한 관제 최적화 스타일입니다.
                </p>
                <div className="ds-code-block">
                  <div style={{ color: '#64748b', marginBottom: 4 }}># Nginx 리버스 프록시 연동 예시 (/tiles 경로 포워딩):</div>
                  <pre>{`location /tiles/ {
    proxy_pass http://localhost:8080/data/v3/;
    proxy_set_header Host $host;
    proxy_cache_valid 200 30d;
}`}</pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
