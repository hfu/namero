# find features that were assigned the layner name 'other'
require 'find'
require 'zlib'
require 'json'

$dict = Hash.new{|h, k| h[k] = 0}
Find.find('dst') {|path|
  next unless /ndjson\.gz$/.match path
  Zlib::GzipReader.open(path).each{|l|
    f = JSON.parse(l)
    $dict[f['properties']['ftCode']] += 1 if f['tippecanoe']['layer'] == 'other'
    # p f if f['properties']['ftCode'] == '300'
  }
  p $dict
}
