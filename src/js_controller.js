if (!("MBX" in window)) {
    /** @namespace 
        @ignore
    */
    MBX = {};
}

/**
    Create and extend controllers
    @class
*/
MBX.JsController = (function () {
    /**
        public methods of JsController
        @memberof MBX.JsController
        @namespace
    */
    var publicObj = {};
    
    /**
        used to cache instances of controllers and stop name collisions
        @memberof MBX.JsController
        @private
    */
    var controllerCache = {};
    
    
    /** @private */
    var jsElementClass = '.js_updateable';
    
    /**
        The instance that gets created from calling
        MBX.JsController.create(name, opts)
        @see MBX.JsController
        @name JsController
        @class
    */
    JsController = function (name, opts) {
        opts = opts || {};
        if (!name) {
            throw new Error("A name must be specified");
        }
        if (controllerCache[name]) {
            throw new Error("A controller by that name exists");
        }
        
        this.controllerName = name;
        Object.extend(this, opts);
        if (opts.model) {
            this._subscribeToEvents();
        }
        controllerCache[name] = this;
        
        MBX.EventHandler.fireCustom(MBX, publicObj.Event.newController, {
            object: this
        });
    };
    
    JsController.prototype = 
        /** @lends JsController */
        {
        /**
            If you have passed in a function for onInstanceChange
            then this will pass the object and the key that changed to
            your function
            @requires MBX.JsModel
            @requires this.model
            @see JsModel#instance
            @example
              myController = MBX.JsController.create("myController", {
                  onInstanceChange: function (modelInstance, key) {
                      // where key will be the attribute (string)
                      // that has changed on the modelInstance (JsModel#instance)
                  }
              });
        */
        _onInstanceChange: function (evt) {
            if (this.onInstanceChange) {
                this.onInstanceChange(evt.object, evt.key);
            }
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
        */
        _onInstanceCreate: function (evt) {            
            if (this.onInstanceCreate) {
                this.onInstanceCreate(evt.object);
            }     
        },
        
        fireAfterRender: function () {
            MBX.EventHandler.fireCustom(MBX, this.controllerName + "_" + MBX.JsController.Event.afterRender);
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
        */
        _onInstanceDestroy: function (evt) {
            if (this.onInstanceDestroy) {
                this.onInstanceDestroy(evt.object);
            }
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
        */
        _onAttributeChange: function (evt) {
            if (typeof this.onAttributeChange == 'function') {
                this.onAttributeChange(evt.key);
            }
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
            
        */
        _subscribeToEvents: function () {
            var changeEvent = this.model.Event.changeInstance;
            var newEvent = this.model.Event.newInstance;
            var destroyEvent = this.model.Event.destroyInstance;
            var attributeEvent = this.model.Event.changeAttribute;
            var defer = this.loosleyCoupled;

            this.eventSubscriptions = [];
            this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX, changeEvent, this._onInstanceChange.bind(this), {defer: defer}));
            this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX, newEvent, this._onInstanceCreate.bind(this), {defer: defer}));
            this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX, destroyEvent, this._onInstanceDestroy.bind(this), {defer: defer}));
            this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX, attributeEvent, this._onAttributeChange.bind(this), {defer: defer}));
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
        */
        _unsubscribeToEvents: function () {
            if (this.eventSubscriptions && this.eventSubscriptions[0]) {                
                this.eventSubscriptions.each(function (subscription) {
                    MBX.EventHandler.unsubscribe(subscription);
                });
            }
        }
    };
    
    /**
        This is mostly used internally and is fired on MBX everytime a controller is created
        @memberOf MBX.JsController
        @name MBX.JsController.Event
    */
    publicObj.Event = {
        newController: "new_controller",
        afterRender: "render_finished"
    };
    
    /**
        call extend() to add methods and/or attributes to ALL controllers
        @param {Object} methsAndAttrs
        @name MBX.JsController.extend
        @function
    */
    publicObj.extend = function (methsAndAttrs) {
        methsAndAttrs = methsAndAttrs || {};
        Object.extend(JsController.prototype, methsAndAttrs);
    };
    
    /**
        Controllers allow some decently powerful hooks. You can specify a model, and an
        onAfterCreate, onInstanceChange, onInstanceDestroy, onInstanceCreate.
        
        If your controller listens to a model, but you are not dependent on real-time updates,
        you can add the option "looselyCoupled: true" and all updates will be done with
        setTimeout... which will be a performance enhancement.
          
        @name MBX.JsController.create
        @param {String} name the name of the controller
        @param {Object} opts used to extend the controller methods at instantiation
        @see JsController
        @function
        @example
          MBX.DesktopUploadController = MBX.JsController.create("DesktopUpload", {
              ANewMethod: function (something) {
                  return something;
              }
          })
          MBX.DesktopUpload.ANewMethod("boo") == "boo";
        @example
          MBX.DesktopUploadController = MBX.JsController.create("DesktopUpload", {
              model: MBX.DesktopUpload,
              onInstanceCreate: function (instance) {
                  alert(instance.get('greeting'));
              }              
          });
          MBX.DesktopUpload.create({ greeting: 'hi' });  // will alert('hi');
        @example
          MBX.DesktopUploadController = MBX.JsController.create("DesktopUpload", {
              model: MBX.DesktopUpload,
              onInstanceChange: function (instance) {
                  alert(instance.get('greeting'));
              }              
          });
          var instance = MBX.DesktopUpload.create();
          instance.set('greeting', 'hi');  // will alert('hi')
    */
    publicObj.create = function (name, opts) {
        if (controllerCache[name]) {
            throw new Error("A controller with the name of " + name + " is already in use");
        }
        var controller = new JsController(name, opts);
        if (typeof controller.afterCreate == "function") {
            controller.afterCreate();
        }
        return controller;
    };
    
    /**
        Destroy a controller and unsubscribe its event listeners
        @param {String} name the name of the controller
        @name MBX.JsController.destroyController
        @function
    */
    publicObj.destroyController = function (name) {
        if (controllerCache[name]) {
            controllerCache[name]._unsubscribeToEvents();
            delete controllerCache[name];
        }
    };
    
    return publicObj;
})();
