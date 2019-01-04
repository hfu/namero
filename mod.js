const config = require('config')
const fs = require('fs')
const zlib = require('zlib')
const readline = require('readline')
const tilebelt = require('@mapbox/tilebelt')
const bbox = require('@turf/bbox').default

// You may want to 'ulimit -n 65536'

const z = config.get('z')
const streams = {}
const streamWrite = (w3n, s) => {
  if (!streams[w3n]) {
    streams[w3n] = zlib.createGzip()
    streams[w3n].pipe(fs.
      createWriteStream(`${config.get('dst')}/${w3n}.ndjson.gz`, {flags: 'a'}))
  }
  streams[w3n].write(s)
}
let count = 0

const rl = readline.createInterface({
  input: fs.createReadStream(process.argv[2]).pipe(zlib.createGunzip()),
  output: process.stdout,
  terminal: false
})

rl.on('line', line => {
  if (line.length === 0) return
  let f = JSON.parse(line)
  f.properties._src = process.argv[3]
  const b = bbox(f)
  const [minx, miny] = tilebelt.pointToTile(b[0], b[1], z)
  const [maxx, maxy] = tilebelt.pointToTile(b[2], b[3], z)
  for (let x = minx; x <= maxx; x++) {
    for (let y = miny; y <= maxy; y++) {
      streamWrite(`${z}-${x}-${y}`, `${JSON.stringify(f)}\n`)
    }
  }
})

rl.on('close', () => {
  for (const w3n in streams) {
    streams[w3n].end()
  }
  console.log(`${(new Date()).toISOString()}: ${process.argv[2]} -> ${Object.keys(streams)}`)
})
