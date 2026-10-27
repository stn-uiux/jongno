import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';

/**
 * Custom Vite Plugin to save zone modifications directly into src/data/defaultZones.ts
 */
function zoneDataSaverPlugin(): Plugin {
  return {
    name: 'zone-data-saver',
    handleHotUpdate({ file }) {
      // Prevent Vite from triggering HMR or full page reload when data files are written
      if (file.includes('defaultZones.ts') || file.includes('zones.json')) {
        return [];
      }
    },
    configureServer(server) {
      server.middlewares.use('/api/save-zones', (req, res) => {
        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const { zones } = JSON.parse(body);
              if (!Array.isArray(zones)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'zones must be an array' }));
                return;
              }

              // Update src/data/defaultZones.ts
              const defaultZonesPath = path.resolve(__dirname, 'src/data/defaultZones.ts');
              if (fs.existsSync(defaultZonesPath)) {
                const currentContent = fs.readFileSync(defaultZonesPath, 'utf8');
                const regex = /(export const INITIAL_ZONES: ZoneData\[\] = \[)([\s\S]*?)(\];\r?\n\r?\n\/\*\*[\s\S]*?export const INITIAL_CONGESTIONS)/;

                if (regex.test(currentContent)) {
                  const formattedZones = zones
                    .map((z: any) => {
                      const coordsLine = z.coordinates
                        ? `\n    coordinates: ${JSON.stringify(z.coordinates)},`
                        : '';
                      const colorLine = z.customColor
                        ? `\n    customColor: ${JSON.stringify(z.customColor)},`
                        : '';
                      const borderLine = z.customBorderColor
                        ? `\n    customBorderColor: ${JSON.stringify(z.customBorderColor)},`
                        : '';
                      const opacityLine =
                        z.customOpacity !== undefined
                          ? `\n    customOpacity: ${z.customOpacity},`
                          : '';

                      return `  {
    id: ${JSON.stringify(z.id)},
    name: ${JSON.stringify(z.name)},
    scannerName: ${JSON.stringify(z.scannerName || '')},
    areaId: ${JSON.stringify(z.areaId || '')},
    areaName: ${JSON.stringify(z.areaName || '')},
    type: ${JSON.stringify(z.type)},
    center: { lat: ${z.center.lat}, lng: ${z.center.lng} },
    radius: ${z.radius || 30},
    visible: ${z.visible},
    capacity: ${z.capacity || 3000},
    description: ${JSON.stringify(z.description || '')},${coordsLine}${colorLine}${borderLine}${opacityLine}
  }`;
                    })
                    .join(',\n');

                  const newContent = currentContent.replace(regex, `$1\n${formattedZones}\n$3`);
                  fs.writeFileSync(defaultZonesPath, newContent, 'utf8');
                  console.log(`[AutoSave] Successfully saved ${zones.length} zones to src/data/defaultZones.ts`);
                } else {
                  console.warn('[AutoSave Warning] Regex did not match defaultZones.ts format');
                }
              }

              // Also write direct json backup
              const jsonBackupPath = path.resolve(__dirname, 'src/data/zones.json');
              fs.writeFileSync(jsonBackupPath, JSON.stringify(zones, null, 2), 'utf8');

              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ success: true, count: zones.length }));
            } catch (err: any) {
              console.error('[AutoSave Error]', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end('Method Not Allowed');
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), zoneDataSaverPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {
              ignored: ['**/src/data/defaultZones.ts', '**/src/data/zones.json'],
            },
    },
  };
});
