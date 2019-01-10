throw "use modularize.js instead of this."
require 'find'
print "rm dst/*\n"

%w{200000 25000}.each {|scale|
  Find.find(scale) {|path|
    next unless /ndjson.gz$/.match path
    print "node mod.js #{path} #{scale}\n"
  }
}
