const config = require('config')
const fs = require('fs')
const zlib = require('zlib')
const readline = require('readline')
const tilebelt = require('@mapbox/tilebelt')
const bbox = require('@turf/bbox').default
const modify = require('./modify.js')

// You may want to 'ulimit -n 65536'

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
  const w = [[0, 1], [0, 3], [2, 1], [2, 3]].map(v => {
    const [x, y, z] = tilebelt.pointToTile(b[v[0]], b[v[1]], config.get('z'))
    return `${z}-${x}-${y}`
  }).filter((x, i, self) => self.indexOf(x) === i)
  f = modify(f)
  if (f) {
    for (const w3n of w) {
      streamWrite(w3n, `${JSON.stringify(f)}\n`)
    }
  }
})

rl.on('close', () => {
  for (const w3n in streams) {
    streams[w3n].end()
  }
  console.log(`${(new Date()).toISOString()}: ${process.argv[2]} -> ${Object.keys(streams)}`)
})
