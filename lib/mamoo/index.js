var EventEmitter = require('events').EventEmitter;
var _ = require("underscore");

if (typeof MBX == 'undefined') {
    /** @namespace
        @ignore
    */
    if (typeof _ == 'undefined') {
        throw new Error("Mamoo depends upon the underscore library");
    }
    if (typeof EventEmitter == 'undefined') {
        throw new Error("Mamoo depends upon the EventEmitter library");
    }
    var MBX = global.MBX = {};
    _(MBX).extend(EventEmitter.prototype);
}

require("./js_model.js");
require("./js_controller");
require("./js_view");
require("./queue");
require("./queue_controller");


