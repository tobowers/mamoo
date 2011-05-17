vows = require('vows')
assert = require('assert')
Mamoo = require("../index")

class EventMaker extends Mamoo.Model

vows.describe("jsModel").addBatch(
    "extending": 
        topic: () ->
            Mamoo.Model.extend(
                goodTimes: () ->
                    "are here"
            )
            class FunnyStuff extends Mamoo.Model
            return FunnyStuff
        "should extend the model to a different class": (cls) ->
            assert.instanceOf((new cls)['goodTimes'], Function)
            
).addBatch(
    "change on an instance":
        topic: () ->
            callback = @callback
            obj = new EventMaker()
            obj.on "change", (evt) ->
                callback(null, evt)
            obj.set("dude", true)
            return
        "should have key value": (evt) ->
            assert.equal(evt.key, "dude")
        "should have object that is instance of EventMaker": (evt) ->
            assert.instanceOf(evt.object, EventMaker)
                
            
).export(module)
