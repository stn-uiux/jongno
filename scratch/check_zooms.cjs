const fs = require('fs');
const path = require('path');

const tileDirs = fs.readdirSync('public/tiles/planet');
console.log('Available zooms:', tileDirs);
