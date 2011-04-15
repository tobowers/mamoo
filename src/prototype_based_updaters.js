(function () {
    var self = {};



	/* store info on an element - use prototypes store when available */
	var store = function (element, key, value) {
		if (typeof element.store == 'function') {
			return element.store(key, value);
		} else {
			return element[key] = value;
		}
	};

	/* retrieve info on an element -use prototypes retrieve when available */
	var retrieve = function (element, key) {
		if (typeof element.retrieve == 'function') {
			return element.retrieve(key);
		} else {
			return element[key];
		}
	};


    /** Added to prototype elements when a view is created
        allows you to observe particular keys of a model object
		You may also pass in "loosleyCoupled" and updates will happen with a setTimeout
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
        var loosleyCoupled = opts.loosleyCoupled || false;

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

        var sub = MBX.EventHandler.subscribe(obj, key + "_changed", changeHandler, {defer: loosleyCoupled});

		var existing = retrieve(element, "__JsViewSubscriptions");
		existing = existing || [];
		existing.push(sub);
		store(element, "__JsViewSubscriptions", existing);


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
		var subscriptions = retrieve(element, "__JsViewSubscriptions");
        if (subscriptions) {
            while (subscriptions.length > 0) {
                MBX.EventHandler.unsubscribe(subscriptions.pop());
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
        store(element, "__JsViewMvcInstance", instance);
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
        return retrieve(element, "__JsViewMvcInstance");
    };

    Element.addMethods({
        updatesOn: self.updatesOn,
        stopUpdating: self.stopUpdating,
        assignInstance: self.assignInstance,
        getInstance: self.getInstance
    });
})();
