require 'find'
Find.find('dst') {|path|
  next unless /ndjson\.gz$/.match path
  dst = path.sub('dst', 'mbtiles').sub('ndjson.gz', 'mbtiles')
  next if File.exist?(dst)
  print "tippecanoe --no-feature-limit --no-tile-size-limit --minimum-zoom=10 --maximum-zoom=15 --base-zoom=15 --read-parallel -f --simplification=2 -o #{dst} #{path}\n"
}

