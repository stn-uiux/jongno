const fs = require('fs');

['public/styles/positron.json', 'dist/styles/positron.json'].forEach(filePath => {
  if (!fs.existsSync(filePath)) return;
  const json = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  json.layers.forEach(l => {
    if (l.id === 'highway_major_inner' && l.paint && l.paint['line-color']) {
      l.paint['line-color'] = [
        "match",
        ["get", "class"],
        "trunk",
        "#8b6743",
        "primary",
        "#887e58",
        "#525762"
      ];
    }
    if (l.id === 'highway_major_subtle' && l.paint && l.paint['line-color']) {
      l.paint['line-color'] = [
        "match",
        ["get", "class"],
        "trunk",
        "#8b6743",
        "primary",
        "#525762",
        "#3e434e"
      ];
    }
  });
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
  console.log('Synced', filePath);
});
