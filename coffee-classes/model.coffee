require "events"
EventEmitter = require('events').EventEmitter

class Model extends EventEmitter
    constructor: (opts) ->
        @attributes = {}
        
    set: (key, value) =>
        oldValue = @attributes[key]
        @attributes[key] = value
        @_fireChangeEvent(key) if oldValue isnt value
        
        
    _fireChangeEvent: (key) =>
        @emit "change", {key: key, object: this}
        Model.emit "change", {key: key, object: this}
        return
    ###*
        Extend all instances of all models using the passed in opts object
        @param {Object} hash of keys you would like each model to have
    ###    
    @extend: (opts) =>
        for own key,value of opts
            do (key, value) =>
                @.prototype[key] = value
    @create: (opts) ->
        new this(opts)
    @emit: () ->
        EventEmitter.prototype.emit.apply(this, arguments)
                
exports = module.exports = Model
