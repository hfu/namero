require 'find'

Find.find('../25000') {|path|
  next unless /shp$/.match path
  dst = "25000/#{File.basename(path).sub('shp', 'ndjson.gz')}"
  next if File.exist?(dst)
  print "ogr2ogr -s_srs EPSG:4326 -t_srs EPSG:4326 -oo ENCODING=Windows-31J -lco RS=NO -f GeoJSONSeq /vsistdout/ #{path} | gzip -9 > #{dst}\n"
  $stderr.print "#{dst}\n"
}

