#!/usr/bin/ruby

directory = File.dirname(__FILE__)
puts "rm -rf #{directory}/../docs && cd #{directory}/jsdoc-toolkit && java -jar jsrun.jar app/run.js -t=templates/jsdoc -d=../../docs/ ../../src/"

puts `rm -rf #{directory}/../docs && cd #{directory}/jsdoc-toolkit && java -jar jsrun.jar app/run.js -t=templates/jsdoc -d=../../docs/ ../../src/`
