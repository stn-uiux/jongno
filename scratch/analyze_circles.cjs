const fs = require('fs');
const { VectorTile } = require('@mapbox/vector-tile');
const { PbfReader } = require('pbf');

// Let's inspect the entire Han River and 1번 road to see:
// Why are the Han River bridges yellow in our map?
// In our map:
// - highway_major_inner renders ALL primary roads as c.nationalRoad (#7c785b)
// - The Han River bridges (Mapo Bridge, Hangang Bridge, Banpo Bridge, etc.) have class: 'primary'
// - Therefore, they are rendered in c.nationalRoad (#7c785b).

// Now, what about the land roads connecting to them?
// Notice in Image 2:
// Look at the circled roads:
// Are the circles ONLY circling the bridges over the water?
// Or are they circling the entire arterial road (e.g. Mapo-daero, Hangang-daero)?
