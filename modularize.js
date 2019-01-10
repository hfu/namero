const config = require('config')
const fs = require('fs')
const zlib = require('zlib')
const byline = require('byline')
const tilebelt = require('@mapbox/tilebelt')
const bbox = require('@turf/bbox').default
const Queue = require('better-queue')
const walk = require('walk')

const z = config.get('z')
const startTime = new Date()

let streams = {}
let nTasks = 0
let count = 0

const createPath = (key) => {
  return `${config.get('dst')}/${key}.ndjson.gz`
}

const watch = () => {
  count++
  if (count % 1000 === 0) {
    console.log(`${(new Date()).toISOString()}: ${count} feats, ${nTasks} tasks, \
${Math.round(1000 * count / ((new Date()) - startTime))}f/s`)
  }
}

const streamWrite = (key, s, input) => {
  return new Promise(resolve => {
    if (!streams[key]) {
      streams[key] = zlib.createGzip()
      streams[key].pipe(fs.createWriteStream(createPath(key)))
      streams[key].setMaxListeners(config.get('nMaxListeners'))
    }
    watch()
    if (streams[key].write(s)) {
      resolve()
    } else {
      input.pause()
      streams[key].once('drain', () => {
        input.resume()
        resolve()
      })
    }
  })
}

const modularize = (path, src, cb) => {
  const input = byline(fs.createReadStream(path).pipe(zlib.createGunzip()))

  input.on('data', async line => {
    if (line.length === 0) return
    let f = JSON.parse(line)
    f.properties._src = src
    const b = bbox(f)
    // please note that y increase southwards
    const [minx, maxy] = tilebelt.pointToTile(b[0], b[1], z)
    const [maxx, miny] = tilebelt.pointToTile(b[2], b[3], z)
    for (let x = minx; x <= maxx; x++) {
      for (let y = miny; y <= maxy; y++) {
        await streamWrite(`${z}-${x}-${y}`, `${JSON.stringify(f)}\n`, input)
      }
    }
  })

  input.on('end', () => {
    return cb()
  })
}

const closeAll = () => {
  for (const key in streams) {
    console.log(`closing ${key}`)
    streams[key].end(() => {
      console.log(`closed ${key}`)
    })
  }
}

const queue = new Queue((t, cb) => {
  modularize(t.path, t.src, cb)
})

queue.on('task_queued', () => {
  nTasks++
})

queue.on('task_finish', () => {
  nTasks--
  if (nTasks === 0) closeAll()
})

for (const src of ['200000', '25000']) {
  walk.walk(src).on('file', (root, stat, next) => {
    if (stat.name.endsWith('ndjson.gz')) {
      queue.push({ src: src, path: `${root}/${stat.name}` })
    }
    next()
 })
}
