if (!("MBX" in window)) {
    /** @namespace
        @ignore
    */
    MBX = {};
}

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
    
    var jsElementClass = '.js_updateable';
    
    /**
        Grab give a model - get a css... pass in "." as the second arg to give it css-style return
        @param {JsModel} model the model you want the css for
        @param {String} prePend any string you want prepended to the return (to avoid "." + MBX.JsView.modelCSS(model))
        @returns {String} a css class for a model
        @name MBX.JsView.modelCSS
        @function
    */
    self.modelCSS = function (model, prePend) {
        prePend = prePend || "";
        return prePend + model.modelName.toLowerCase();
    };
    
    /** given an instance of a model, give the recommended instance class 
        @param {JsModel#instance} instance the JsModel instance
        @param {String} prePend any string you want prepended to the return (to avoid "." + MBX.JsView.modelCSS(model))
        @returns {String} a long-ish css class for a specific instance
        @name MBX.JsView.cssForInstance
        @function
    */
    self.cssForInstance = function (instance, prePend) {
        prePend = prePend || "";
        return prePend + self.modelCSS(instance.parentClass) + "_" + instance.primaryKey().toLowerCase().gsub(/[^\w\-]/, "_");
    };
    
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
        Object.extend(this, opts);
        
        if (this.model) {
            this._subscribeToEvents();
        }
        
        if (typeof this.afterCreate == 'function') {
            this.afterCreate();
        }
    };
    
    View.prototype = /** @lends JsView */{
        
        /** helper function to spit out divs
            @param {String} className the classes you want to add to the div
            @param {Object} opts (optional) any opts to pass to new Element
            @returns div DOM element
        */
        div: function (className, opts) {
            opts = opts || {};
            Object.extend(opts, { className: className });
            return new Element('div', opts);
        },
        
        /** helper function to spit out imageTag
            @param {String} src the url for the image
            @param {Object} opts (optional) any opts to pass to new Element
            @returns img DOM element
        */
        imageTag: function (src, opts) {
            opts = opts || {};
            Object.extend(opts, { src: src });
            return new Element("img", opts);
        },
        
        /** Anytime an instance changes on the model you are observing,
            JsView will fire a function with the object and the key
            @params {JsModel#instance} object the instance that changed
            @params {String} key the key that changed
        */
        _onInstanceChange: function (evt) {
            if (typeof this.onInstanceChange == 'function') {
                this.onInstanceChange(evt.object, evt.key);
            }
        },
        
        _onInstanceCreate: function (evt) {
            if (typeof this.onInstanceCreate == 'function') {
                this.onInstanceCreate(evt.object);
            }
        },
        
        _onInstanceDestroy: function (evt) {
            if (typeof this.onInstanceDestroy == 'function') {
                this.onInstanceDestroy(evt.object);
            }
        },
        
        _onAttributeChange: function (evt) {
            if (typeof this.onAttributeChange == 'function') {
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

            this.eventSubscriptions = [];
            this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX, changeEvent, this._onInstanceChange.bind(this)));
            this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX, newEvent, this._onInstanceCreate.bind(this)));
            this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX, destroyEvent, this._onInstanceDestroy.bind(this)));
            this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX, attributeEvent, this._onAttributeChange.bind(this)));
        },
        
        /** return the CSS class for the model associated with this view
            @param {String} prePend any string to prepend to the model
            @see MBX.JsView.modelCSS
        */
        modelCSS: function (prePend) {
            return MBX.JsView.modelCSS(this.model, prePend);
        },
        
        /** given an instance of a model, give the recommended instance class
            @see MBX.JsView.cssForInstance
        */
        cssForInstance: function (instance, prePend) {
            return MBX.JsView.cssForInstance(instance, prePend);
        },
        
        /** given an instance, return the relevent elements
            @param {JsModel#instance} instance the instance you want to find elements
            @returns {Array} an array of extended dom elements that match the relevent class names
        */
        elementsFromInstance: function (instance) {
            return $$(this.modelCSS(".") + " " + cssForInstance("."));
        },
        
        /** return all the various collections of dom elements that have the appropriate classes
            @returns {Array} array of extended dom elements that match collection CSS
        */
        domCollections: function () {
            var findString = [jsElementClass, this.modelCSS("."), '.collection'].join('');
            return $$(findString);
        }
        
    };
    
    /** create a new view handler... specify a model and some
        functions and some great magic happens
        @name MBX.JsView.create
        @function
        @param {Object} opts the various options specified for a view
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
        Object.extend(View.prototype, methsAndAttrs);
    };
    
    /** Added to prototype elements when a view is created
        allows you to observe particular keys of a model object
        @name MBX.JsView.updatesOn
        @function
        @param {JsModel#instance} obj the model instance to watch
        @param {String} key the key to watch
        @param {Object} opts handler or preProcess functions to execute
        @returns {DOM element} the dom element that was called (for chaining)
    */
    self.updatesOn = function (element, obj, key, opts) {
        if (!obj || !key) {
            throw new Error("You must specify a key or an object with updatesOn");
        }
        element = $(element);
        opts = opts || {};
        
        var changeHandler = function (evt) {
            var content = obj.get(key);
            if (opts.preProcess) {
                content = opts.preProcess(obj, content, key);
            }
            if (opts.handler) {
                opts.handler(obj, element, content);
            } else {
                element.update(content);
            }
        };
        
        var sub = MBX.EventHandler.subscribe(obj, key + "_changed", changeHandler);
        
        element.__JsViewSubscriptions = element.__JsViewSubscriptions || [];       
        element.__JsViewSubscriptions.push(sub);
        
        obj.__JsViewSubscriptions = obj.__JsViewSubscriptions || [];
        obj.__JsViewSubscriptions.push(sub);
        
        if (opts.updateNow) {
            changeHandler();
        }
        
        return element;
    };
    
    /** stop updating this instance, all event handlers are removed
        Preferred method of accessing this function is through extended elements
        @name MBX.JsView.stopUpdating
        @function
        @param {DOM Element} element the element to stop observing - this will usually be filled for you by prototype
        @returns {DOM Element} element for chaining
        @example
          $("el").stopUpdating();
    */
    self.stopUpdating = function (element) {
        element = $(element);
        if (element.__JsViewSubscriptions) {
            while (element.__JsViewSubscriptions.length > 0) {
                MBX.EventHandler.unsubscribe(element.__JsViewSubscriptions.pop());
            }
        }
        return element;
    };
    
    /** attach a JsModel#instance to this DOM element
        Preferred method of accessing this function is through extended elements
        @name MBX.JsView.assignInstance
        @function
        @example
          $("el").assignInstance(instance);
          $("el").getInstance();  // == instance
    */
    self.assignInstance = function (element, instance) {
        element = $(element);
        element.__JsViewMvcInstance = instance;
        element.addClassName(MBX.JsView.modelCSS(instance.parentClass));
        element.addClassName(MBX.JsView.cssForInstance(instance));
        return element;
    };
    
    /** fetch a JsModel#instance from this DOM element
        Preferred method of accessing this function is through extended elements
        @name MBX.JsView.getInstance
        @function
        @example
          $("el").assignInstance(instance);
          $("el").getInstance();  // == instance
    */
    self.getInstance = function (element, instance) {
        return element.__JsViewMvcInstance;
    };
    
    Element.addMethods({
        updatesOn: self.updatesOn,
        stopUpdating: self.stopUpdating,
        assignInstance: self.assignInstance,
        getInstance: self.getInstance
    });
    
    return self;
})();
