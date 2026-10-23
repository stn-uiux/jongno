import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { MapContainer } from './components/MapContainer';
import { AirgapGuideModal } from './components/AirgapGuideModal';
import { GeoJsonModal } from './components/GeoJsonModal';
import { CctvModal } from './components/CctvModal';
import { INITIAL_ZONES, INITIAL_CONGESTIONS } from './data/defaultZones';
import { CheckCircle2 } from 'lucide-react';
import {
  ZoneData,
  CongestionData,
  AppMode,
  LatLng,
  CongestionLevel,
} from './types';
import { determineCongestionLevel } from './utils/geoUtils';

export default function App() {
  // Main Data States (persisted via localStorage cache & backend defaultZones.ts)
  const [zones, setZones] = useState<ZoneData[]>(() => {
    try {
      const saved = localStorage.getItem('jongno_zones_data') || localStorage.getItem('jongno_zones_data_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_ZONES;
  });
  const [congestions, setCongestions] = useState<Record<string, CongestionData>>(INITIAL_CONGESTIONS);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  // App Configuration States
  const [mode, setMode] = useState<AppMode>('view');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString('ko-KR', { hour12: false })
  );

  // Map & Creation States
  const [creatingZoneType, setCreatingZoneType] = useState<'circle' | 'polygon' | null>(null);
  const [focusTarget, setFocusTarget] = useState<LatLng | null>(null);

  // Modals
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isGeoJsonOpen, setIsGeoJsonOpen] = useState<boolean>(false);
  const [cctvZone, setCctvZone] = useState<ZoneData | null>(null);

  // Auto-save notification state
  const [saveStatus, setSaveStatus] = useState<{ message: string; time: string } | null>(null);

  // Directly persist zones to backend data file (src/data/defaultZones.ts)
  const saveZonesToFile = useCallback(async (updatedZones: ZoneData[]) => {
    try {
      // 1. Instantly cache in browser localStorage so no reload can lose changes
      try {
        localStorage.setItem('jongno_zones_data', JSON.stringify(updatedZones));
        localStorage.setItem('jongno_zones_data_v4', JSON.stringify(updatedZones));
      } catch (e) {
        // ignore
      }

      // 2. Persist to server data files (defaultZones.ts and zones.json)
      const res = await fetch('/api/save-zones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zones: updatedZones }),
      });
      if (res.ok) {
        setSaveStatus({
          message: '임시 데이터 파일(defaultZones.ts)에 저장 완료',
          time: new Date().toLocaleTimeString('ko-KR', { hour12: false }),
        });
        setTimeout(() => {
          setSaveStatus(null);
        }, 2800);
      }
    } catch (err) {
      console.error('Failed to auto-save zones to data file:', err);
    }
  }, []);

  // Debounced auto-save whenever zones change (from map drag, resize, or inspector edits)
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveZonesToFile(zones);
    }, 400);
    return () => clearTimeout(timer);
  }, [zones, saveZonesToFile]);

  // Apply dark mode class to html element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Congestion Live Simulation interval
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setCongestions((prev) => {
        const next: Record<string, CongestionData> = { ...prev };
        const nowStr = new Date().toISOString();

        zones.forEach((z) => {
          const current = prev[z.id];
          if (!current) return;

          // Realistic organic delta (-4 to +4)
          const delta = Math.floor(Math.random() * 9) - 4;
          let newValue = Math.max(8, Math.min(98, current.value + delta));
          const newLevel = determineCongestionLevel(newValue);

          let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
          if (delta > 1) trend = 'increasing';
          else if (delta < -1) trend = 'decreasing';

          const estVisitors = Math.round(((z.capacity || 10000) * newValue) / 100);

          next[z.id] = {
            ...current,
            value: newValue,
            level: newLevel,
            estimatedVisitors: estVisitors,
            updatedAt: nowStr,
            trend,
          };
        });

        return next;
      });

      setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    }, 4500);

    return () => clearInterval(interval);
  }, [isSimulating, zones]);

  // Manual Refresh of Congestion
  const handleManualRefresh = useCallback(() => {
    setCongestions((prev) => {
      const next: Record<string, CongestionData> = { ...prev };
      const nowStr = new Date().toISOString();

      zones.forEach((z) => {
        const current = prev[z.id];
        if (!current) return;
        const delta = Math.floor(Math.random() * 11) - 5;
        const newValue = Math.max(10, Math.min(95, current.value + delta));
        const newLevel = determineCongestionLevel(newValue);

        next[z.id] = {
          ...current,
          value: newValue,
          level: newLevel,
          estimatedVisitors: Math.round(((z.capacity || 10000) * newValue) / 100),
          updatedAt: nowStr,
        };
      });

      return next;
    });

    setLastUpdated(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
  }, [zones]);

  // Handle Mode Change (관제 모드로 전환 시 그리기 상태 초기화)
  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === 'view') {
      setCreatingZoneType(null);
    }
  };

  // Select Zone (empty string or falsy deselects)
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId ? zoneId : null);
  };

  // Update Zone (live reflection from map or inspector)
  const handleUpdateZone = (updatedZone: ZoneData) => {
    setZones((prev) =>
      prev.map((z) => (z.id === updatedZone.id ? { ...updatedZone } : z))
    );
  };

  // Update Congestion (from inspector slider)
  const handleUpdateCongestion = (updatedCongestion: CongestionData) => {
    setCongestions((prev) => ({
      ...prev,
      [updatedCongestion.zoneId]: { ...updatedCongestion },
    }));
  };

  // Toggle Visibility
  const handleToggleZoneVisibility = (zoneId: string) => {
    setZones((prev) =>
      prev.map((z) => (z.id === zoneId ? { ...z, visible: !z.visible } : z))
    );
  };

  // Duplicate Zone
  const handleDuplicateZone = (zoneId: string) => {
    const target = zones.find((z) => z.id === zoneId);
    if (!target) return;

    const newId = `ZONE-${String(zones.length + 1).padStart(3, '0')}`;
    const offset = 0.002; // slight geographic shift

    let newZone: ZoneData;
    if (target.type === 'circle') {
      newZone = {
        ...target,
        id: newId,
        name: `${target.name} (복사본)`,
        center: {
          lat: target.center.lat + offset,
          lng: target.center.lng + offset,
        },
      };
    } else {
      const shiftedCoords = (target.coordinates || []).map(([lat, lng]) => [
        lat + offset,
        lng + offset,
      ] as [number, number]);
      newZone = {
        ...target,
        id: newId,
        name: `${target.name} (복사본)`,
        center: {
          lat: target.center.lat + offset,
          lng: target.center.lng + offset,
        },
        coordinates: shiftedCoords,
      };
    }

    setZones((prev) => [...prev, newZone]);

    const targetCongestion = congestions[zoneId];
    if (targetCongestion) {
      setCongestions((prev) => ({
        ...prev,
        [newId]: {
          ...targetCongestion,
          zoneId: newId,
          updatedAt: new Date().toISOString(),
        },
      }));
    }

    setSelectedZoneId(newId);
    setFocusTarget(newZone.center);
  };

  // Delete Zone
  const handleDeleteZone = (zoneId: string) => {
    const target = zones.find((z) => z.id === zoneId);
    if (!target) return;

    if (window.confirm(`'${target.name}' 관제 구역을 삭제하시겠습니까?`)) {
      setZones((prev) => prev.filter((z) => z.id !== zoneId));
      setCongestions((prev) => {
        const next = { ...prev };
        delete next[zoneId];
        return next;
      });
      if (selectedZoneId === zoneId) {
        setSelectedZoneId(null);
      }
    }
  };

  // Initiate Zone Creation from UI
  const handleStartCreateZone = (type: 'circle' | 'polygon') => {
    setMode('edit');
    setCreatingZoneType(type);
    setSelectedZoneId(null);
  };

  // Finalize Created Zone
  const handleAddZoneComplete = (newZone: ZoneData) => {
    setZones((prev) => [...prev, newZone]);
    const initValue = 35;
    setCongestions((prev) => ({
      ...prev,
      [newZone.id]: {
        zoneId: newZone.id,
        level: determineCongestionLevel(initValue),
        value: initValue,
        estimatedVisitors: Math.round(((newZone.capacity || 10000) * initValue) / 100),
        updatedAt: new Date().toISOString(),
        trend: 'stable',
      },
    }));
    setSelectedZoneId(newZone.id);
    setFocusTarget(newZone.center);
  };

  // Focus Map on Zone
  const handleFocusZoneOnMap = (zoneId: string) => {
    const target = zones.find((z) => z.id === zoneId);
    if (target) {
      setFocusTarget(target.center);
    }
  };

  // Import GeoJSON
  const handleImportGeoJson = (
    newZones: ZoneData[],
    newCongestions: Record<string, CongestionData>
  ) => {
    setZones(newZones);
    setCongestions(newCongestions);
    if (newZones.length > 0) {
      setSelectedZoneId(newZones[0].id);
      setFocusTarget(newZones[0].center);
    }
  };

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || null;
  const selectedCongestion = selectedZoneId ? congestions[selectedZoneId] || null : null;

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans ${isDarkMode ? 'dark' : ''}`}>
      {/* 1. Header */}
      <Header
        mode={mode}
        setMode={handleModeChange}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        onRefreshCongestion={handleManualRefresh}
        lastUpdated={lastUpdated}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenGeoJson={() => setIsGeoJsonOpen(true)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Zone List, Filters, Stats, Add */}
        <LeftPanel
          mode={mode}
          zones={zones}
          congestions={congestions}
          selectedZoneId={selectedZoneId}
          onSelectZone={handleSelectZone}
          onToggleZoneVisibility={handleToggleZoneVisibility}
          onDuplicateZone={handleDuplicateZone}
          onDeleteZone={handleDeleteZone}
          onCreateZone={handleStartCreateZone}
          onFocusZoneOnMap={handleFocusZoneOnMap}
          onOpenCctv={setCctvZone}
        />

        {/* Center: Leaflet Map Container */}
        <MapContainer
          zones={zones}
          congestions={congestions}
          selectedZoneId={selectedZoneId}
          onSelectZone={handleSelectZone}
          onUpdateZone={handleUpdateZone}
          mode={mode}
          isDarkMode={isDarkMode}
          onOpenGuide={() => setIsGuideOpen(true)}
          onAddZoneComplete={handleAddZoneComplete}
          creatingZoneType={creatingZoneType}
          setCreatingZoneType={setCreatingZoneType}
          focusTarget={focusTarget}
          onFocusHandled={() => setFocusTarget(null)}
          onOpenCctv={setCctvZone}
        />

        {/* Right Panel: Zone Inspector & Geometry/Congestion Editor (편집 모드에서만 표출) */}
        {mode === 'edit' && (
          <RightPanel
            zone={selectedZone}
            congestion={selectedCongestion}
            onUpdateZone={handleUpdateZone}
            onUpdateCongestion={handleUpdateCongestion}
            onClose={() => setSelectedZoneId(null)}
            onDeleteZone={handleDeleteZone}
            onDuplicateZone={handleDuplicateZone}
            onCenterMapOnZone={(z) => setFocusTarget(z.center)}
          />
        )}
      </div>

      {/* 3. Modals */}
      <AirgapGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <GeoJsonModal
        isOpen={isGeoJsonOpen}
        onClose={() => setIsGeoJsonOpen(false)}
        zones={zones}
        congestions={congestions}
        onImport={handleImportGeoJson}
      />
      <CctvModal
        isOpen={!!cctvZone}
        onClose={() => setCctvZone(null)}
        zone={cctvZone}
        congestion={cctvZone ? congestions[cctvZone.id] : undefined}
      />

      {/* 4. Auto-save feedback toast */}
      {saveStatus && (
        <div className="fixed bottom-5 right-6 z-[9999] pointer-events-none flex items-center gap-2.5 px-4 py-2.5 bg-neutral-900/95 text-white dark:bg-neutral-800/95 border border-emerald-500/50 rounded-xl shadow-2xl backdrop-blur-md transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white">{saveStatus.message}</span>
            <span className="text-[10px] text-neutral-400 font-mono">저장 시각: {saveStatus.time}</span>
          </div>
        </div>
      )}
    </div>
  );
}
