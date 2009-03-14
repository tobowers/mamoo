/**  event_handler
    @version 1.4
 *  @requires Prototype 1.6.0
 
 *  Copyright (c) 2008 Motionbox, Inc.
 *
 *  event_handler is freely distributable under
 *  the terms of an MIT-style license.
 *
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 *
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *  For details, see the web site: http://code.google.com/p/motionbox
 *
 *
 *  @author Richard Allaway, Topping Bowers, Baldur Gudbjornsson, Matt Royal
 *
 *  MBX.event_handler is an implementation of event delegation based on the
 *  prototype library. It also supports events on objects
 *  Readme:  http://code.google.com/p/motionbox/wiki/EventHandlerDocumentation
 *  API:
 *
 *  MBX.event_handler has the following three public functions:
 *
 *  subscribe(specifiers, eventTypes, functionsToCall)
 *    specifiers = a string (or optional array of strings) specifying a class, id, or object to subscribe to
 *    eventTypes = a string (or optional array of strings) specifying the name of the events to subscribe to
 *    functionsToCall = a function (or optional array of functions) to call upon receiving the event.
 *                      These functions should accept an Event as their first argument.
 *    --
 *    returns: handlerObj
 *
 *  unsubscribe(handlerObj)
 *    handlerObj = the object returned by the subscribe function
 *
 *  fireCustom(target, eventName, opts)
 *    target = DOM element
 *    eventName = the name of the event to fire (eg, "click" or "my_custom_event")
 *    opts = optional object with which to extend the event that is fired
 *--------------------------------------------------------------------------*/
  
if (!("MBX" in window)) {
    /** @namespace
    */
    MBX = {};
}

/**  @class EventHandler
     @name MBX.EventHandler */
MBX.EventHandler = (function () {
    /** @namespace 
        @name MBX.EventHandler
    */
    var self = {};
    /** 
        This is provided as the last Prototype specific
        hold out. Replace here to use other libraries
        @name MBX.EventHandler.isIE
    */
    self.isIE = Prototype.Browser.IE;
    
    /** @namespace 
        @name MBX.EventHandler.EventBox
        @description
          The event box is a pluggable "box" that by default
          uses Prototype to extend events and grab elements from
          the events.  Extending the EventHandler to support other
          javascript libraries only requires swapping out this box
          and exposing the same public functions
    */
    self.EventBox = (function () {
        var self = {};
        
        self.isIE = Prototype.Browser.IE;
        
        var browserLikeEventExtender = {
            preventDefault: function () {},
            stopPropagation: function () {},
            pageX: 0,
            pageY: 0,
            clientX: 0,
            clientY: 0
        };

        var CustomEvent = function (theTarget, evt, opts) {
            this.type = evt;
            this.target = theTarget;
            this.srcElement = theTarget;
            this.eventName = evt;
            this.memo = {};
            Object.extend(this, opts);
            for (prop in browserLikeEventExtender) {
                if (browserLikeEventExtender.hasOwnProperty(prop)) {
                    if (!this[prop]) {
                        this[prop] = browserLikeEventExtender[prop];
                    }
                }
            }
            if (self.isIE) {
                Event.extend(this);
            }
        };
        
        if (self.isIE) {
            (function () {
                var methods = Object.keys(Event.Methods).inject({ }, function(m, name) {
                    m[name] = Event.Methods[name].methodize();
                    return m;
                  });

                CustomEvent.prototype = CustomEvent.prototype || document.createEvent("HTMLEvents").__proto__;
                Object.extend(CustomEvent.prototype, methods);
            })();
        }

        self.buildCustomEvent = function (theTarget, evt, opts) {
            var evt = new CustomEvent(theTarget, evt, opts);
            return Event.extend(evt);
        };
        
        
        var ieSubscribe = function (elem, type, func) {
            var handler = function (evt) {
                Event.extend(evt);
                func(evt);
            };
            return elem.attachEvent("on" + type, func);
        };
        
        var captureSubscribe = function (elem, type, func) {
            return elem.addEventListener(type, func, true);
        };
        /**
            This is the main DOM subscription (the thing that subscribes
            to the document object). If you are replacing the EventBox
            then this function should should take an optional opts argument
            which supports "ieOnly" or "capture."  ieOnly will make the
            subscription ieOnly and capture will use event capture
            as opposed to bubbling (for blur and focus events mostly)
            
            @param {HTMLElement} elem The html element to subscribe to
            @param {String} type The type of event (eg 'click')
            @param {Function} func The function to fire
            @param {Object} opts (optional)
            
            @returns {Object} An event subscription
            @function
            @name MBX.EventHandler.EventBox.subscribe
        */
        self.subscribe = function (elem, type, func, opts) {
            opts = opts || {};
            if (opts.ieOnly) {
                return ieSubscribe(elem, type, func);
            }
            if (opts.capture) {
                return captureSubscribe(elem, type, func);
            }
            // else
            return $(elem).observe(type, func);
        };
        
        /** Given an event, this function should return
            the element that is associated with the event
            
            @param {Event} evt The event
            @returns {HTMLElement} The element that triggered the event
            @function
            @name MBX.EventHandler.EventBox.elementFromEvent
        */
        self.elementFromEvent = function (evt) {
            var targ;
            if (!evt) {
                var e = window.event;
            }
            if (evt.target) {
                targ = evt.target;
            } else {
                if (evt.srcElement) {
                  targ = evt.srcElement;  
                } 
            }
            if (targ.nodeType == 3)  {// defeat Safari bug
            	targ = targ.parentNode;
            }
            
            return targ;
        };
        
        /** should return an observer on domReady
            @param {Function} func The function to fire
            @returns {Observer} The event observer on domReady
            @function
            @name MBX.EventHandler.EventBox.subscribeToDomReady
        */
        self.subscribeToDomReady = function (func) {
            document.observe("dom:loaded", func);
        };
        
        return self;
    })();
    
    /** 
        all the standard events we want to listen to on document.
        please note that 'change' and 'blur' DO NOT BUBBLE in IE - so you will need to do something
        extra for the Microsoft browsers
    */
    var stdEvents = ["click", "mouseout", "mouseover", "keypress", "change"];
    /** these events do bubble, but are IE only */
    var ieFocusBlurEvents = ["focusin", "focusout"];
    /** these events don't bubble - but you can use a capturing style event to grab 'em outside of ie */
    var nonBubblingBlurFocusEvents = ["blur", "focus"];
    
    /** an object with all the event listeners we have listed by eventType
        gets filled in on init
    */
    var eventListeners = {};
    
    var isArray = function (object) {
        return object != null && typeof object == "object" &&
             'splice' in object && 'join' in object;
    };
    
    var makeArray = function (obj) {
        if (!isArray(obj)) {
            return [obj];
        } else {
            return obj;
        }
    };
    
    var eachElement = function (ary, func) {
        ary = ary || {};
        ary = makeArray(ary);
        var len = ary.length;
        for (var i = 0; i < len; ++i) {
            func(ary[i]);
        }
    };
    
    var normalizeEventType = function (evtType) {
        if (!(/focusin|focusout/.test(evtType))) {
            return evtType;
        } else {
            switch (evtType) {
                case "focusin":
                   return "focus";
                   break;
                case "focusout":
                   return "blur";
                   break;
            }
        }     
    };
    
     /** Event bubbles up to the document where the listeners are and fires this function
         if the target element matches anything in the subscribers object then the functions fire
         it continues to go all the way up the tree
         @function
     */
     var handleEvent = function (evt) {
         //for debug uncomment out the below
         //console.dir(evt);
         //console.log(Event.element(evt));
         //evt.isConsumed = false;
         var targetElement;
         if (evt) {
             var evtType = normalizeEventType(evt.type);
             try {
                  targetElement = self.EventBox.elementFromEvent(evt);
              } catch (e) {
              }
              if (targetElement) {
                  functionsFromElementAndEvent(targetElement, evt, { eventType: evtType });
              }
         }
    };
    
    /** subscribe to the listeners
    */
    eachElement(stdEvents, function (evtType) {
        eventListeners[evtType] = self.EventBox.subscribe(document, evtType, handleEvent);
    });
    
    if (!self.isIE) {
        /** We get focus and blur to look like they're bubbling by using event capturing
            rathe than event bubbling
        */
        eachElement(nonBubblingBlurFocusEvents, function (evtType) {
            eventListeners[evtType] = self.EventBox.subscribe(document, evtType, handleEvent, { capture: true });
        });
    } else {
        eachElement(ieFocusBlurEvents, function (evtType) {
           eventListeners[evtType] = self.EventBox.subscribe(document, evtType, handleEvent, { ieOnly: true });
        });
    }

    var domReadyAlreadyFired = false;
    
    self.EventBox.subscribeToDomReady(function () {
        domReadyAlreadyFired = true;
        MBX.EventHandler.fireCustom(document, "dom:loaded");
    });

    
    /** this holds the actual subscriptions in the form
    
        @example
          ids: {
              myId: {
                      myEventType: [function, function, function]
                 }
          }
          
        same for classes and objects (objects add a unique identifier);
        rules however is the opposite (for speed sake)
        so:
        
        @example
          rules: {
              eventType: {
                  "my rule": [function, function, function]
              }
          }
    */
    var subscriptions = {
        ids: {},
        classes: {},
        rules: {},
        objects: {}
    };
    
    var subscriptionMarker = 1;
    
    /**
        executes an array of functions sending the event to the function
    */
    var callFunctions = function (functionsToCall, evt) {
        for (var i = functionsToCall.length - 1; i >= 0; i--){
            functionsToCall[i](evt);
        };
    };
        
    var wrap = function(func, wrapper) {
        var __method = func;
        __method.bind = function() {
            if (arguments.length < 2 && Object.isUndefined(arguments[0])) return this;
            var __method = this, args = Array.prototype.slice.call(arguments), object = args.shift();
            return function() {
              return __method.apply(object, args.concat(Array.prototype.slice.call(arguments)));
            };
        };
        
        return function() {
          return wrapper.apply(this, [__method.bind(this)].concat(Array.prototype.slice.call(arguments)));
        };
    };
    
    /**
        defers function for later execution
    */
    var deferFunctions = function (functionsToCall, evt) {
        var func;
        for (var i = functionsToCall.length - 1; i >= 0; i--) {
            func = wrap(functionsToCall[i], function (orig) {
                orig(evt);
            });
            setTimeout(func, 0);
        };
    };
    
    /** if there is a listener defined for the evtType, then
        loop through those rules and compare them to target
        bad CSS selectors can throw up really bad JS errors,
    */
    var callFunctionsFromRules = function (target, evtType, evt) {
        if (!subscriptions.rules[evtType]) {
            return;
        }
        var subscriptionsToCall = [];
        for (prop in subscriptions.rules[evtType]) {
            if (subscriptions.rules[evtType].hasOwnProperty(prop) && target.match(prop)) {
                subscriptionsToCall = subscriptionsToCall.concat(subscriptions.rules[evtType][prop]);
            }
        }
        eachElement(subscriptionsToCall, function (sub) {
            sub.callFunctions(evt);
        });
    };
    
    /** go to the subscriptions.ids object and grab an array of all the functions that are subscribed to
        the eventType evtType... so subscriptions.ids[targetId][evtType] which will be an array of functions
    */
    var callFunctionsFromIdOrObject = function (specifierType, targetId, evtType, evt) {
        var returnArray = [];
        var deferArray = [];
        var subscriptionTarget = subscriptions[specifierType][targetId];
        if (subscriptionTarget && subscriptionTarget[evtType]) {
            returnArray = returnArray.concat(subscriptionTarget[evtType]);
        }
        eachElement(returnArray, function (sub) {
            sub.callFunctions(evt);
        });
    };
    
    /** same as functionsFromId, but uses all classes on the target object and looks in
        subscriptions.classes object
    */
    var callFunctionsFromClasses = function (targetClasses, evtType, evt) {
        var subscriptionsToCall = [];
        var functionsToDefer = [];
        var classObject;
        for (var index = 0, classLen = targetClasses.length; index < classLen; ++index) {
            classObject = subscriptions.classes[targetClasses[index]];
            if (classObject && classObject[evtType]) {
                subscriptionsToCall = subscriptionsToCall.concat(classObject[evtType]);
            }
        }
        eachElement(subscriptionsToCall, function (sub) {
            sub.callFunctions(evt);
        });
    };
    
    /** given an element and an event type, call the functions held in the 
        subscriptions object
    */
    var functionsFromElementAndEvent = function (targetElement, evt, opts) {
        if (!targetElement) {
            return;
        }
        
        opts = opts || {};
        var evtType;
        if (opts.eventType) {
            evtType = opts.eventType;
        } else {
            evtType = evt.type;
        }
        
        if(targetElement.__MotionboxEventHandlerMaker) {
            callFunctionsFromIdOrObject("objects", targetElement.__MotionboxEventHandlerMaker, evtType, evt);
            if (!Object.isElement(targetElement)) {
                return;
            }
        }
        
        if (targetElement.id) {
            callFunctionsFromIdOrObject("ids", targetElement.id, evtType, evt);
        }
        
        if (targetElement.className) {
            var targetClasses = targetElement.className.split(" ");
            callFunctionsFromClasses(targetClasses, evtType, evt);
        }
        callFunctionsFromRules(targetElement, evtType, evt);
    
        //recursively call self walking up the tree
        if (targetElement != window && targetElement != document && targetElement.parentNode) {
            var upTreeNode = targetElement.parentNode;
            if (upTreeNode && upTreeNode.tagName && upTreeNode.tagName != "HTML") {
                functionsFromElementAndEvent(upTreeNode, evt, opts);
            }
        }
    };
    
    var isId = function (specifierString) {
        return (/^\#[\w-]+$/).test(specifierString);
    };
    
    var isClass = function (specifierString) {
        return (/^\.[\w-]+$/).test(specifierString);
    };
    
    var isObject = function (specifier) {
        return typeof specifier == "object";
    };
    
    var getSubscriptionMarker = function (obj) {
        if (!obj.__MotionboxEventHandlerMaker) {
            obj.__MotionboxEventHandlerMaker = subscriptionMarker++;
        }
        return obj.__MotionboxEventHandlerMaker;
    };
        
    if (self.isIE) {
        var destroyObservers = function () {
            stdEvents.each(function (evtType) {
                document.stopObserving(evtType, handleEvent);
            });
        };
        
        window.attachEvent('onbeforeunload', destroyObservers);
    }
    
    /** 
     The Object that holds a subcription.
     Contains a specifier (object, id, class), type (eg 'click'), and functions
     @constructor
    */
    var Subscription = function (specifier, eventType, funcs, opts) {
        funcs = makeArray(funcs);
        
        this.specifier = specifier;
        this.eventType = eventType;
        this.funcs = funcs;
        this.opts = opts || {};
        this.calculateSpecifierType();
        this.cache();
        return this;
    };
    
    Subscription.prototype = {
        callFunctions: function (evt) {
            if (this.opts.defer) {
                deferFunctions(this.funcs, evt);
            } else {
                callFunctions(this.funcs, evt);
            }
        },
        calculateSpecifierType: function () {
            if (isObject(this.specifier)) {
                this.specifierType = "objects";
                this.specifier = getSubscriptionMarker(this.specifier);
            } else {
                if (typeof this.specifier != "string") {
                    throw new Error("specifier was neither an object nor a string");
                }
                if (isId(this.specifier)) {
                    this.specifier = this.specifier.sub(/#/, "");
                    this.specifierType = "ids";
                }
                if (isClass(this.specifier)) {
                    this.specifierType = "classes";
                    this.specifier = this.specifier.sub(/\./, "");
                }
                if (!this.specifierType) {
                    this.specifierType = "rules";
                }
            }
        },
        _cacheForRules: function () {
            if (!subscriptions.rules[this.eventType]) {
                subscriptions.rules[this.eventType] = {};
            }
            var specifierObject = subscriptions.rules[this.eventType];
            
            if (!specifierObject[specifier]) {
                specifierObject[specifier] = [];
            }
            specifierObject[specifier].push(this);
        },
        cache: function () {
            if (this.specifierType == "rules") {
                this._cacheForRules();
            } else {
                if (!subscriptions[this.specifierType][this.specifier]) {
                    subscriptions[this.specifierType][this.specifier] = {};
                }
                var specifierObject = subscriptions[this.specifierType][this.specifier];
                if (!specifierObject[this.eventType]) {
                     specifierObject[this.eventType] = [];
                 }
                
                specifierObject[this.eventType].push(this);
            }
        },
        _uncacheForRules: function () {
            var specifierObject = subscriptions.rules[this.eventType];
            specifierObject.splice(specifierObject.indexOf(this), 1);
        },
        uncache: function () {
            if (this.specifierType == "rules") {
                this._uncacheForRules();
            } else {
                var specifierObject = subscriptions[this.specifierType][this.specifier][this.eventType];
                specifierObject.splice(specifierObject.indexOf(this), 1);
            }
        }
    };
           
    var SubscriptionSet = function (specifiers, evtTypes, funcs, opts) {
        specifiers = makeArray(specifiers);
        evtTypes = makeArray(evtTypes);
        
        this.specifiers = specifiers;
        this.evtTypes = evtTypes;
        this.funcs = funcs;
        this.opts = opts || {};
        this.subscriptions = [];
        this.createSubscriptions();
        return this;
    };
    
    SubscriptionSet.prototype = {
        createSubscriptions: function () {
            for (var i = 0; i < this.specifiers.length; ++i) {
                for (var j = 0; j < this.evtTypes.length; ++j) {
                    this.subscriptions.push(new Subscription(this.specifiers[i], this.evtTypes[j], this.funcs, this.opts));
                }
            }
        },
        unsubscribe: function () {
            eachElement(this.subscriptions, function (subscription) {
                subscription.uncache();
            });
        }
    };
    
    /** institue the subscriber:  '#' indicates an id, "." indicates a class, any other string is
        considered a CSS Selector.  You may also pass in an object (or DomElement).
        subscribe with:
        @example
          MBX.EventHandler.subscribe(".myClass", "click", function (){ alert('hi'); });
        @example
          MBX.EventHandler.subscribe("p#blah.cool", "click", function(evt) {console.dir(evt);});
        @example
          var someObj = {};
          // the below will use a setTimeout to fire the function when "myEvent" is fired on someObj
          MBX.EventHandler.subscribe(someObj, "myEvent", function () {alert('hi'); }, {defer: true});
          
        events may be custom events
        
        @param {String or Object or Array} specifiers the Object, class, id or CSS selector that you want to subscribe to (or array of any of those)
        @param {String or Array} evtTypes the types of events you want to subscribe to (these can be arbitrary to allow custom events)
        @param {Function or Array} funcs the functions you want to be called with this subscription
        @param {Object} opts Right now only takes a "defer" option which will fire functions with setTimeout
        
        @returns A handler object that can be used to unsubscribe
        
        @see MBX.EventHandler.fireCustom
        @see MBX.EventHandler.unsubscribe
        
        @name MBX.EventHandler.subscribe
        @function
    */
    self.subscribe = function (specifiers, evtTypes, funcs, opts) {
        return new SubscriptionSet(specifiers, evtTypes, funcs, opts);
    };
    
    /** Unsubscribe a previous subscribed handler
        @param {Object} handlerObjects the handler objects that were originally passed to the
                                                subscriptions
        @example
          var handlerObj = MBX.EventHandler.subscribe("#blah", "click", function () {alert('hi')!});
          MBX.EventHandler.unsubscribe(handlerObj) // the subscription above is now removed
          
        @see MBX.EventHandler.subscribe
        
        @name MBX.EventHandler.unsubscribe
        @function
    */
    self.unsubscribe = function (handlerObject) {
        handlerObject.unsubscribe();
    };
    
    /** fire a custom event of your choosing. Will notify any subscribers to that evt
        You can also attach a payload to the event that will be added to the events
        @param {Object} theTarget A dom element, or arbotrary object to fire the event on
        @param {String} evt the Event to fire
        @param {Object} opts (optional) the attributes to be attached to the event
        
        @example
          MBX.EventHandler.fireCustom($('element'), 'mycustomeevent');
          
        @example
          MBX.EventHandler.fireCustom($("element"), 'mycustomevent', {
              theseAttributes: "will be attached to the event"
          });
          
        @see MBX.EventHandler.subscribe
        
        @name MBX.EventHandler.fireCustom
        @function
        
    */
    self.fireCustom = function (theTarget, evt, opts) {
        if (theTarget) {
            opts = opts || {};
            if (Object.isElement(theTarget)) {
                var theEvent = self.EventBox.buildCustomEvent(theTarget, evt, opts);
                handleEvent(theEvent);
            } else {
                callFunctionsFromIdOrObject("objects", getSubscriptionMarker(theTarget), evt, opts);
            }
        }
    };
    
    /** Accepts functions that will be fired as soon as the dom is ready (using prototypes dom:loaded event)
        By default, we fire onDomReady events using setTimeout
        If the dom:loaded event has already ocurred, we simply call the function
        @param {Function or Array} funcs the function(s) to be fired at the Dom Ready event
        @param {Object} opts (optional) add { defer: false } to *not* fire the function using a setTimeout
        @returns a handler object that can be used to unsubscribe
        
        @name MBX.EventHandler.onDomReady
        @function
    */
    self.onDomReady = function (funcs, opts) {
        opts = opts || {};
        if (typeof opts.defer == 'undefined') {
            opts.defer = true;
        }
        
        funcs = makeArray(funcs);
        if (domReadyAlreadyFired) {
            if (opts.defer) {
                deferFunctions(funcs, "dom:loaded");
            } else {
                callFunctions(funcs, "dom:loaded");
            }
        } else {
            return MBX.EventHandler.subscribe(document, "dom:loaded", funcs, { defer: opts.defer });
        }
    };
    
    //TEST FUNCTION ONLY!
    self.dirSubscriptions = function () {
        console.dir(subscriptions);
    };
    
    self.dirEventListeners = function () {
        console.dir(eventListeners);
    };
    
    /** return the object that holds the subscriptions, useful for debugging or testing
        @returns {Object} private subscriptions object
        @name MBX.EventHandler.debugSubscriptions
        @function
    */
    self.debugSubscriptions = function () {
        return subscriptions;
    };

    return self;

})();
