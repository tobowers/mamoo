(function () {
    var Binder = function (modelObj, modelKey, targetObj, targetAttribute, opts) {
        opts = opts || {};
        this.targetObj = targetObj;
        this.modelObj = modelObj;
        this.modelKey = modelKey;
        this.targetAttribute = targetAttribute;
        this.opts = opts;
        this.eventKey = this.modelKey + "_changed";
        this.handleChange = _(this.handleChange).bind(this);
        return this;
    };

    //handler receives (payload, targetObj, targetAttribute, model, key);
    Binder.prototype.handleChange = function (payload) {
        var data = this.modelObj.get(this.modelKey);
//        console.log("handling change", data);
        if (this.opts.preProcess) {
            data = this.opts.preProcess(data);
        }
        if (this.opts.handler) {
            this.opts.handler(data, this.targetObj, this.targetAttribute, this.modelObj, this.modelKey);
        } else {
            this.targetObj[this.targetAttribute] = data;
        }
    };

    Binder.prototype.listen = function () {
//        console.log("listening to", this.eventKey);
        this.modelObj.on(this.eventKey, this.handleChange);
        return this;
    };

    Binder.prototype.stopUpdating = function () {
        this.modelObj.removeListener(this.eventKey, this.handleChange);
    };



    var updaterFunc = function (key, opts) {
            var binder = new Binder(this, key, opts.object, opts.attribute, opts);
            binder.listen();
            return binder;
    };

    MBX.JsModel.extend({
        updatesOn: updaterFunc
    });

    MBX.JsModel.extendInstancePrototype({
        updatesOn: updaterFunc
    })

})();
