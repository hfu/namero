require 'find'

Find.find('mbtiles') {|path|
  next unless path.end_with?('.mbtiles')
  print "mv #{path} #{path.sub('.ndjson','')}\n"
}

