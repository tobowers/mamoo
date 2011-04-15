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
    MBX = {};
    _(MBX).extend(EventEmitter.prototype);
}
