const fs = require('fs');
const json = JSON.parse(fs.readFileSync('public/styles/positron.json', 'utf8'));
json.layers.forEach(l => {
  const str = JSON.stringify(l);
  if (str.includes('"ref"') || str.includes('shield')) {
    console.log(l.id, l.type);
  }
});
