#!/usr/bin/ruby

puts `rm -rf ../docs && cd jsdoc-toolkit && java -jar jsrun.jar app/run.js -t=templates/jsdoc -d=../../docs/ ../../src/`
