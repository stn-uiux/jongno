import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Cctv,
  Maximize2,
  Minimize2,
  Camera,
  Radio,
  Volume2,
  Eye,
  EyeOff,
  Flame,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  TrendingUp,
} from 'lucide-react';
import { ZoneData, CongestionData } from '../types';
import { CONGESTION_LEVEL_MAP } from '../utils/constants';
import cctvSampleImage from '../images/cctv.png';
import cctvSampleImage2 from '../images/cctv2.png';
import { ZoneAnalyticsPanel } from './ZoneAnalyticsPanel';

interface CctvModalProps {
  isOpen: boolean;
  onClose: () => void;
  zone: ZoneData | null;
  congestion?: CongestionData;
}

interface SimulatedPedestrian {
  id: number;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  width: number;
  height: number;
  confidence: number;
  color: string;
}

export const CctvModal: React.FC<CctvModalProps> = ({
  isOpen,
  onClose,
  zone,
  congestion,
}) => {
  const [showAiBoxes, setShowAiBoxes] = useState(true);
  const [visionMode, setVisionMode] = useState<'normal' | 'thermal' | 'night'>('normal');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [ptzOffset, setPtzOffset] = useState({ x: 0, y: 0 });
  const [currentTimeStr, setCurrentTimeStr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const pedestriansRef = useRef<SimulatedPedestrian[]>([]);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const cctvImgRef = useRef<HTMLImageElement | null>(null);
  const scannerYRef = useRef<number>(0);

  // 관심 이하는 cctv2.png, 주의 이상은 cctv.png 사용
  const congVal = congestion?.value ?? 65;
  const level = congestion?.level ?? 3;
  const isLowCongestion = level <= 2; // 정상(1), 관심(2)
  const activeImageSrc = isLowCongestion ? cctvSampleImage2 : cctvSampleImage;

  // Preload and switch CCTV sample image based on congestion level
  useEffect(() => {
    const img = new Image();
    img.src = activeImageSrc;
    img.onload = () => {
      cctvImgRef.current = img;
    };
  }, [activeImageSrc]);

  // Time ticker
  useEffect(() => {
    if (!isOpen) return;
    const updateTime = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const str = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} KST`;
      setCurrentTimeStr(str);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Always reset and show trend analytics panel whenever CCTV modal is opened or zone changes
  useEffect(() => {
    if (isOpen) {
      setShowAnalytics(true);
      setPtzOffset({ x: 0, y: 0 });
      setZoomLevel(1.0);
    }
  }, [isOpen, zone?.id]);

  // Sync isFullscreen with native browser fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize and animate pedestrians on canvas over the real CCTV footage
  useEffect(() => {
    if (!isOpen || !zone) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Crowd density drives pedestrian detection count
    const pedestrianCount = isLowCongestion
      ? Math.max(5, Math.min(8, Math.round(congVal * 0.2)))
      : Math.max(14, Math.min(32, Math.round(congVal * 0.35)));

    // Generate initial simulated pedestrians along the sidewalk perspective
    const peds: SimulatedPedestrian[] = [];
    const colors = isLowCongestion
      ? ['#22C55E', '#38BDF8', '#10B981']
      : ['#22C55E', '#3B82F6', '#EAB308', '#F97316', '#EF4444'];

    for (let i = 0; i < pedestrianCount; i++) {
      // Perspective sidewalk range: y from 140 (distant) to 450 (foreground)
      const y = 140 + Math.random() * (canvas.height - 180);
      const progress = (y - 140) / (canvas.height - 180); // 0 (far) ~ 1 (near)
      const depth = 0.25 + progress * 0.75;

      // Sidewalk horizontal bounds:
      // cctv2.png: sidewalk is on the right
      // cctv.png: wide sidewalk across the center
      let minX = 330 - progress * 260;
      let maxX = 660 + progress * 100;
      if (isLowCongestion) {
        minX = 460 - progress * 40;
        maxX = 740 + progress * 130;
      }
      const x = minX + Math.random() * (maxX - minX);

      peds.push({
        id: 2000 + i,
        x,
        y,
        speedX: (Math.random() - 0.48) * (0.15 + progress * 0.35),
        speedY: (Math.random() - 0.5) * 0.15,
        width: 22 * depth,
        height: 52 * depth,
        confidence: 93 + Math.floor(Math.random() * 6),
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    pedestriansRef.current = peds;

    let scanlineOffset = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Draw Real CCTV Image Background (cctv.png)
      const img = cctvImgRef.current;
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();

        // Apply authentic vision mode filters
        if (visionMode === 'thermal') {
          // Thermal heatmap spectrum
          ctx.filter = 'invert(1) hue-rotate(185deg) saturate(2.4) contrast(1.6) brightness(0.95)';
        } else if (visionMode === 'night') {
          // Night vision green phosphor tint
          ctx.filter = 'brightness(1.1) contrast(1.4) sepia(0.85) hue-rotate(85deg) saturate(2.2)';
        } else {
          ctx.filter = 'none';
        }

        // Apply PTZ and zoom transforms
        ctx.translate(w / 2 + ptzOffset.x, h / 2 + ptzOffset.y);
        ctx.scale(zoomLevel, zoomLevel);

        // Preserve aspect ratio when drawing
        const imgAspect = img.naturalWidth && img.naturalHeight
          ? img.naturalWidth / img.naturalHeight
          : 16 / 9;
        let drawW = w;
        let drawH = w / imgAspect;
        if (drawH > h) {
          drawH = h;
          drawW = h * imgAspect;
        }

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();
      } else {
        // Fallback gradient while image is loading
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0F172A');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // 2. Render AI Crowd Bounding Boxes & Target Reticles
      pedestriansRef.current.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        // Sidewalk perspective wrapping
        if (p.x < 40) p.x = w - 100;
        if (p.x > w - 80) p.x = 60;
        if (p.y < 130) p.y = h - 35;
        if (p.y > h - 30) p.y = 145;

        const screenX = (p.x - w / 2) * zoomLevel + w / 2 + ptzOffset.x;
        const screenY = (p.y - h / 2) * zoomLevel + h / 2 + ptzOffset.y;
        const screenW = p.width * zoomLevel;
        const screenH = p.height * zoomLevel;

        if (screenX + screenW < 0 || screenX > w || screenY + screenH < 0 || screenY > h) return;

        // AI Bounding Box & Target Corners
        if (showAiBoxes) {
          ctx.save();
          const boxColor = visionMode === 'night' ? '#4ADE80' : visionMode === 'thermal' ? '#F43F5E' : '#38BDF8';
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1.5;

          const cornerLen = Math.min(8, screenW * 0.4);

          // Top-left
          ctx.beginPath();
          ctx.moveTo(screenX, screenY + cornerLen);
          ctx.lineTo(screenX, screenY);
          ctx.lineTo(screenX + cornerLen, screenY);
          ctx.stroke();

          // Top-right
          ctx.beginPath();
          ctx.moveTo(screenX + screenW - cornerLen, screenY);
          ctx.lineTo(screenX + screenW, screenY);
          ctx.lineTo(screenX + screenW, screenY + cornerLen);
          ctx.stroke();

          // Bottom-left
          ctx.beginPath();
          ctx.moveTo(screenX, screenY + screenH - cornerLen);
          ctx.lineTo(screenX, screenY + screenH);
          ctx.lineTo(screenX + cornerLen, screenY + screenH);
          ctx.stroke();

          // Bottom-right
          ctx.beginPath();
          ctx.moveTo(screenX + screenW - cornerLen, screenY + screenH);
          ctx.lineTo(screenX + screenW, screenY + screenH);
          ctx.lineTo(screenX + screenW, screenY + screenH - cornerLen);
          ctx.stroke();

          // AI Tag above box
          ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
          ctx.fillRect(screenX - 1, screenY - 14, Math.max(58, screenW + 4), 12);

          ctx.fillStyle = boxColor;
          ctx.font = 'bold 8.5px monospace';
          ctx.fillText(`PED ${p.confidence}%`, screenX + 2, screenY - 4);

          ctx.restore();
        }
      });

      // 3. Vertical AI Radar / Scanner Sweep Line
      scannerYRef.current = (scannerYRef.current + 2.2) % (h + 30);
      ctx.save();
      const currentY = scannerYRef.current;
      const sweepGrad = ctx.createLinearGradient(0, currentY - 20, 0, currentY);
      sweepGrad.addColorStop(0, 'transparent');
      sweepGrad.addColorStop(
        1,
        visionMode === 'night'
          ? 'rgba(74, 222, 128, 0.22)'
          : visionMode === 'thermal'
            ? 'rgba(244, 63, 94, 0.22)'
            : 'rgba(56, 189, 248, 0.22)'
      );
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(0, Math.max(0, currentY - 20), w, 20);

      ctx.strokeStyle =
        visionMode === 'night'
          ? 'rgba(74, 222, 128, 0.75)'
          : visionMode === 'thermal'
            ? 'rgba(244, 63, 94, 0.75)'
            : 'rgba(56, 189, 248, 0.75)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, currentY);
      ctx.lineTo(w, currentY);
      ctx.stroke();
      ctx.restore();

      // 4. Subtle CCTV Scanlines
      scanlineOffset = (scanlineOffset + 1) % 4;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      for (let y = scanlineOffset; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1.5);
      }
      ctx.restore();

      // 5. Camera Center Crosshair
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      const cx = w / 2;
      const cy = h / 2;
      ctx.beginPath();
      ctx.moveTo(cx - 20, cy);
      ctx.lineTo(cx - 6, cy);
      ctx.moveTo(cx + 6, cy);
      ctx.lineTo(cx + 20, cy);
      ctx.moveTo(cx, cy - 20);
      ctx.lineTo(cx, cy - 6);
      ctx.moveTo(cx, cy + 6);
      ctx.lineTo(cx, cy + 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, zone, congestion, showAiBoxes, visionMode, zoomLevel, ptzOffset]);

  if (!isOpen || !zone) return null;

  const levelInfo = CONGESTION_LEVEL_MAP[level];
  const visitors = congestion?.estimatedVisitors ?? Math.round(((zone.capacity || 3000) * congVal) / 100);

  const handleSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `CCTV_${zone.id}_${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('CCTV 실시간 스냅샷이 다운로드되었습니다.');
    } catch {
      showToast('스냅샷 캡처가 완료되었습니다.');
    }
  };

  const handleBroadcast = () => {
    showToast(`📢 [비상 방송] ${zone.name} 구역에 인파 분산 안내 방송을 송출했습니다.`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePtzMove = (dx: number, dy: number) => {
    setPtzOffset((prev) => ({
      x: Math.max(-140, Math.min(140, prev.x + dx)),
      y: Math.max(-90, Math.min(90, prev.y + dy)),
    }));
  };

  const handleResetPtz = () => {
    setPtzOffset({ x: 0, y: 0 });
    setZoomLevel(1.0);
  };

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      const elem = modalRef.current || document.documentElement;
      if (elem && elem.requestFullscreen) {
        elem.requestFullscreen().catch(() => {});
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleClose = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
    onClose();
  };

  const displayTitle = zone.scannerName
    ? (zone.scannerName.startsWith('CCTV') ? zone.scannerName : `CCTV ${zone.scannerName}`)
    : (zone.name.startsWith('CCTV') ? zone.name : `CCTV ${zone.name}`);

  return (
    <div className={`ds-modal-backdrop ${isFullscreen ? 'fullscreen' : ''}`}>
      <div
        ref={modalRef}
        className={`ds-modal-dialog ds-modal-cctv ${isFullscreen ? 'fullscreen ds-modal-dialog-fullscreen' : ''} ${!showAnalytics ? 'no-analytics' : ''}`}
      >
        {/* [공통 모달 헤더] ds-modal-header 및 ds-modal-title-row 기반 */}
        <div className="ds-modal-header ds-modal-header-cctv">
          {/* Left: CCTV & Zone Identity with Congestion Status */}
          <div className="ds-modal-title-row ds-cctv-header-identity">
            <div className="ds-header-logo-box ds-header-logo-box-cctv">
              <Cctv style={{ width: 20, height: 20 }} />
            </div>

            <div className="ds-cctv-header-text-group">
              <div className="ds-cctv-header-meta-row">
                <h3 className="ds-cctv-header-title">
                  {displayTitle}
                </h3>
                {zone.areaName && (
                  <span className="ds-area-tag">
                    {zone.areaName}
                  </span>
                )}
                <span className="ds-live-tag">
                  <span className="ds-live-pulse-dot" />
                  <span>LIVE</span>
                </span>

                {/* Level Badge with Alert Icon */}
                <span className={`ds-badge ds-badge-sm ds-badge-lvl-${level} ds-cctv-header-level-badge`}>
                  <span className={`ds-lvl-dot ds-lvl-dot-${level}`} style={{ width: 6, height: 6 }} />
                  <span>{levelInfo.name}</span>
                </span>

                {/* Live Density & Estimated Visitors */}
                <span className="ds-cctv-header-metrics">
                  {congVal}% <span className="ds-cctv-header-metrics-sub">({visitors.toLocaleString()}명)</span>
                </span>
              </div>

              <p className="ds-cctv-header-desc">
                {zone.id} · {zone.description || '스마트 인파 안전 관제 스캐너 연동 영상'}
              </p>
            </div>
          </div>

          {/* Right: Window Controls (단일 닫기 버튼 포함) */}
          <div className="ds-cctv-header-actions">
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              title={showAnalytics ? '추이 분석 패널 접기' : '추이 분석 패널 펼치기'}
              className={`ds-btn ds-btn-sm ${showAnalytics ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
            >
              <TrendingUp style={{ width: 14, height: 14 }} />
              <span>추이 분석</span>
            </button>

            <button
              type="button"
              onClick={handleToggleFullscreen}
              title={isFullscreen ? '창 모드로 복귀' : '전체화면'}
              className="ds-btn-icon"
            >
              {isFullscreen ? <Minimize2 style={{ width: 16, height: 16 }} /> : <Maximize2 style={{ width: 16, height: 16 }} />}
            </button>

            <button
              type="button"
              onClick={handleClose}
              title="닫기 (Esc)"
              className="ds-btn-icon ds-cctv-close-btn"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Modal Content Body: CCTV Video on Left, Trend Analytics Panel on Right */}
        <div className="ds-modal-body ds-cctv-body p-0">
          {/* Left Side: CCTV Live Video Feed & PTZ Controls */}
          <div className="ds-cctv-video-pane">
            {/* Video Canvas Container (16:9 Viewport & Aspect Ratio Preservation) */}
            <div className="ds-cctv-stage-container">
              <div className="ds-cctv-video-stage">
                <canvas
                  ref={canvasRef}
                  width={1024}
                  height={576}
                  className="ds-cctv-canvas"
                />

                {/* CCTV OSD Overlay (On-Screen Display - 60% Translucent Dark Cards & Generous Padding) */}
                <div className="ds-cctv-osd-overlay">
                  {/* Top OSD Bar */}
                  <div className="ds-cctv-osd-row ds-cctv-osd-row-top">
                    <div className="ds-cctv-osd-badge ds-cctv-osd-top-left">
                      <div className="ds-cctv-osd-cam-title">
                        <Radio style={{ width: 14, height: 14 }} className="animate-pulse" />
                        <span>CAM [{zone.id}]</span>
                        <span className="ds-cctv-osd-divider">·</span>
                        <span className="ds-cctv-osd-val-white">{zone.name}</span>
                      </div>
                      <div className="ds-cctv-osd-coords">
                        LAT: {zone.center.lat.toFixed(6)} | LNG: {zone.center.lng.toFixed(6)}
                      </div>
                    </div>

                    <div className="ds-cctv-osd-badge ds-cctv-osd-top-right">
                      <div className="ds-cctv-osd-rec">
                        <span className="ds-cctv-osd-rec-dot" />
                        <span>REC ● 4K UHD</span>
                      </div>
                      <div className="ds-cctv-osd-time">{currentTimeStr}</div>
                    </div>
                  </div>

                  {/* Bottom OSD Bar */}
                  <div className="ds-cctv-osd-row ds-cctv-osd-row-bottom">
                    {/* Bottom-Left Real-time Density & AI Analytics Info Card */}
                    <div className="ds-cctv-osd-badge ds-cctv-osd-bottom-left">
                      <div className="ds-cctv-osd-density-row">
                        <span className="ds-cctv-osd-label">실시간 밀집도:</span>
                        <span
                          className="ds-cctv-osd-density-badge"
                          style={{
                            backgroundColor: `${levelInfo.color}33`,
                            color: levelInfo.color,
                            border: `1px solid ${levelInfo.color}88`,
                          }}
                        >
                          {congVal}% ({levelInfo.name})
                        </span>
                      </div>
                      <div className="ds-cctv-osd-info-row">
                        <span className="ds-cctv-osd-label">추정 인원:</span>
                        <span className="ds-cctv-osd-val-white">{visitors.toLocaleString()}명</span>
                        <span className="ds-cctv-osd-divider">|</span>
                        <span className="ds-cctv-osd-label">AI 검출 신뢰도:</span>
                        <span className="ds-cctv-osd-val-blue">98.4%</span>
                      </div>
                    </div>

                    <div className="ds-cctv-osd-badge ds-cctv-osd-bottom-right">
                      <div>AI CROWD VISION v3.4</div>
                      <div className="ds-cctv-osd-telemetry">
                        ZOOM: {zoomLevel.toFixed(1)}x | PTZ: [{ptzOffset.x > 0 ? `+${ptzOffset.x}` : ptzOffset.x},{' '}
                        {ptzOffset.y > 0 ? `+${ptzOffset.y}` : ptzOffset.y}]
                      </div>
                    </div>
                  </div>
                </div>

                {/* Toast Notification */}
                {toastMessage && (
                  <div className="ds-cctv-toast">
                    {toastMessage}
                  </div>
                )}
              </div>
            </div>

            {/* CCTV Bottom Controls & Quick Telemetry Toolbar */}
            <div className="ds-cctv-toolbar">
              {/* Left: Mode Toggles */}
              <div className="ds-cctv-btn-group">
                {/* AI Bounding Box Toggle */}
                <button
                  type="button"
                  onClick={() => setShowAiBoxes(!showAiBoxes)}
                  className={`ds-cctv-tool-btn ${showAiBoxes ? 'active' : ''}`}
                >
                  {showAiBoxes ? <Eye style={{ width: 14, height: 14 }} /> : <EyeOff style={{ width: 14, height: 14 }} />}
                  <span>AI 군중 바운딩박스</span>
                </button>

                {/* Vision Modes */}
                <div className="ds-cctv-vision-switch">
                  <button
                    type="button"
                    onClick={() => setVisionMode('normal')}
                    className={`ds-cctv-vision-btn ${visionMode === 'normal' ? 'active-normal' : ''}`}
                  >
                    일반
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisionMode('night')}
                    className={`ds-cctv-vision-btn ${visionMode === 'night' ? 'active-night' : ''}`}
                  >
                    야간투시
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisionMode('thermal')}
                    className={`ds-cctv-vision-btn ${visionMode === 'thermal' ? 'active-thermal' : ''}`}
                  >
                    <Flame style={{ width: 12, height: 12, color: '#f472b6' }} />
                    <span>열화상</span>
                  </button>
                </div>
              </div>

              {/* Center: Simulated PTZ Controls */}
              <div className="ds-cctv-ptz-bar">
                <span className="ds-cctv-ptz-label">PTZ</span>
                <button
                  type="button"
                  onClick={() => handlePtzMove(-20, 0)}
                  title="좌측 팬"
                  className="ds-cctv-ptz-btn"
                >
                  <ChevronLeft style={{ width: 14, height: 14 }} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePtzMove(0, -15)}
                  title="상단 틸트"
                  className="ds-cctv-ptz-btn"
                >
                  <ChevronUp style={{ width: 14, height: 14 }} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePtzMove(0, 15)}
                  title="하단 틸트"
                  className="ds-cctv-ptz-btn"
                >
                  <ChevronDown style={{ width: 14, height: 14 }} />
                </button>
                <button
                  type="button"
                  onClick={() => handlePtzMove(20, 0)}
                  title="우측 팬"
                  className="ds-cctv-ptz-btn"
                >
                  <ChevronRight style={{ width: 14, height: 14 }} />
                </button>
                <div className="ds-cctv-ptz-divider" />
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
                  title="줌인"
                  className="ds-cctv-ptz-btn"
                >
                  <ZoomIn style={{ width: 14, height: 14 }} />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
                  title="줌아웃"
                  className="ds-cctv-ptz-btn"
                >
                  <ZoomOut style={{ width: 14, height: 14 }} />
                </button>
                <button
                  type="button"
                  onClick={handleResetPtz}
                  title="PTZ 위치 및 줌 리셋"
                  className="ds-cctv-ptz-btn"
                >
                  <RefreshCw style={{ width: 12, height: 12 }} />
                </button>
              </div>

              {/* Right: Actions */}
              <div className="ds-cctv-btn-group">
                <button
                  type="button"
                  onClick={handleSnapshot}
                  title="현재 프레임 스냅샷 저장"
                  className="ds-cctv-action-btn snapshot"
                >
                  <Camera style={{ width: 14, height: 14, color: '#60a5fa' }} />
                  <span>스냅샷</span>
                </button>

                <button
                  type="button"
                  onClick={handleBroadcast}
                  title="현장 스피커 비상 분산 방송 송출"
                  className="ds-cctv-action-btn broadcast"
                >
                  <Volume2 style={{ width: 14, height: 14, color: '#fbbf24' }} />
                  <span>안내 방송</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Side: Selected Zone Analytics Panel (CCTV 모달 내부 추이분석 영역) */}
          {showAnalytics && (
            <div className="ds-cctv-analytics-pane">
              <ZoneAnalyticsPanel zone={zone} congestion={congestion} hideHeader={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
