#!/usr/bin/env ruby
directory = File.dirname(__FILE__)
require "#{directory}/jsminim.rb"

browser = "mamoo_min.js"
commonjs = "mamoo_min_common.js"

shared_package = ''
Dir.glob("#{directory}/../src/*.js") do |filename|
    puts "processing #{filename}"
    shared_package << JsminImproved.jsmin(File.read(filename))
end

File.open("#{directory}/../#{browser}", "w") do |file|
  file << JsminImproved.jsmin(File.read("#{directory}/../dependencies/event_emitter.js"))
  file << shared_package
end

File.open("#{directory}/../#{commonjs}", "w") do |file|
  file << shared_package
end

puts "building documentation"

`rm -rf #{directory}/../docs && cd #{directory}/jsdoc-toolkit && java -jar jsrun.jar app/run.js -t=templates/jsdoc -d=../../docs/ ../../src/`
