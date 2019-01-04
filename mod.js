const config = require('config')
const fs = require('fs')
const zlib = require('zlib')
const byline = require('byline')
const tilebelt = require('@mapbox/tilebelt')
const bbox = require('@turf/bbox').default

// You may want to 'ulimit -n 65536'

const z = config.get('z')
const streams = {}
const createPath = (w3n) => {
  return `${config.get('dst')}/${w3n}.ndjson.gz`
}
const streamWrite = (w3n, s) => {
  if (!streams[w3n]) {
    streams[w3n] = zlib.createGzip()
      .pipe(fs.createWriteStream(createPath(w3n), {flags: 'a'}))
  }
  streams[w3n].write(s)
}
let count = 0

const input = byline(fs.createReadStream(process.argv[2])
  .pipe(zlib.createGunzip()))

input.on('data', line => {
  if (line.length === 0) return
  let f = JSON.parse(line)
  f.properties._src = process.argv[3]
  const b = bbox(f)
  // please not that y increase southwards
  const [minx, maxy] = tilebelt.pointToTile(b[0], b[1], z)
  const [maxx, miny] = tilebelt.pointToTile(b[2], b[3], z)
  for (let x = minx; x <= maxx; x++) {
    for (let y = miny; y <= maxy; y++) {
      streamWrite(`${z}-${x}-${y}`, `${JSON.stringify(f)}\n`)
    }
  }
})

input.on('end', () => {
  for (const w3n in streams) {
    streams[w3n].end()
  }
  console.log(`${(new Date()).toISOString()}: ${process.argv[2]} -> ${Object.keys(streams)}`)
})
