#!/usr/bin/env ruby
directory = File.dirname(__FILE__)
require "#{directory}/jsminim.rb"

filename = "mamoo_min.js"
puts "Creating '#{directory}/../#{filename}'"

File.open("#{directory}/../#{filename}", "w") do |file|
  Dir.glob("#{directory}/../src/*.js") do |filename|
    puts "processing #{filename}"
    file << JsminImproved.jsmin(File.read(filename))
  end
end

puts "building documentation"

`rm -rf #{directory}/../docs && cd #{directory}/jsdoc-toolkit && java -jar jsrun.jar app/run.js -t=templates/jsdoc -d=../../docs/ ../../src/`
