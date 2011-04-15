/** this is the view part of the MVC framework
    handle updates and creations and deletes of registered
    objects and classes
    @namespace
*/
MBX.JsView = (function () {
    /**
        @memberof MBX.JsView
        @namespace
    */
    var self = {};
    
    /** @class A single view instance
        @constructor
        @name JsView
        @example
            MBX.JsView.create({
                model: MBX.DesktopUpload,
                onCreate: function (upload) {
                    //create the upload
                },
                onChange: function (upload) {
                    // any upload changes
                },
                onDestroy: function (upload) {
                    // handle destroys
                }
            });
    */
    var View = function (opts) {
        opts = opts || {};
        _(this).extend(opts);
        
        if (this.model) {
            this._subscribeToEvents();
        }
        
        if (typeof this.initialize == 'function') {
            this.initialize();
        }
    };
    
    View.prototype = /** @lends JsView */{
        active: true,
        
        /** reactivate event listening on this view
        */
        activate: function () {
            this.active = true;
        },
        
        /** quiets all events on this view, your callbacks will
            not get called
        */
        deactivate: function () {
            this.active = false;
        },
        
        /** Anytime an instance changes on the model you are observing,
            JsView will fire a function with the object and the key
            @params {JsModel#instance} object the instance that changed
            @params {String} key the key that changed
        */
        _onInstanceChange: function (evt) {
            if (this.active && typeof this.onInstanceChange == 'function') {
                this.onInstanceChange(evt.object, evt.key);
            }
        },
        
        _onInstanceCreate: function (evt) {
            if (this.active && typeof this.onInstanceCreate == 'function') {
                this.onInstanceCreate(evt.object);
            }
        },
        
        _onInstanceDestroy: function (evt) {
            if (this.active && typeof this.onInstanceDestroy == 'function') {
                this.onInstanceDestroy(evt.object);
            }
        },
        
        _onAttributeChange: function (evt) {
            if (this.active && typeof this.onAttributeChange == 'function') {
                this.onAttributeChange(evt.key);
            }
        },
        
        /** subscribe to change, create, destroy events
            We assume you don't need your UI elements to update at the expense of user interaction
            hence the defer: true
        */
        _subscribeToEvents: function () {
            var changeEvent = this.model.Event.changeInstance;
            var newEvent = this.model.Event.newInstance;
            var destroyEvent = this.model.Event.destroyInstance;
            var attributeEvent = this.model.Event.changeAttribute;
            var defer = this.looselyCoupled;
            
            MBX.on(changeEvent, _(this._onInstanceChange).bind(this));
            MBX.on(newEvent, _(this._onInstanceCreate).bind(this));
            MBX.on(destroyEvent, _(this._onInstanceDestroy).bind(this));
            MBX.on(attributeEvent, _(this._onAttributeChange).bind(this));
        }
        
    };
    
    /** create a new view handler... specify a model and some
        functions and some great magic happens.
        
        If your view listens to a model, but you are not dependent on real-time updates,
        you can add the option "looselyCoupled: true" and all updates will be done with
        setTimeout, which will be a performance enhancement.
        
        @name MBX.JsView.create
        @function
        @param {Object} opts the various options specified for a view
        @example
            MBX.JsView.create({
                model: MBX.DesktopUpload,
                looselyCoupled: false, // false is the default
                onCreate: function (upload) {
                    //create the upload
                },
                onChange: function (upload) {
                    // any upload changes
                },
                onDestroy: function (upload) {
                    // handle destroys
                }
            });
    */
    self.create = function (opts) {
        return new View(opts);
    };
    
    /**
        call extend() to add methods and/or attributes to ALL views
        @param {Object} methsAndAttrs
        @name MBX.JsView.extend
        @function
    */
    self.extend = function (methsAndAttrs) {
        methsAndAttrs = methsAndAttrs || {};
        _(View.prototype).extend(methsAndAttrs);
    };

    _(View.prototype).extend(EventEmitter.prototype);
    
    return self;
})();
