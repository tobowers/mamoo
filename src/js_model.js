/**
    use this as a more convienient (sometimes) method instead of .prototype.blah.prototype chaining.  It tends
    to be a real javascript way of sub-classing

    @parm {Object} o the original object
    @returns a new object with the original object as a prototype
*/
MBX.Constructor = function (o) {
    function F() {}
    F.prototype = o;
    return new F();
};

/**
    Use this to create instances of models and extend all models (and instances of all models)
    @class
*/
MBX.JsModel = (function () {
    /**
        @memberof MBX.JsModel
        @namespace
    */
    var publicObj = {};
    var currentGUID = 0;
    
    /** used internally to prevent name collision 
        @private
    */
    var modelCache = {};
    
    /**
        Instances of a Model
        @name JsModel#instance
        @class A single instance of a Model
        @see MBX.Constructor
    */
    var oneJsModelInstance = 
        /** @lends JsModel#instance */
        {
        /**
            Use this to set attributes of an instance (rather than set them directly).
            It will automatically create events that will be relevant to controllers
            @param {String} key the key of the attribute
            @param value the value to be assigned to the attribute
            @example
              modelInstance.set('myAttr', 'foo');
              modelInstance.get('myAttr', 'foo');
        */
        set: function (key, value) {
            var changed = false;
            if (this.attributes[key] != value) {
                changed = true;
            }
			var oldValue = this.attributes[key];
            this.attributes[key] = value;
            if (changed) {
				if (key == this.parentClass.primaryKey) {
					this._handlePrimaryKeyChange(oldValue, value);
				}
                this._fireChangeEvent(key);
            }
            return this;
        },
        
        /**
            Use to manually fire a change event on an attribute.
            @param {String} key the key of the attribute you want to fire the enent on
            @example
              modelInstance.touch("myAttr");
        */
        touch: function (key) {
            this._fireChangeEvent(key);
        },
        
        /**
            Use this to retreive attributes on an object (rather than accessing them directly);
            @param {String} key
            @example
              modelInstance.set('myAttr', 'foo');
              modelInstance.get('myAttr', 'foo');
        */
        get: function (key) {
            return this.attributes[key];
        },
        
        /**
            Take an Object literal and update all attributes on this instance
            @param {Object} obj the attributes to update as key, value
        */
        updateAttributes: function (obj) {
            obj = obj || {};
            for (k in obj) {
                if (obj.hasOwnProperty(k)) {
                    this.set(k, obj[k]);
                }
            }
        },
        
        /**
            You should always use this to refer to instances.
            Model.find uses this to grab objects from the instances 
            @returns returns the primaryKey of the instance
            @see JsModel.find
        */
        primaryKey: function () {
            if (this.parentClass.primaryKey) {
                return this.get(this.parentClass.primaryKey);
            } else {
                return this.GUID;
            }
        },
        
        /**
            destroy this instance - works just like rails #destroy will fire off the destroy event as well
            controllers will receive this event by default
        */
        destroy: function () {
            delete this.parentClass.instanceCache[this.primaryKey()];
            this.__MBXJsModelWasDestroyed = true;
            MBX.emit(this.parentClass.Event.destroyInstance, { object: this });
        },
        
        
        /** has this instance been destroyed?
            basically - things can keep a reference to objects that have actually been destroyed
            this method will let you know if the instance still exists in the model
        */
        isDestroyed: function () {
            return this.__MBXJsModelWasDestroyed;
        },
 
        /**
            listen to an attribute of a model.  The event passed to your listener will look like
			{
				object: //the instance that change,
				key: 'the key that changed'
			}
            @params key {String} the key to listen to
            @params func {Function} the function to pass to the EventHandler
            @returns an EventHandler subscription object
            @see MBX.EventHandler
        */
        observe: function (key, func) {
            return this.on(key + "_changed", func);
        },
        
        /** @private */
        _createGUID: function () {
            this.GUID = this.parentClass.modelName + "_" + MBX.JsModel.nextGUID();
        },
        
        _fireChangeEvent: function (key) {
            if (!this.isDestroyed()) {
                var changeObject = {
                    object: this,
                    key: key
                };
                MBX.emit(this.parentClass.Event.changeInstance, changeObject);
                this.emit(key + "_changed", changeObject);
            }
        },

		_handlePrimaryKeyChange: function (oldValue, newValue) {
			var instanceCache = this.parentClass.instanceCache;
			if (instanceCache[oldValue]) {
				delete instanceCache[oldValue]
				instanceCache[newValue] = this;
			}
		}

    };

    _(oneJsModelInstance).extend(EventEmitter.prototype);

    /** 
        @class A single instance of MBX.JsModel
        @constructor
        @throws an error if there's no name, a name already exists or you specified a primaryKey and it wasn't a string
    */
    var JsModel = function (name, opts) {
        opts = opts || {};
        if (!name) {
            throw new Error("A name must be specified");
        }
        if (modelCache[name]) {
            throw new Error("The model: " + name + " already exists");
        }
        if (opts.primaryKey && (typeof opts.primaryKey != "string")) {
            throw new Error("primaryKey specified was not a string");
        }
        _(this).extend(opts);
        
        /** the model name of this model
            @type String
        */
        this.modelName = name;
        
        /** the instances of this model
            @private
        */
        this.instanceCache = {};
        
        /** class level attributes */
        this.attributes = {};
        
        this.prototypeObject = MBX.Constructor(oneJsModelInstance);
        
        /**
            instances get their parentClass assigned this model
            @name JsModel#instance.parentClass
            @type JsModel
        */
        this.prototypeObject.parentClass = this;
        
        /** events that this model will fire. Use this to hook into (at a very low level) events
            @example
              MBX.on(MyModel.Event.newInstance, function (instance) { // dostuff } );
        */
        this.Event = {
            newInstance: this.modelName + "_new_instance",
            changeInstance: this.modelName + "_change_instance",
            destroyInstance: this.modelName + "_destroy_instance",
            changeAttribute: this.modelName + "_change_attribute"
        };
        
        /** add an instanceMethods attribute to the passed in attributes in order to extend
            all instances of this model.  You can also specify default attributes by adding
            a defaults attribute to this attribute.
            @type Object
            @name JsModel.instanceMethods
            @example
              MyModel = MBX.JsModel.create("MyModel", {
                  instanceMethods: {
                      defaults: {
                          myAttribute: "myDefault"
                      },
                      myMethod: function (method) {
                          return this.get('myAttribute');
                      }
                  }
              });
              MyModel.create().myMethod() == "myDefault";
        */
        if (opts.instanceMethods) {
            _(this.prototypeObject).extend(opts.instanceMethods);
        }
        
        modelCache[name] = this;
        
        if (typeof this.initialize == "function") {
            this.initialize();
        }
        
        MBX.emit("new_model", {
            object: this
        });
    };
    
    JsModel.prototype = {
        /**
            Create an instance of the model
            @param {Object} attrs attributes you want the new instance to have
            @returns JsModel#instance
            @throws "trying to create an instance with the same primary key as another instance"
                if you are trying to create an instance that already exists
            @example
              MyModel = MBX.JsModel.create("MyModel");
              var instance = MyModel.create({
                  myAttr: 'boo'
              });
              instance.get('myAttr') == 'boo';
        */
        create: function (attrs) {
            attrs = attrs || {};
            var obj = MBX.Constructor(this.prototypeObject);
            obj.errors = null;
            obj.attributes = {};
            if (obj.defaults) {
                _(obj.attributes).extend(obj.defaults);
                _(obj.attributes).each(function (value, key) {
                    if (_(value).isArray()) {
                        obj.defaults[key] = _(value).clone();
                    } else {
                        if (value != null && typeof value == "object") {
                            obj.defaults[key] = _.clone(value);
                        }
                    }
                });
            }
            _(obj.attributes).extend(attrs);
            if (typeof obj.beforeCreate == 'function') {
                obj.beforeCreate();
            }
            
            if (!obj.errors) {
                if (this.validateObject(obj)) {
                    obj._createGUID();
                    this.cacheInstance(obj);
                    MBX.emit(this.Event.newInstance, {
                        object: obj
                    });
                    if (typeof obj.afterCreate == "function") {
                        obj.afterCreate();
                    }
                    return obj;
                } else {
                    throw new Error("trying to create an instance of " + this.modelName + " with the same primary key: '" + obj.get(this.primaryKey) + "' as another instance. Caller was: " + arguments.callee.caller.toString());
                }
            } else {
                MBX.emit(this.Event.newInstance, {
                    object: obj
                });
                return obj;
            }
        },
        
        /** this method to get extended later.  Used mostly internally.  Right now it only verifies
            that a primaryKey is allowed to be used
            @param {JsModel#instance} instance the instance that's being validated
        */
        validateObject: function (instance) {
            // temporarily - this only will validate primary keys
            if (this.primaryKey) {
                if (!instance.get(this.primaryKey)) {
                    return false;
                }
                if (this.find(instance.get(this.primaryKey))) {
                    return false;
                }
            }
            
            return true;
        },
        
        /** use this to extend all instances of a single model
            @param {Object} attrs methods and attributes that you want to extend all instances with
        */
        extendInstances: function (attrs) {
            attrs = attrs || {};
            _(this.prototypeObject).extend(attrs);
        },
        
        /** store the instance into the cache. this is mostly used internally
            @private
        */
        cacheInstance: function (instance) {
            if (this.primaryKey) {
                this.instanceCache[instance.get(this.primaryKey)] = instance;
            } else {
                this.instanceCache[instance.GUID] = instance;
            }
        },
        
        /** find a single instance
            @param {String} primaryKey a JsModel#instance primaryKey
            @returns an instance of this element
            @see JsModel#instance.primaryKey
        */
        find: function (primaryKey) {
            return this.instanceCache[primaryKey];
        },
        
        /** @returns all instances of this model */
        findAll: function () {
            return _(this.instanceCache).values();
        },
        
        /** destroy all instances in the instance cache */
        flush: function () {
            this.instanceCache = {};
        },

        /** Gives back the number of cached instances stored in this model
            @returns {number} number of instances   */
        count: function () {
            return this.findAll().length;
        },
        
        /**
            Use this to set attributes of the model itself (rather than set them directly).
            It will automatically create events that will be relevant to controllers
            @param {String} key the key of the attribute
            @param value the value to be assigned to the attribute
            @see MBX.JsModel.get
            @example
              Model.set('myAttr', 'foo');
              Model.get('myAttr', 'foo');
        */
        set: function (key, value) {
            var changed = false;
            if (this.attributes[key] != value) {
                changed = true;
            }
            this.attributes[key] = value;
            if (changed) {
                this._fireChangeEvent(key);
            }
        },

		
        /**
            Use to manually fire a change event on an attribute of a model.
            @param {String} key the key of the attribute you want to fire the enent on
            @example
              Model.touch("myAttr");
        */
        touch: function (key) {
             this._fireChangeEvent(key);
        },
        
        /**
            Use this to retreive attributes on a Model (rather than accessing them directly);
            @param {String} key
            @see MBX.JsModel.set
            @example
              Model.set('myAttr', 'foo');
              Model.get('myAttr', 'foo');
        */
        get: function (key) {
            return this.attributes[key];
        },
        /**
            A convenience method to subscribe to new model instances
            @example
              AModel.onInstanceCreate(function (evt) { console.log(evt) });
        */
        onInstanceCreate: function (func) {            
            return MBX.on(this.Event.newInstance, func);
        },
        
        /**
            A convenience method to subscribe to destroying model instances
            @example
              AModel.onInstanceDestroy(function (evt) { console.log(evt); });
        */
        onInstanceDestroy: function (func) {
            return MBX.on(this.Event.destroyInstance, func);
        },
        
        /**
            A convenience method to subscribe to changing model instances
            @example
              AModel.onInstanceChange(function (evt) { console.log(evt); });
        */
        onInstanceChange: function (func) {
            return MBX.on(this.Event.changeInstance, func);
        },
        
        
        /**
            A convenience method to subscribe to changing model attributes
            @example
                AModel.onAttributeChange(function (evt) { console.dir(evt); });
        */
        onAttributeChange: function (func) {
            return MBX.on(this.Event.changeAttribute, func);
        },

		_fireChangeEvent: function (key) {
			MBX.emit(this.Event.changeAttribute, {
                object: this,
                key: key
            });
            //console.log("fire change event on ", key, " on obj ", this);
            this.emit(key + "_changed", {object: this});
		}
    };

    _(JsModel.prototype).extend(EventEmitter.prototype);

    publicObj.Event = {
        newModel: "new_model"
    };
    
    /**
        Used for creating a new JsModel
        @name MBX.JsModel.create
        @function
        
        @param {String} name model name used to prevent name collision
        @param {Object} opts defaults to {}
        
        @constructs
        @example
          var MyModel = MBX.JsModel.create("MyModel");
          var instance = MyModel.create();
    */
    publicObj.create = function (name, opts) {
        return new JsModel(name, opts);
    };
    
    /**
       Used internally to find the next GUID
       @private
    */
    publicObj.nextGUID = function () {
        return currentGUID++;
    };
    
    /**
        Extends all JsModels
        @name MBX.JsModel.extend
        @function
        @param {Object} methsAndAttrs the methods and attributes to extend all models with
    */
    publicObj.extend = function (methsAndAttrs) {
        methsAndAttrs = methsAndAttrs || {};
        _(JsModel.prototype).extend(methsAndAttrs);
    };
    
    /**
        Extend all instances of all models
        @name MBX.JsModel.extendInstancePrototype
        @function
        @param {Object} methsAndAttrs the methods and attributes to extend all models' instances with
    */
    publicObj.extendInstancePrototype = function (methsAndAttrs) {
        _(oneJsModelInstance).extend(methsAndAttrs);
    };
    
    /**
           Destroy a model
           @param {String} name the name of the model
           @name MBX.JsModel.destroyModel
           @function
   */
    publicObj.destroyModel = function (name) {
        delete modelCache[name];
    };
    
    return publicObj;
})();
