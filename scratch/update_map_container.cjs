const fs = require('fs');

let content = fs.readFileSync('src/components/MapContainer.tsx', 'utf8');

// 1. Replace Tag with Milestone in imports
content = content.replace('  Tag,\n', '  Milestone,\n');

// 2. Replace showLabels state with showRoadNumbers
content = content.replace(
  '  const [showLabels, setShowLabels] = useState<boolean>(true);',
  '  const [showRoadNumbers, setShowRoadNumbers] = useState<boolean>(true);'
);

// 3. Update createDarkMapStyle call with showRoadNumbers
content = content.replace(
  'createDarkMapStyle(window.location.origin)',
  'createDarkMapStyle(window.location.origin, undefined, { showRoadNumbers })'
);

// 4. Add dynamic toggle effect right after tile layer load useEffect
const effectMarker = '    leafletMap.current.invalidateSize();\n  }, [isDarkMode]);';
const newEffect = `    leafletMap.current.invalidateSize();
  }, [isDarkMode]);

  // 2-2. Toggle Road Number Shields (도로 번호 표출 토글)
  useEffect(() => {
    if (!tileLayerRef.current) return;
    try {
      const maplibreMap = (tileLayerRef.current as any).getMaplibreMap?.();
      if (!maplibreMap) return;
      const visibility = showRoadNumbers ? 'visible' : 'none';
      const shieldLayers = [
        'highway-shield-non-us',
        'highway-shield-us-interstate',
        'road_shield_us',
      ];

      const applyVisibility = () => {
        shieldLayers.forEach((id) => {
          if (maplibreMap.getLayer(id)) {
            maplibreMap.setLayoutProperty(id, 'visibility', visibility);
          }
        });
      };

      if (maplibreMap.isStyleLoaded()) {
        applyVisibility();
      } else {
        maplibreMap.once('styledata', applyVisibility);
      }
    } catch (err) {
      console.error('Failed to toggle road shields:', err);
    }
  }, [showRoadNumbers]);`;

content = content.replace(effectMarker, newEffect);

// 5. Replace button in toolbar
const oldButton = `          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            title={showLabels ? '구역명 라벨 숨김' : '구역명 라벨 표시'}
            className={\`w-full h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer \${showLabels ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 opacity-60'
              }\`}
          >
            <Tag className="w-4 h-4 shrink-0" />
          </button>`;

const newButton = `          <button
            type="button"
            onClick={() => setShowRoadNumbers((prev) => !prev)}
            title={showRoadNumbers ? '도로 번호 숨김' : '도로 번호 표시'}
            className={\`w-full h-9 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-800 transition-colors cursor-pointer \${
              showRoadNumbers
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-neutral-400 opacity-60'
            }\`}
          >
            <Milestone className="w-4 h-4 shrink-0" />
          </button>`;

// Normalize CRLF
const normalize = s => s.replace(/\r\n/g, '\n');
const isCRLF = content.includes('\r\n');

let normContent = normalize(content);
const normOldBtn = normalize(oldButton);
const normNewBtn = normalize(newButton);

if (!normContent.includes(normOldBtn)) {
  console.error('Failed to find old button!');
  process.exit(1);
}

normContent = normContent.replace(normOldBtn, normNewBtn);
const finalContent = isCRLF ? normContent.replace(/\n/g, '\r\n') : normContent;
fs.writeFileSync('src/components/MapContainer.tsx', finalContent, 'utf8');
console.log('Successfully updated src/components/MapContainer.tsx');
