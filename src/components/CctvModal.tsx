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

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
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

        ctx.drawImage(img, -w / 2, -h / 2, w, h);
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

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xs select-none ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div
        ref={modalRef}
        className={`bg-[#0B132B] flex flex-col overflow-hidden text-neutral-100 transition-all ${
          isFullscreen
            ? 'w-screen h-screen rounded-none border-none'
            : showAnalytics
              ? 'w-full max-w-[1400px] max-h-[94vh] rounded-2xl border border-neutral-700/80 shadow-2xl'
              : 'w-full max-w-4xl max-h-[92vh] rounded-2xl border border-neutral-700/80 shadow-2xl'
        }`}
      >
        {/* [단일 통합 헤더] 전체 모달 상단에 하나로 통합된 프리미엄 헤더 */}
        <div className="px-5 py-3 bg-[#080E1E] border-b border-white/10 flex items-center justify-between gap-4 shrink-0">
          {/* Left: CCTV & Zone Identity with Congestion Status */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Cctv className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  {zone.scannerName || `CCTV ${zone.name}`}
                </h3>
                {zone.areaName && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-neutral-200 border border-white/10">
                    {zone.areaName}
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950/80 text-red-400 border border-red-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span>LIVE</span>
                </span>

                {/* Level Badge with Alert Icon */}
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border shrink-0"
                  style={{
                    backgroundColor: levelInfo.bgLight,
                    color: levelInfo.color,
                    borderColor: levelInfo.borderColor,
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  <span>{levelInfo.name}</span>
                </span>

                {/* Live Density & Estimated Visitors */}
                <span className="text-xs font-mono text-slate-300 font-semibold">
                  {congVal}% <span className="text-slate-400 font-normal">({visitors.toLocaleString()}명)</span>
                </span>
              </div>

              <p className="text-xs text-neutral-400 truncate mt-0.5 font-mono">
                {zone.id} · {zone.description || '스마트 인파 안전 관제 스캐너 연동 영상'}
              </p>
            </div>
          </div>

          {/* Right: Window Controls (단일 닫기 버튼 포함) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowAnalytics(!showAnalytics)}
              title={showAnalytics ? '추이 분석 패널 접기' : '추이 분석 패널 펼치기'}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                showAnalytics
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border-neutral-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
              <span>추이 분석</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? '창 모드로 복귀' : '전체화면'}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-neutral-700"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              title="닫기 (Esc)"
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-500/30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Content Body: CCTV Video on Left, Trend Analytics Panel on Right */}
        <div className="flex-1 min-h-0 flex flex-col xl:flex-row overflow-hidden">
          {/* Left Side: CCTV Live Video Feed & PTZ Controls */}
          <div className="flex-1 min-w-0 flex flex-col border-b xl:border-b-0 xl:border-r border-neutral-800 bg-black">

        {/* Video Canvas Container (16:9) */}
        <div className="relative flex-1 min-h-0 w-full h-full bg-black flex items-center justify-center overflow-hidden">
          <canvas
            ref={canvasRef}
            width={860}
            height={484}
            className={`w-full h-full object-contain aspect-video transition-all duration-200 ${
              isFullscreen ? 'max-h-full max-w-full' : 'max-h-[58vh]'
            }`}
          />

          {/* CCTV OSD Overlay (On-Screen Display) */}
          <div className="absolute inset-0 pointer-events-none p-3.5 flex flex-col justify-between font-mono text-[11px] text-white">
            {/* Top OSD Bar */}
            <div className="flex items-start justify-between">
              <div className="space-y-0.5 bg-black/60 backdrop-blur-2xs px-2.5 py-1.5 rounded border border-white/10">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>CAM [{zone.id}]</span>
                  <span className="text-white/60">·</span>
                  <span className="text-white">{zone.name}</span>
                </div>
                <div className="text-[10px] text-neutral-300">
                  LAT: {zone.center.lat.toFixed(6)} | LNG: {zone.center.lng.toFixed(6)}
                </div>
              </div>

              <div className="text-right space-y-0.5 bg-black/60 backdrop-blur-2xs px-2.5 py-1.5 rounded border border-white/10">
                <div className="font-bold text-red-400 flex items-center justify-end gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span>REC ● 4K UHD</span>
                </div>
                <div className="text-[10px] text-neutral-300">{currentTimeStr}</div>
              </div>
            </div>

            {/* Bottom OSD Bar */}
            <div className="flex items-end justify-between">
              <div className="space-y-1 bg-black/65 backdrop-blur-2xs px-3 py-2 rounded-lg border border-white/15 max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400 text-[10px]">실시간 밀집도:</span>
                  <span
                    className="font-bold text-xs px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${levelInfo.color}33`, color: levelInfo.color }}
                  >
                    {congVal}% ({levelInfo.name})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-neutral-300">
                  <span>추정 인원:</span>
                  <span className="font-bold text-white font-mono">{visitors.toLocaleString()}명</span>
                  <span className="text-neutral-500">|</span>
                  <span>AI 검출 신뢰도: 98.4%</span>
                </div>
              </div>

              <div className="text-right bg-black/60 backdrop-blur-2xs px-2.5 py-1.5 rounded border border-white/10 text-[10px] text-neutral-400">
                <div>AI CROWD VISION v3.4</div>
                <div className="text-neutral-300 font-mono">
                  ZOOM: {zoomLevel.toFixed(1)}x | PTZ: [{ptzOffset.x > 0 ? `+${ptzOffset.x}` : ptzOffset.x},{' '}
                  {ptzOffset.y > 0 ? `+${ptzOffset.y}` : ptzOffset.y}]
                </div>
              </div>
            </div>
          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 px-4 py-2 bg-neutral-900/95 text-white border border-blue-500 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in zoom-in-95 pointer-events-none">
              {toastMessage}
            </div>
          )}
        </div>

        {/* CCTV Bottom Controls & Quick Telemetry Toolbar */}
        <div className="p-3 bg-neutral-900 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Mode Toggles */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* AI Bounding Box Toggle */}
            <button
              type="button"
              onClick={() => setShowAiBoxes(!showAiBoxes)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                showAiBoxes
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-400'
                  : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white'
              }`}
            >
              {showAiBoxes ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>AI 군중 바운딩박스</span>
            </button>

            {/* Vision Modes */}
            <div className="flex items-center p-0.5 bg-neutral-800 rounded-lg border border-neutral-700">
              <button
                type="button"
                onClick={() => setVisionMode('normal')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  visionMode === 'normal'
                    ? 'bg-neutral-700 text-white font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                일반
              </button>
              <button
                type="button"
                onClick={() => setVisionMode('night')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  visionMode === 'night'
                    ? 'bg-emerald-800/80 text-emerald-200 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                야간투시
              </button>
              <button
                type="button"
                onClick={() => setVisionMode('thermal')}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer ${
                  visionMode === 'thermal'
                    ? 'bg-pink-900/80 text-pink-200 font-bold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Flame className="w-3 h-3 text-pink-400" />
                <span>열화상</span>
              </button>
            </div>
          </div>

          {/* Center: Simulated PTZ Controls */}
          <div className="flex items-center gap-1 bg-neutral-800/70 p-1 rounded-lg border border-neutral-700">
            <span className="text-[10px] text-neutral-400 px-1 font-mono font-bold">PTZ</span>
            <button
              type="button"
              onClick={() => handlePtzMove(-20, 0)}
              title="좌측 팬"
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePtzMove(0, -15)}
              title="상단 틸트"
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePtzMove(0, 15)}
              title="하단 틸트"
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handlePtzMove(20, 0)}
              title="우측 팬"
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-neutral-700 mx-0.5" />
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.5, +(z + 0.2).toFixed(1)))}
              title="줌인"
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.8, +(z - 0.2).toFixed(1)))}
              title="줌아웃"
              className="p-1 hover:bg-neutral-700 rounded text-neutral-300 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetPtz}
              title="PTZ 위치 및 줌 리셋"
              className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSnapshot}
              title="현재 프레임 스냅샷 저장"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg border border-neutral-700 text-xs font-medium transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span>스냅샷</span>
            </button>

            <button
              type="button"
              onClick={handleBroadcast}
              title="현장 스피커 비상 분산 방송 송출"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded-lg border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>안내 방송</span>
            </button>
          </div>
        </div>
      </div>

        {/* Right Side: Selected Zone Analytics Panel (CCTV 모달 내부 추이분석 영역) */}
        {showAnalytics && (
          <div className="w-full xl:w-[490px] 2xl:w-[520px] flex flex-col shrink-0 bg-[#0D1527] overflow-hidden border-t xl:border-t-0 xl:border-l border-white/10">
            <ZoneAnalyticsPanel zone={zone} congestion={congestion} hideHeader={true} />
          </div>
        )}
      </div>
    </div>
  </div>
  );
};
