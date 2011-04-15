/**
    Create and extend controllers
    @class
*/
var MBX = global.MBX;

var EventEmitter = require('events').EventEmitter;
var _ = require("underscore");

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
    var JsController = function (name, opts) {
        opts = opts || {};
        if (!name) {
            throw new Error("A name must be specified");
        }
        if (controllerCache[name]) {
            throw new Error("A controller by that name exists");
        }
        
        this.controllerName = name;
        _(this).extend(opts);
        if (this.model) {
            this._subscribeToEvents();
        }
        controllerCache[name] = this;
        
        MBX.emit(publicObj.Event.newController, {
            object: this
        });
    };

    _(JsController.prototype).extend(EventEmitter.prototype);
    
    _(JsController.prototype).extend(
        /** @lends JsController */
        {
            
        active: true,
        
        /** reactivate event listening on this controller
        */
        activate: function () {
            this.active = true;
        },
        
        /** quiets all events on this controller, your callbacks will
            not get called
        */
        deactivate: function () {
            this.active = false;
        },   
        
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
            if (this.onInstanceChange && this.active) {
                this.onInstanceChange(evt.object, evt.key);
            }
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
        */
        _onInstanceCreate: function (evt) {            
            if (this.onInstanceCreate && this.active) {
                this.onInstanceCreate(evt.object);
            }     
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
        */
        _onInstanceDestroy: function (evt) {
            if (this.onInstanceDestroy && this.active) {
                this.onInstanceDestroy(evt.object);
            }
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
        */
        _onAttributeChange: function (evt) {
            if (this.active && typeof this.onAttributeChange == 'function') {
                this.onAttributeChange(evt.key);
            }
        },
        
        /**
            @private
            @requires MBX.JsModel
            @requires this.model
            
        */
        _subscribeToEvents: function () {
            var model = this.model;
            if (!_(model).isArray()) {
               model = [model];
            }

            this.eventSubscriptions = [];

            _(model).each(_(function (model) {
                var changeEvent = model.Event.changeInstance;
                var newEvent = model.Event.newInstance;
                var destroyEvent = model.Event.destroyInstance;
                var attributeEvent = model.Event.changeAttribute;
                //var defer = this.looselyCoupled;

                var onInstanceChange =  _(this._onInstanceChange).bind(this);
                var onInstanceCreate =  _(this._onInstanceCreate).bind(this);
                var onInstanceDestroy = _(this._onInstanceDestroy).bind(this);
                var onAttributeChange = _(this._onAttributeChange).bind(this);
                MBX.on(changeEvent, onInstanceChange);
                this.eventSubscriptions.push({name: changeEvent, handler: onInstanceChange});

                MBX.on(newEvent, onInstanceCreate);
                this.eventSubscriptions.push({name: newEvent, handler: onInstanceCreate});

                MBX.on(destroyEvent, onInstanceDestroy);
                this.eventSubscriptions.push({name: destroyEvent, handler: onInstanceDestroy});

                MBX.on(attributeEvent, onAttributeChange);
                this.eventSubscriptions.push({name: attributeEvent, handler: onAttributeChange});

            }).bind(this));
        },

        _unsubscribeToEvents: function () {
            if (this.eventSubscriptions && this.eventSubscriptions[0]) {
                _(this.eventSubscriptions).each(function (obj) {
                    MBX.removeListener(obj.name, obj.handler);
                });
            }
        }
    });
    
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
        _(JsController.prototype).extend(methsAndAttrs);
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
    
    /**
        Controllers allow some decently powerful hooks. You can specify a model, and an
        onInstanceChange, onInstanceDestroy, onInstanceCreate.
        
        If your controller listens to a model, but you are not dependent on real-time updates,
        you can add the option "looselyCoupled: true" and all updates will be done with
        setTimeout, which will be a performance enhancement.
          
        @name MBX.JsController.create
        @param {String} name the name of the controller
        @param {Object} opts used to extend the controller methods at instantiation
        @see JsController
        @function
        @example
          MBX.DesktopUploadController = MBX.JsController.create("DesktopUpload", {
              looselyCoupled: false, // false is the default
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
        if (typeof controller.initialize == "function") {
            controller.initialize();
        }
        return controller;
    };
    
    return publicObj;
})();
