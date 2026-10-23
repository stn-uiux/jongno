import fs from 'fs';
import path from 'path';

const logPath = 'C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\bae94a79-baca-4457-885a-ce5e381f1ed5\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

for (const line of lines) {
  if (line.includes('write_to_file') && line.includes('4 Core Monitoring Areas') && line.includes('ZONE-IK-01')) {
    const json = JSON.parse(line);
    for (const call of json.tool_calls) {
      if (call.name === 'write_to_file' && call.args.TargetFile.includes('defaultZones.ts')) {
        let code = call.args.CodeContent;
        // Update zone names to strip CCTV
        const regex = /(name:\s*['"])([^'"]+)(['"],\s*\n\s*scannerName:\s*['"])([^'"]+)(['"])/g;
        code = code.replace(regex, (match, prefix, oldName, mid, scannerName, suffix) => {
          const cleanName = scannerName.replace(/^cctv\s*/i, '').trim();
          return `${prefix}${cleanName}${mid}${scannerName}${suffix}`;
        });
        const target = path.resolve('src/data/defaultZones.ts');
        fs.writeFileSync(target, code, 'utf8');
        console.log('Restored and updated defaultZones.ts successfully!');
        process.exit(0);
      }
    }
  }
}

console.error('Matching line not found');
process.exit(1);
