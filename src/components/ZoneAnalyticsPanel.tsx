import React, { useState, useRef, useMemo } from 'react';
import {
  AlertTriangle,
  Calendar,
  Clock,
  User,
  Copy,
  Check,
  TrendingUp,
  History,
  ShieldAlert,
  ChevronRight,
  X,
  Sparkles,
} from 'lucide-react';
import { ZoneData, CongestionData } from '../types';
import { CONGESTION_LEVEL_MAP } from '../utils/constants';
import { ToggleSwitch } from './ui/ToggleSwitch';

interface ZoneAnalyticsPanelProps {
  zone: ZoneData;
  congestion?: CongestionData;
  onClose?: () => void;
  hideHeader?: boolean;
}

interface IncidentRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  timeRange: string;
  duration: string;
  level: 5 | 6;
  peakDensity: number;
  peakDensityM2: number;
  peakVisitors: number;
  cause: string;
  actionTaken: string;
}

interface TimeSeriesPoint {
  id: number;
  dateStr: string;
  time: string;
  fullLabel: string;
  timestamp: number;
  // Actual observations (실측치)
  density: number;
  visitors: number;
  type: 'past' | 'current' | 'forecast';

  // AI Model Prediction values across past (backtest) + future (forecast) (Prophet style)
  predDensity: number;
  predDensityUpper: number;
  predDensityLower: number;

  predVisitors: number;
  predVisitorsUpper: number;
  predVisitorsLower: number;
}

export const ZoneAnalyticsPanel: React.FC<ZoneAnalyticsPanelProps> = ({
  zone,
  congestion,
  onClose,
  hideHeader = false,
}) => {
  const [activeTab, setActiveTab] = useState<'chart' | 'history'>('chart');
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);

  // User toggle for AI Forecast (사용자 선택 토글: 표출 / 미표출)
  const [showForecast, setShowForecast] = useState<boolean>(true);

  // Range scrubber window: percentage [start, end] from 0 to 100
  const [rangeStart, setRangeStart] = useState<number>(38); // default ~ recent 28 hours to forecast
  const [rangeEnd, setRangeEnd] = useState<number>(95);

  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const dragActionRef = useRef<'start' | 'end' | 'window' | null>(null);
  const dragStartXRef = useRef<number>(0);
  const initialRangeRef = useRef<{ start: number; end: number }>({ start: 38, end: 95 });

  const congVal = congestion?.value ?? 65;
  const level = congestion?.level ?? 3;
  const levelInfo = CONGESTION_LEVEL_MAP[level];
  const visitors = congestion?.estimatedVisitors ?? Math.round(((zone.capacity || 3000) * congVal) / 100);

  // Generate 72-hour full baseline time-series (3 days) + 8-hour future forecast
  // Includes past model predictions + confidence intervals (Prophet style backtesting)
  const fullTimeSeriesData: TimeSeriesPoint[] = useMemo(() => {
    const points: TimeSeriesPoint[] = [];
    const capacity = zone.capacity || 3000;

    // Day 1 (10.20), Day 2 (10.21), Day 3 (10.22 Today)
    const dates = [
      { date: '10.20', day: '월' },
      { date: '10.21', day: '화' },
      { date: '10.22', day: '오늘' },
    ];

    const hours = ['01:00', '05:00', '09:00', '13:00', '17:00', '21:00'];
    let id = 1;

    dates.forEach((d, dIdx) => {
      hours.forEach((h, hIdx) => {
        const hourNum = parseInt(h.split(':')[0], 10);

        // 1. Density diurnal pattern (인파 밀집도 %: 순간 유동량)
        let densityRatio = 0.35;
        if (hourNum === 1 || hourNum === 5) densityRatio = 0.16 + (hIdx * 0.03);
        else if (hourNum === 9) densityRatio = 0.58; // 아침 출근 밀집
        else if (hourNum === 13) densityRatio = 0.38;
        else if (hourNum === 17) densityRatio = 0.88; // 퇴근길 피크
        else if (hourNum === 21) densityRatio = 0.65;

        // Ground-truth actual observation (실측치 with natural fluctuation)
        let actualDensity = Math.round(congVal * densityRatio + (Math.sin(id * 1.4) * 8));
        actualDensity = Math.max(8, Math.min(96, actualDensity));

        // Model smoothed past prediction (Prophet-style fitted curve)
        let predDensity = Math.round(congVal * densityRatio + (Math.sin(id * 1.4) * 3));
        predDensity = Math.max(8, Math.min(96, predDensity));
        const predDensityUpper = Math.min(100, predDensity + 7);
        const predDensityLower = Math.max(0, predDensity - 7);

        // 2. Visitors diurnal pattern (체류인원: 점심/저녁 체류 등 밀집도와 다른 고유 곡선)
        let visitorsRatio = 0.40;
        if (hourNum === 1 || hourNum === 5) visitorsRatio = 0.18;
        else if (hourNum === 9) visitorsRatio = 0.34;
        else if (hourNum === 13) visitorsRatio = 0.68; // 점심시간 체류인원 상승
        else if (hourNum === 17) visitorsRatio = 0.60;
        else if (hourNum === 21) visitorsRatio = 0.78; // 저녁시간 체류인원 피크

        let actualVisitors = Math.round(capacity * ((congVal / 100) * visitorsRatio + 0.12) + (Math.cos(id * 1.1) * (capacity * 0.05)));
        actualVisitors = Math.max(Math.round(capacity * 0.08), Math.min(Math.round(capacity * 0.95), actualVisitors));

        // Model smoothed past prediction for visitors
        let predVisitors = Math.round(capacity * ((congVal / 100) * visitorsRatio + 0.12) + (Math.cos(id * 1.1) * (capacity * 0.02)));
        predVisitors = Math.max(Math.round(capacity * 0.08), Math.min(Math.round(capacity * 0.95), predVisitors));
        const predVisitorsUpper = Math.min(capacity, predVisitors + Math.round(capacity * 0.07));
        const predVisitorsLower = Math.max(0, predVisitors - Math.round(capacity * 0.07));

        points.push({
          id: id++,
          dateStr: d.date,
          time: h,
          fullLabel: `${d.date} ${h}`,
          timestamp: Date.now() - (3 - dIdx) * 86400000 + hourNum * 3600000,
          density: actualDensity,
          visitors: actualVisitors,
          type: 'past',
          predDensity,
          predDensityUpper,
          predDensityLower,
          predVisitors,
          predVisitorsUpper,
          predVisitorsLower,
        });
      });
    });

    // Current Live Point (10.22 16:30 실시간)
    const currentPoint: TimeSeriesPoint = {
      id: id++,
      dateStr: '10.22',
      time: '16:30',
      fullLabel: '10.22 16:30 (실시간)',
      timestamp: Date.now(),
      density: congVal,
      visitors: visitors,
      type: 'current',
      predDensity: congVal,
      predDensityUpper: Math.min(100, congVal + 7),
      predDensityLower: Math.max(0, congVal - 7),
      predVisitors: visitors,
      predVisitorsUpper: Math.min(capacity, visitors + Math.round(capacity * 0.07)),
      predVisitorsLower: Math.max(0, visitors - Math.round(capacity * 0.07)),
    };
    points.push(currentPoint);

    // AI Forecast Horizon Steps (Qlik/Prophet style forward forecasting with expanding confidence band)
    const forecastSteps = [
      { time: '18:00', deltaDensity: 1.14, deltaVisitors: 1.06, uncertaintyD: 8, uncertaintyV: 0.08 },
      { time: '20:00', deltaDensity: 1.25, deltaVisitors: 1.18, uncertaintyD: 12, uncertaintyV: 0.12 },
      { time: '22:00', deltaDensity: 0.92, deltaVisitors: 1.08, uncertaintyD: 15, uncertaintyV: 0.15 },
      { time: '24:00', deltaDensity: 0.65, deltaVisitors: 0.72, uncertaintyD: 18, uncertaintyV: 0.18 },
    ];

    forecastSteps.forEach((fs, i) => {
      const predDensity = Math.max(12, Math.min(98, Math.round(congVal * fs.deltaDensity)));
      const predVisitors = Math.max(
        Math.round(capacity * 0.1),
        Math.min(Math.round(capacity * 0.95), Math.round(visitors * fs.deltaVisitors))
      );
      const upperD = Math.min(100, predDensity + fs.uncertaintyD);
      const lowerD = Math.max(5, predDensity - fs.uncertaintyD);

      const upperV = Math.min(capacity, predVisitors + Math.round(capacity * fs.uncertaintyV));
      const lowerV = Math.max(0, predVisitors - Math.round(capacity * fs.uncertaintyV));

      points.push({
        id: id++,
        dateStr: '10.22',
        time: fs.time,
        fullLabel: `예측 ${fs.time} (+${(i + 1) * 2}h)`,
        timestamp: Date.now() + (i + 1) * 7200000,
        density: predDensity,
        visitors: predVisitors,
        type: 'forecast',
        predDensity,
        predDensityUpper: upperD,
        predDensityLower: lowerD,
        predVisitors,
        predVisitorsUpper: upperV,
        predVisitorsLower: lowerV,
      });
    });

    return points;
  }, [zone.id, zone.capacity, congVal, visitors]);

  // Sliced data based on the interactive scrubber range [rangeStart, rangeEnd]
  const slicedData = useMemo(() => {
    const total = fullTimeSeriesData.length;
    const startIdx = Math.max(0, Math.floor((rangeStart / 100) * (total - 1)));
    const endIdx = Math.min(total - 1, Math.ceil((rangeEnd / 100) * (total - 1)));
    const sliced = fullTimeSeriesData.slice(startIdx, endIdx + 1);
    return sliced.length >= 3 ? sliced : fullTimeSeriesData.slice(Math.max(0, total - 6));
  }, [fullTimeSeriesData, rangeStart, rangeEnd]);

  // Critical incident history records
  const criticalIncidents: IncidentRecord[] = useMemo(() => [
    {
      id: 'inc-01',
      date: '2026.10.18',
      dayOfWeek: '일',
      timeRange: '20:30 ~ 22:15',
      duration: '1시간 45분간 지속',
      level: 6,
      peakDensity: 94,
      peakDensityM2: 3.42,
      peakVisitors: Math.round((zone.capacity || 3000) * 0.94),
      cause: '주말 야간 축제 인파 일시 병목 및 정체',
      actionTaken: '비상 안내 방송 3회 송출 및 낙원파출소 현장 안전요원 6명 급파 통제 완료',
    },
    {
      id: 'inc-02',
      date: '2026.10.14',
      dayOfWeek: '수',
      timeRange: '19:10 ~ 20:40',
      duration: '1시간 30분간 지속',
      level: 5,
      peakDensity: 88,
      peakDensityM2: 3.12,
      peakVisitors: Math.round((zone.capacity || 3000) * 0.88),
      cause: '퇴근 시간대 인근 전시장 관람객 퇴장 인파 중첩',
      actionTaken: '지하철역 출입구 안전 유도 및 스마트 스캐너 경고 알림 발령',
    },
    {
      id: 'inc-03',
      date: '2026.10.03',
      dayOfWeek: '토',
      timeRange: '21:00 ~ 23:10',
      duration: '2시간 10분간 지속',
      level: 5,
      peakDensity: 86,
      peakDensityM2: 2.95,
      peakVisitors: Math.round((zone.capacity || 3000) * 0.86),
      cause: '개천절 연휴 익선동 골목길 인파 유입 과다',
      actionTaken: '일방통행 보행 통제선 임시 가동 및 보행자 분산 유도',
    },
    {
      id: 'inc-04',
      date: '2026.09.28',
      dayOfWeek: '일',
      timeRange: '18:45 ~ 20:20',
      duration: '1시간 35분간 지속',
      level: 5,
      peakDensity: 84,
      peakDensityM2: 2.88,
      peakVisitors: Math.round((zone.capacity || 3000) * 0.84),
      cause: '거리 공연 관람객 밀집으로 보행 통로 축소',
      actionTaken: '관제센터-현장 순찰조 무전 지시로 공연자 이동 및 보행로 확보',
    },
  ], [zone.capacity]);

  // Handle Dragging in the Range Timeline Scrubber
  const handleScrubberMouseDown = (e: React.MouseEvent, type: 'start' | 'end' | 'window') => {
    e.preventDefault();
    e.stopPropagation();
    dragActionRef.current = type;
    dragStartXRef.current = e.clientX;
    initialRangeRef.current = { start: rangeStart, end: rangeEnd };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragActionRef.current || !scrubberRef.current) return;
      const rect = scrubberRef.current.getBoundingClientRect();
      const deltaX = moveEvent.clientX - dragStartXRef.current;
      const deltaPercent = (deltaX / rect.width) * 100;
      const { start, end } = initialRangeRef.current;

      if (dragActionRef.current === 'start') {
        const newStart = Math.max(0, Math.min(end - 12, start + deltaPercent));
        setRangeStart(+newStart.toFixed(1));
      } else if (dragActionRef.current === 'end') {
        const newEnd = Math.min(100, Math.max(start + 12, end + deltaPercent));
        setRangeEnd(+newEnd.toFixed(1));
      } else if (dragActionRef.current === 'window') {
        const windowWidth = end - start;
        let newStart = start + deltaPercent;
        let newEnd = end + deltaPercent;
        if (newStart < 0) {
          newStart = 0;
          newEnd = windowWidth;
        } else if (newEnd > 100) {
          newEnd = 100;
          newStart = 100 - windowWidth;
        }
        setRangeStart(+newStart.toFixed(1));
        setRangeEnd(+newEnd.toFixed(1));
      }
    };

    const handleMouseUp = () => {
      dragActionRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleCopyPhone = (phone: string) => {
    navigator.clipboard?.writeText(phone);
    setCopiedPhone(phone);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Preset Buttons
  const handlePreset = (type: 'all' | '24h' | 'forecast') => {
    if (type === 'all') {
      setRangeStart(0);
      setRangeEnd(100);
    } else if (type === '24h') {
      setRangeStart(45);
      setRangeEnd(92);
    } else if (type === 'forecast') {
      setRangeStart(65);
      setRangeEnd(100);
    }
  };

  // Main Chart Dimensions & Coordinate Math
  const svgWidth = 470;
  const svgHeight = 200;
  const padLeft = 32;
  const padRight = 32;
  const padTop = 18;
  const padBottom = 28;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  // Sliced points projected to SVG space
  const chartPoints = useMemo(() => {
    const total = slicedData.length;
    const capacity = zone.capacity || 3000;

    return slicedData.map((d, i) => {
      const x = padLeft + (i / Math.max(1, total - 1)) * plotW;

      // Actual observation coordinates
      const yDensity = padTop + plotH - (d.density / 100) * plotH;
      const visitorRatio = Math.max(0.06, Math.min(0.96, d.visitors / capacity));
      const yVisitors = padTop + plotH - visitorRatio * plotH;

      // Model predicted density coordinates (과거 모델값 + 미래 예측값)
      const yPredDensity = padTop + plotH - (d.predDensity / 100) * plotH;
      const yPredDensityUpper = padTop + plotH - (d.predDensityUpper / 100) * plotH;
      const yPredDensityLower = padTop + plotH - (d.predDensityLower / 100) * plotH;

      // Model predicted visitor coordinates (과거 모델값 + 미래 예측값)
      const predVisitorRatio = Math.max(0.06, Math.min(0.96, d.predVisitors / capacity));
      const yPredVisitors = padTop + plotH - predVisitorRatio * plotH;
      const yPredVisitorsUpper = padTop + plotH - Math.min(1.0, d.predVisitorsUpper / capacity) * plotH;
      const yPredVisitorsLower = padTop + plotH - Math.max(0.0, d.predVisitorsLower / capacity) * plotH;

      return {
        ...d,
        x,
        yDensity,
        yVisitors,
        yPredDensity,
        yPredDensityUpper,
        yPredDensityLower,
        yPredVisitors,
        yPredVisitorsUpper,
        yPredVisitorsLower,
      };
    });
  }, [slicedData, zone.capacity, plotW, plotH, padLeft, padTop]);

  // Smooth bezier curve generator
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  // Partition into historical (past + current) and forecast (current + future) segments
  const historicalPoints = chartPoints.filter((p) => p.type === 'past' || p.type === 'current');
  const forecastPoints = chartPoints.filter((p) => p.type === 'current' || p.type === 'forecast');

  // Actual Observation Lines
  const historyDensityPath = createSmoothPath(historicalPoints.map((p) => ({ x: p.x, y: p.yDensity })));
  const historyVisitorsPath = createSmoothPath(historicalPoints.map((p) => ({ x: p.x, y: p.yVisitors })));

  // Full Model Prediction Lines (Prophet style spanning across past backtest + future forecast)
  const fullPredDensityPath = createSmoothPath(chartPoints.map((p) => ({ x: p.x, y: p.yPredDensity })));
  const fullPredVisitorsPath = createSmoothPath(chartPoints.map((p) => ({ x: p.x, y: p.yPredVisitors })));

  // Future Forecast Lines (Dashed)
  const forecastDensityPath = createSmoothPath(forecastPoints.map((p) => ({ x: p.x, y: p.yPredDensity })));
  const forecastVisitorsPath = createSmoothPath(forecastPoints.map((p) => ({ x: p.x, y: p.yPredVisitors })));

  // Historical Area Fill
  const historyAreaD = historicalPoints.length > 0
    ? `${historyDensityPath} L ${historicalPoints[historicalPoints.length - 1].x} ${padTop + plotH} L ${historicalPoints[0].x} ${padTop + plotH} Z`
    : '';

  // Continuous Confidence Band Ribbon across the whole timeline (Prophet image style)
  const fullConfidenceBandD = useMemo(() => {
    if (chartPoints.length < 2) return '';
    // Top boundary (upper confidence limit)
    let d = `M ${chartPoints[0].x} ${chartPoints[0].yPredDensityUpper}`;
    for (let i = 1; i < chartPoints.length; i++) {
      d += ` L ${chartPoints[i].x} ${chartPoints[i].yPredDensityUpper}`;
    }
    // Bottom boundary in reverse (lower confidence limit)
    for (let i = chartPoints.length - 1; i >= 0; i--) {
      d += ` L ${chartPoints[i].x} ${chartPoints[i].yPredDensityLower}`;
    }
    d += ' Z';
    return d;
  }, [chartPoints]);

  const livePoint = chartPoints.find((p) => p.type === 'current');
  const hoveredPoint = hoveredPointIndex !== null && chartPoints[hoveredPointIndex] ? chartPoints[hoveredPointIndex] : null;

  // Floating tooltip position following mouse at bottom-right (앱솔루트로 마우스 우측하단 추종)
  const tooltipPos = useMemo(() => {
    if (!mousePos || !chartContainerRef.current) return null;
    const containerW = chartContainerRef.current.clientWidth || 380;
    const containerH = chartContainerRef.current.clientHeight || 260;
    const tooltipW = 270;
    const tooltipH = 100;

    let x = mousePos.x + 14;
    let y = mousePos.y + 16;

    // Flip to left if overflowing container width
    if (x + tooltipW > containerW - 10) {
      x = Math.max(10, mousePos.x - tooltipW - 14);
    }

    // Flip above if overflowing container height
    if (y + tooltipH > containerH - 10) {
      y = Math.max(10, mousePos.y - tooltipH - 14);
    }

    return { x, y };
  }, [mousePos]);

  return (
    <div className="ds-analytics-panel">
      {/* 1. Top Zone Header (단독 패널 모드일 때만 표시, 모달 통합 시 hideHeader=true로 숨김) */}
      {!hideHeader && (
        <div className="ds-analytics-standalone-header">
          <div className="ds-analytics-zone-info">
            <h2 className="ds-analytics-zone-name">
              {zone.name || zone.scannerName}
            </h2>
            {/* Level Badge with Alert Icon */}
            <span
              className="ds-analytics-zone-badge"
              style={{
                backgroundColor: levelInfo.bgLight,
                color: levelInfo.color,
                borderColor: levelInfo.borderColor,
              }}
            >
              {level >= 5 ? <AlertTriangle size={12} className="animate-pulse" /> : <span className="ds-analytics-zone-badge-dot" />}
              {levelInfo.name}
            </span>
            <span className="ds-analytics-zone-meta">
              {congVal}% ({visitors.toLocaleString()}명)
            </span>
          </div>

          <div className="ds-analytics-header-actions">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                title="닫기"
                className="ds-analytics-close-btn"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Tab Navigation: [시계열 추이 & 예측 분석] vs [과거 1개월 심각이상 이력] */}
      <div className="ds-analytics-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('chart')}
          className={`ds-analytics-tab-btn ${activeTab === 'chart' ? 'is-active-chart' : ''}`}
        >
          <TrendingUp size={14} className="ds-analytics-tab-icon is-chart" />
          <span>통합 시계열 & AI 예측 분석</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`ds-analytics-tab-btn ${activeTab === 'history' ? 'is-active-history' : ''}`}
        >
          <History size={14} className="ds-analytics-tab-icon is-history" />
          <span>과거 1개월 심각이상 이력</span>
          <span className="ds-analytics-tab-count-badge">
            {criticalIncidents.length}건
          </span>
        </button>
      </div>

      {/* 3. Main Content Body */}
      <div className="ds-analytics-body">
        {activeTab === 'chart' ? (
          <>
            {/* [ONE UNIFIED PANEL] 상단 차트와 하단 범위 탐색 스크러버를 하나의 패널로 완전 통합 */}
            <div className="ds-analytics-card">
              {/* Row 1: Header with Title & AI Forecast Toggle Switch */}
              <div className="ds-analytics-card-header">
                <div className="ds-analytics-card-title-group">
                  <div className="ds-analytics-card-pulse-dot" />
                  <span className="ds-analytics-card-title">
                    밀집도 시계열 추이 & AI 예측
                  </span>
                </div>

                {/* Reusable UI Component: ToggleSwitch (표출/미표출 선택) */}
                <ToggleSwitch
                  checked={showForecast}
                  onChange={setShowForecast}
                  label="AI 예측"
                  icon={<Sparkles size={13} />}
                  title={showForecast ? 'AI 예측 그래프 숨기기' : 'AI 예측 그래프 표출하기 (과거 검증 + 미래 예측)'}
                />
              </div>

              {/* Row 2: 24시간 / 3일 전체 버튼을 좌측에 배치 & 적중률만 표출 */}
              <div className="ds-analytics-card-subbar">
                <div className="ds-analytics-presets">
                  <button
                    type="button"
                    onClick={() => handlePreset('24h')}
                    className="ds-analytics-preset-btn"
                  >
                    24시간
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreset('all')}
                    className="ds-analytics-preset-btn"
                  >
                    3일 전체
                  </button>
                </div>

                {/* 적중률만 표출 (요청: 아이콘 제거하고 적중률 텍스트만 표출) */}
                {showForecast && (
                  <span className="ds-analytics-accuracy-badge">
                    적중률 94.6%
                  </span>
                )}
              </div>

              {/* Upper Section: Main Detailed Dual-Axis Chart */}
              <div
                ref={chartContainerRef}
                className="ds-analytics-chart-viewport"
                onMouseMove={(e) => {
                  if (!chartContainerRef.current) return;
                  const rect = chartContainerRef.current.getBoundingClientRect();
                  setMousePos({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  });
                }}
                onMouseLeave={() => {
                  setHoveredPointIndex(null);
                  setMousePos(null);
                }}
              >
                {/* Background Watermark Title */}
                <div className="ds-analytics-watermark">
                  <span>밀집도 추이 & 예측</span>
                </div>

                {/* SVG Chart Canvas */}
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="ds-analytics-svg-chart"
                >
                  <defs>
                    {/* Density teal line glow & area gradient */}
                    <linearGradient id="densityTealGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.0" />
                    </linearGradient>

                    {/* Prophet Style Confidence Interval Band Gradient */}
                    <linearGradient id="prophetBandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.30" />
                      <stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.08" />
                    </linearGradient>

                    {/* Visitors purple gradient */}
                    <linearGradient id="visitorsPurpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818CF8" stopOpacity="0.22" />
                      <stop offset="100%" stopColor="#818CF8" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines & Left/Right Y-axis values */}
                  {[100, 80, 60, 40, 20].map((v) => {
                    const y = padTop + plotH - (v / 100) * plotH;
                    return (
                      <g key={v}>
                        {/* Left Y label */}
                        <text
                          x={padLeft - 6}
                          y={y + 3.5}
                          textAnchor="end"
                          fontSize="9"
                          fill="#475569"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {v}
                        </text>
                        {/* Grid line */}
                        <line
                          x1={padLeft}
                          y1={y}
                          x2={padLeft + plotW}
                          y2={y}
                          stroke="#1E293B"
                          strokeWidth="1"
                          strokeDasharray={v === 100 ? 'none' : '2, 3'}
                        />
                        {/* Right Y label */}
                        <text
                          x={padLeft + plotW + 6}
                          y={y + 3.5}
                          textAnchor="start"
                          fontSize="9"
                          fill="#475569"
                          fontFamily="monospace"
                          fontWeight="600"
                        >
                          {v}
                        </text>
                      </g>
                    );
                  })}

                  {/* Baseline 0 line */}
                  <line
                    x1={padLeft}
                    y1={padTop + plotH}
                    x2={padLeft + plotW}
                    y2={padTop + plotH}
                    stroke="#334155"
                    strokeWidth="1.5"
                  />

                  {/* 1. Historical Density Area Fill */}
                  {historyAreaD && <path d={historyAreaD} fill="url(#densityTealGrad)" />}

                  {/* 2. Prophet Style Confidence Interval Band (과거 백테스트 검증 + 미래 신뢰구간 대역) */}
                  {showForecast && fullConfidenceBandD && (
                    <path
                      d={fullConfidenceBandD}
                      fill="url(#prophetBandGrad)"
                      stroke="#38BDF8"
                      strokeWidth="1.0"
                      strokeDasharray="3, 3"
                      strokeOpacity="0.70"
                    />
                  )}

                  {/* 4. Ground-Truth Actual Historical Lines (실측치 실선) */}
                  {historyVisitorsPath && (
                    <path
                      d={historyVisitorsPath}
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  )}
                  {historyDensityPath && (
                    <path
                      d={historyDensityPath}
                      fill="none"
                      stroke="#2DD4BF"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                    />
                  )}

                  {/* 5. Ground-Truth Actual Observation Dots (Prophet style scatter points) */}
                  {showForecast &&
                    historicalPoints.map((p) => (
                      <g key={`dots-${p.id}`}>
                        <circle cx={p.x} cy={p.yDensity} r="2.8" fill="#0D1527" stroke="#2DD4BF" strokeWidth="1.6" />
                        <circle cx={p.x} cy={p.yVisitors} r="2.8" fill="#0D1527" stroke="#818CF8" strokeWidth="1.6" />
                      </g>
                    ))}

                  {/* 6. Live marker vertical line divider & in-place beacons */}
                  {livePoint && (
                    <g>
                      <line
                        x1={livePoint.x}
                        y1={padTop}
                        x2={livePoint.x}
                        y2={padTop + plotH}
                        stroke="#38BDF8"
                        strokeWidth="1.5"
                        strokeDasharray="3, 2"
                      />

                      {/* Density Beacon (Teal) */}
                      <circle cx={livePoint.x} cy={livePoint.yDensity} r="4.5" fill="#2DD4BF" stroke="#FFFFFF" strokeWidth="1.8" />
                      <circle cx={livePoint.x} cy={livePoint.yDensity} r="7" fill="none" stroke="#2DD4BF" strokeWidth="1.4">
                        <animate attributeName="r" values="4.5;8.5;4.5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.15;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>

                      {/* Visitors Beacon (Purple) */}
                      <circle cx={livePoint.x} cy={livePoint.yVisitors} r="4.5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="1.8" />
                      <circle cx={livePoint.x} cy={livePoint.yVisitors} r="7" fill="none" stroke="#818CF8" strokeWidth="1.4">
                        <animate attributeName="r" values="4.5;8.5;4.5" dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0.15;0.8" dur="2s" repeatCount="indefinite" />
                      </circle>
                    </g>
                  )}

                  {/* 7. X Axis Labels & Interactive Hover Columns */}
                  {chartPoints.map((p, i) => {
                    const isDense = chartPoints.length > 12;
                    const isCurrent = p.type === 'current';
                    const isBoundary = i === 0 || i === chartPoints.length - 1;
                    const isHovered = hoveredPointIndex === i;
                    const step = chartPoints.length > 18 ? 3 : 2;
                    const shouldShowTickText = !isDense || isCurrent || isBoundary || isHovered || (i % step === 0);

                    return (
                      <g
                        key={p.id}
                        style={{ cursor: 'pointer' }}
                        onMouseEnter={() => setHoveredPointIndex(i)}
                      >
                        <rect
                          x={p.x - 14}
                          y={padTop}
                          width={28}
                          height={plotH}
                          fill="transparent"
                        />

                        {/* X axis tick text (selective when dense to prevent overlap) */}
                        {shouldShowTickText && (
                          <text
                            x={p.x}
                            y={svgHeight - 8}
                            textAnchor="middle"
                            fontSize="9.5"
                            fill={isCurrent ? '#38BDF8' : p.type === 'forecast' ? '#2DD4BF' : '#64748B'}
                            fontFamily="sans-serif"
                            fontWeight={isCurrent ? '800' : p.type === 'forecast' ? '600' : '500'}
                          >
                            {p.time}
                          </text>
                        )}

                        {/* Hover cursor line */}
                        {hoveredPointIndex === i && (
                          <g>
                            <line
                              x1={p.x}
                              y1={padTop}
                              x2={p.x}
                              y2={padTop + plotH}
                              stroke="#FFFFFF"
                              strokeWidth="1.2"
                              strokeDasharray="2, 2"
                            />
                            <circle cx={p.x} cy={p.yDensity} r="5" fill="#2DD4BF" stroke="#FFFFFF" strokeWidth="2" />
                            <circle cx={p.x} cy={p.yVisitors} r="5" fill="#818CF8" stroke="#FFFFFF" strokeWidth="2" />
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Floating Tooltip Card */}
                {hoveredPoint && tooltipPos && (
                  <div
                    className="ds-analytics-tooltip"
                    style={{
                      left: `${tooltipPos.x}px`,
                      top: `${tooltipPos.y}px`,
                    }}
                  >
                    <div className="ds-analytics-tooltip-header">
                      <div className="ds-analytics-tooltip-title">
                        <Clock size={13} className="ds-analytics-tooltip-icon" />
                        <span className="ds-analytics-tooltip-label">{hoveredPoint.fullLabel}</span>
                        {hoveredPoint.type === 'current' && (
                          <span className="ds-analytics-tooltip-pill current">
                            실시간
                          </span>
                        )}
                        {hoveredPoint.type === 'forecast' && (
                          <span className="ds-analytics-tooltip-pill forecast">
                            <Sparkles size={11} />
                            예측
                          </span>
                        )}
                      </div>

                      {showForecast && hoveredPoint.type === 'past' && (
                        <span className="ds-analytics-tooltip-pill hit">
                          적중 ✔
                        </span>
                      )}
                    </div>

                    <div className="ds-analytics-tooltip-grid">
                      <div>
                        <div className="ds-analytics-tooltip-metric-val density">
                          밀집도: {hoveredPoint.density}%
                        </div>
                        {showForecast && (
                          <div className="ds-analytics-tooltip-metric-sub">
                            AI예측: {hoveredPoint.predDensityLower}%~{hoveredPoint.predDensityUpper}%
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="ds-analytics-tooltip-metric-val visitors">
                          체류인원: {hoveredPoint.visitors.toLocaleString()}명
                        </div>
                        {showForecast && (
                          <div className="ds-analytics-tooltip-metric-sub">
                            신뢰구간: {hoveredPoint.predVisitorsLower.toLocaleString()}~{hoveredPoint.predVisitorsUpper.toLocaleString()}명
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Top Graph Legend */}
                <div className="ds-analytics-chart-legend">
                  <div className="ds-analytics-legend-item">
                    <span className="ds-analytics-legend-dot density" />
                    <span>밀집도</span>
                  </div>
                  <div className="ds-analytics-legend-item">
                    <span className="ds-analytics-legend-dot visitors" />
                    <span>체류인원</span>
                  </div>
                  {showForecast && (
                    <div className="ds-analytics-legend-item">
                      <span className="ds-analytics-legend-band" />
                      <span>밀집도 AI예측</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seamless Divider: Showing active time range window (탐색 범위 바) */}
              <div className="ds-analytics-range-bar">
                <div className="ds-analytics-range-content">
                  <Calendar size={13} className="ds-analytics-range-icon" />
                  <span className="ds-analytics-range-label">탐색 범위:</span>
                  <span className="ds-analytics-range-val">
                    {slicedData[0]?.fullLabel} ~ {slicedData[slicedData.length - 1]?.fullLabel}
                  </span>
                  <span className="ds-analytics-range-count">
                    ({slicedData.length}개 시점 표출 중)
                  </span>
                </div>
              </div>

              {/* Lower Section: Interactive Range Timeline Scrubber */}
              <div className="ds-analytics-scrubber-section">
                {/* Timeline mini area chart container */}
                <div
                  ref={scrubberRef}
                  className="ds-analytics-scrubber-track"
                  onClick={(e) => {
                    if (!scrubberRef.current) return;
                    const rect = scrubberRef.current.getBoundingClientRect();
                    const clickPercent = ((e.clientX - rect.left) / rect.width) * 100;
                    const halfWin = (rangeEnd - rangeStart) / 2;
                    let newStart = clickPercent - halfWin;
                    let newEnd = clickPercent + halfWin;
                    if (newStart < 0) {
                      newStart = 0;
                      newEnd = halfWin * 2;
                    } else if (newEnd > 100) {
                      newEnd = 100;
                      newStart = 100 - halfWin * 2;
                    }
                    setRangeStart(+newStart.toFixed(1));
                    setRangeEnd(+newEnd.toFixed(1));
                  }}
                >
                  <svg viewBox="0 0 440 60" preserveAspectRatio="none" className="ds-analytics-scrubber-svg">
                    {/* Multi-day baseline area curves */}
                    <path
                      d="M 0 45 Q 60 15, 120 40 T 240 30 T 360 48 T 440 35 L 440 60 L 0 60 Z"
                      fill="url(#densityTealGrad)"
                    />
                    <path
                      d="M 0 50 Q 80 20, 160 38 T 320 25 T 440 40 L 440 60 L 0 60 Z"
                      fill="url(#visitorsPurpleGrad)"
                    />
                    {/* Axis lines */}
                    <line x1="0" y1="20" x2="440" y2="20" stroke="#1E293B" strokeWidth="0.8" />
                    <line x1="0" y1="40" x2="440" y2="40" stroke="#1E293B" strokeWidth="0.8" />
                  </svg>

                  {/* Interactive Draggable Selection Window */}
                  <div
                    style={{
                      left: `${rangeStart}%`,
                      width: `${Math.max(8, rangeEnd - rangeStart)}%`,
                    }}
                    className="ds-analytics-scrubber-window"
                    onMouseDown={(e) => handleScrubberMouseDown(e, 'window')}
                    title="선택 영역 드래그하여 이동"
                  >
                    {/* Left Drag Handle */}
                    <div
                      onMouseDown={(e) => handleScrubberMouseDown(e, 'start')}
                      title="시작 범위 조절"
                      className="ds-analytics-scrubber-handle is-left"
                    >
                      <div className="ds-analytics-scrubber-handle-dot" />
                    </div>

                    {/* Middle Window Grip Lines */}
                    <div className="ds-analytics-scrubber-grip">
                      <div className="ds-analytics-scrubber-grip-bar" />
                      <div className="ds-analytics-scrubber-grip-bar" />
                      <div className="ds-analytics-scrubber-grip-bar" />
                    </div>

                    {/* Right Drag Handle */}
                    <div
                      onMouseDown={(e) => handleScrubberMouseDown(e, 'end')}
                      title="종료 범위 조절"
                      className="ds-analytics-scrubber-handle is-right"
                    >
                      <div className="ds-analytics-scrubber-handle-dot" />
                    </div>
                  </div>
                </div>

                {/* Scrubber X Dates */}
                <div className="ds-analytics-scrubber-dates">
                  <div>
                    <span>10.20 </span>
                    <span style={{ color: '#64748b' }}>(Day 1)</span>
                  </div>
                  <div>
                    <span>10.21 </span>
                    <span style={{ color: '#64748b' }}>(Day 2)</span>
                  </div>
                  <div className="ds-analytics-scrubber-date-today">
                    <span>10.22 (오늘)</span>
                    <span style={{ color: '#2dd4bf', fontWeight: 600 }}>+예측</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick alert banner for past critical events */}
            <div
              onClick={() => setActiveTab('history')}
              className="ds-analytics-alert-banner"
            >
              <div className="ds-analytics-alert-content">
                <ShieldAlert size={14} className="ds-analytics-alert-icon" />
                <span className="ds-analytics-alert-text">
                  최근 1개월간 <strong>심각·위험</strong> 단계 발생{' '}
                  <strong className="ds-analytics-alert-count">{criticalIncidents.length}건</strong> 기록됨 (상세 이력 조회 →)
                </span>
              </div>
              <ChevronRight size={14} className="ds-analytics-alert-icon" />
            </div>
          </>
        ) : (
          /* Past 1 Month Critical/Emergency Incidents List (심각이상 이력 리스트) */
          <div className="ds-analytics-history">
            <div className="ds-analytics-history-header">
              <div className="ds-analytics-history-title">
                <ShieldAlert size={14} className="ds-analytics-history-icon" />
                <h3>
                  과거 1개월간 밀집도 심각·위험 발생 이력 ({criticalIncidents.length}건)
                </h3>
              </div>
              <span className="ds-analytics-history-range">
                2026.09.22 ~ 2026.10.22
              </span>
            </div>

            {criticalIncidents.map((inc) => {
              const isSelected = selectedIncidentId === inc.id;
              const isEmergency = inc.level === 6;
              return (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncidentId(isSelected ? null : inc.id)}
                  className={`ds-analytics-incident-card ${isEmergency ? 'emergency' : 'critical'} ${isSelected ? 'is-selected' : ''}`}
                >
                  {/* Top row: Date, Time, Level Badge */}
                  <div className="ds-analytics-incident-header">
                    <div className="ds-analytics-incident-datetime">
                      <Calendar size={13} className="ds-analytics-incident-date-icon" />
                      <span className="ds-analytics-incident-date">
                        {inc.date} ({inc.dayOfWeek})
                      </span>
                      <span className="ds-analytics-incident-timerange">
                        {inc.timeRange}
                      </span>
                    </div>

                    <span className={`ds-analytics-incident-badge ${isEmergency ? 'emergency' : 'critical'}`}>
                      {isEmergency ? '▲ 위험 (6단계)' : '▲ 심각 (5단계)'}
                    </span>
                  </div>

                  {/* Metrics row */}
                  <div className="ds-analytics-incident-metrics">
                    <div>
                      <div className="ds-analytics-incident-metric-label">지속 시간</div>
                      <div className="ds-analytics-incident-metric-val">{inc.duration}</div>
                    </div>
                    <div>
                      <div className="ds-analytics-incident-metric-label">최고 밀집도</div>
                      <div className="ds-analytics-incident-metric-val teal">
                        {inc.peakDensity}% ({inc.peakDensityM2}명/㎡)
                      </div>
                    </div>
                    <div>
                      <div className="ds-analytics-incident-metric-label">최대 인원</div>
                      <div className="ds-analytics-incident-metric-val indigo">
                        {inc.peakVisitors.toLocaleString()}명
                      </div>
                    </div>
                  </div>

                  {/* Cause & Action Taken */}
                  <div className="ds-analytics-incident-details">
                    <div className="ds-analytics-incident-detail-row">
                      <span className="ds-analytics-incident-detail-label">발생원인:</span>
                      <span>{inc.cause}</span>
                    </div>
                    <div className="ds-analytics-incident-detail-row">
                      <span className="ds-analytics-incident-detail-label action">조치내용:</span>
                      <span>{inc.actionTaken}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Contact Information ("담당자" - Matching Screenshot 2) */}
        <div className="ds-analytics-contacts">
          <div className="ds-analytics-contacts-header">
            <User size={13} className="ds-analytics-contacts-icon" />
            <span className="ds-analytics-contacts-title">담당자</span>
          </div>

          <div className="ds-analytics-contacts-list">
            {[
              { name: '김수지', phone: '010-1234-5678', role: '종로구 재난안전과' },
              { name: '김동원', phone: '010-1234-5678', role: '낙원파출소 치안센터' },
              { name: '박태현', phone: '010-9876-5432', role: '스마트관제센터' },
            ].map((contact, idx) => {
              const isCopied = copiedPhone === contact.phone;
              return (
                <div
                  key={idx}
                  onClick={() => handleCopyPhone(contact.phone)}
                  title={`${contact.name} (${contact.role}) 전화번호 복사`}
                  className="ds-analytics-contact-pill"
                >
                  <User size={13} className="ds-analytics-contact-user-icon" />
                  <span className="ds-analytics-contact-name">{contact.name}</span>
                  <span className="ds-analytics-contact-divider">|</span>
                  <span className="ds-analytics-contact-phone">{contact.phone}</span>
                  {isCopied ? (
                    <Check size={13} className="ds-analytics-contact-check-icon" />
                  ) : (
                    <Copy size={12} className="ds-analytics-contact-copy-icon" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
