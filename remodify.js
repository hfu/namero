const config = require('config')
const fs = require('fs')
const Queue = require('better-queue')
const tempy = require('tempy')
const byline = require('byline')
const { spawn } = require('child_process')
const TimeFormat = require('hh-mm-ss')
const modify = require('./modify.js')

const $minAge = config.get('minAge')

var queue= new Queue((src, cb) => {
  const startTime = new Date()
  if ( startTime - fs.statSync(src).mtime < $minAge ) {
    console.log(`Skipped ${src} because it is younger than ${$minAge / 1000} seconds.`)
    return cb()
  }
  const mb = src.replace(config.get('dst'), 'mbtiles').replace('ndjson', 'mbtiles')
  if ( fs.existsSync(mb) ) {
    if ( fs.statSync(mb).mtime > fs.statSync(src).mtime ) {
      console.log(`Skipped ${src} because ${mb} is newer.`)
      return cb()
    }
  }
  const tmp = tempy.file()
  const input = byline(fs.createReadStream(src))
  const output = fs.createWriteStream(tmp)
  input.on('data', line => {
    if (line.length === 0) return
    try {
      let f = JSON.parse(line)
      f = modify(f)
      output.write(JSON.stringify(f))
    } catch (e) {
      console.log(`f ${src} ${line}`)
    }
  })
  input.on('end', () => {
    output.close()
    const tippecanoe = spawn('tippecanoe', [
      '--quiet', '--no-feature-limit', '--no-tile-size-limit',
      '--minimum-zoom=10', '--maximum-zoom=15', '--base-zoom=15',
      '--read-parallel', '-f', '--simplification=2', '-o',
      mb, tmp 
    ], { stdio: 'inherit' })
    tippecanoe.on('close', () => {
      fs.unlink(tmp, (err) => {
        if (err) throw err
        const t = TimeFormat.fromMs((new Date()) - startTime)
        console.log(`${src} -> (${tmp}) -> ${mb}: ${t}`)
        return cb()
      })
    })
  })
}, { concurrent: 3 })

queue.on('task_failed', (taskId, errorMessage) => {
  console.log(taskId)
  console.log(errorMessage)
})

fs.readdir(config.get('dst'), (err, files) => {
  if (err) throw err
  for (const file of files) {
    if (file.endsWith('ndjson')) {
      queue.push(`${config.get('dst')}/${file}`)
    }
  }
})
