import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { MapContainer } from './components/MapContainer';
import { AirgapGuideModal } from './components/AirgapGuideModal';
import { GeoJsonModal } from './components/GeoJsonModal';
import { ServerConfigModal } from './components/ServerConfigModal';
import { MapConceptModal } from './components/MapConceptModal';
import { INITIAL_ZONES, INITIAL_CONGESTIONS } from './data/defaultZones';
import { DEFAULT_TILE_SERVERS, DEFAULT_MAP_CONCEPT } from './utils/constants';
import {
  ZoneData,
  CongestionData,
  AppMode,
  TileServerConfig,
  LatLng,
  CongestionLevel,
  MapConceptConfig,
} from './types';
import { determineCongestionLevel } from './utils/geoUtils';

export default function App() {
  // Main Data States
  const [zones, setZones] = useState<ZoneData[]>(INITIAL_ZONES);
  const [congestions, setCongestions] = useState<Record<string, CongestionData>>(INITIAL_CONGESTIONS);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>('ZONE-001');

  // App Configuration States
  const [mode, setMode] = useState<AppMode>('view');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString('ko-KR', { hour12: false })
  );
  const [tileServer, setTileServer] = useState<TileServerConfig>(DEFAULT_TILE_SERVERS[0]);

  // Map & Creation States
  const [creatingZoneType, setCreatingZoneType] = useState<'circle' | 'polygon' | null>(null);
  const [focusTarget, setFocusTarget] = useState<LatLng | null>(null);

  // Modals & Concept States
  const [mapConcept, setMapConcept] = useState<MapConceptConfig>(DEFAULT_MAP_CONCEPT);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [isServerConfigOpen, setIsServerConfigOpen] = useState<boolean>(false);
  const [isGeoJsonOpen, setIsGeoJsonOpen] = useState<boolean>(false);

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

  // Select Zone
  const handleSelectZone = (zoneId: string) => {
    setSelectedZoneId(zoneId);
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
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
      {/* 1. Header */}
      <Header
        mode={mode}
        setMode={setMode}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isSimulating={isSimulating}
        setIsSimulating={setIsSimulating}
        onRefreshCongestion={handleManualRefresh}
        lastUpdated={lastUpdated}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenServerConfig={() => setIsServerConfigOpen(true)}
        onOpenGeoJson={() => setIsGeoJsonOpen(true)}
        onOpenConcept={() => setIsConceptModalOpen(true)}
        currentConceptName={mapConcept.name}
        isAirGappedActive={tileServer.isAirGapped}
        tileServerName={tileServer.name}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Zone List, Filters, Stats, Add */}
        <LeftPanel
          zones={zones}
          congestions={congestions}
          selectedZoneId={selectedZoneId}
          onSelectZone={handleSelectZone}
          onToggleZoneVisibility={handleToggleZoneVisibility}
          onDuplicateZone={handleDuplicateZone}
          onDeleteZone={handleDeleteZone}
          onCreateZone={handleStartCreateZone}
          onFocusZoneOnMap={handleFocusZoneOnMap}
        />

        {/* Center: Leaflet Map Container */}
        <MapContainer
          zones={zones}
          congestions={congestions}
          selectedZoneId={selectedZoneId}
          onSelectZone={handleSelectZone}
          onUpdateZone={handleUpdateZone}
          mode={mode}
          tileServer={tileServer}
          isDarkMode={isDarkMode}
          concept={mapConcept}
          onOpenConcept={() => setIsConceptModalOpen(true)}
          onAddZoneComplete={handleAddZoneComplete}
          creatingZoneType={creatingZoneType}
          setCreatingZoneType={setCreatingZoneType}
          focusTarget={focusTarget}
          onFocusHandled={() => setFocusTarget(null)}
        />

        {/* Right Panel: Zone Inspector & Geometry/Congestion Editor */}
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
      <ServerConfigModal
        isOpen={isServerConfigOpen}
        onClose={() => setIsServerConfigOpen(false)}
        currentConfig={tileServer}
        onApplyConfig={(cfg) => setTileServer(cfg)}
      />
      <MapConceptModal
        isOpen={isConceptModalOpen}
        onClose={() => setIsConceptModalOpen(false)}
        concept={mapConcept}
        onApplyConcept={(c) => setMapConcept(c)}
      />
    </div>
  );
}
