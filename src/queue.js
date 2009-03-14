/** A function queue that will only execute at *most* every interval miliseconds.
    @namespace
    @example
      myQueue = MBX.Queue.create({ interval: 500 });
      myQueue.add(function () {
          //do something 'spensive
      });
*/    
MBX.Queue = MBX.JsModel.create("Queue", {
    
    /**
        Instances of a Queue
        @name MBX.Queue#instance
        @class A single instance of a MBX.Queue
    */
    instanceMethods: /** @extends MBX.Queue#instance */ {
        defaults: {
            interval: 1000,
            functions: [],
            singleItem: false,
            selfStopped: false
        },
        
        _fireTimerEvent: function () {
            MBX.EventHandler.fireCustom(this, "timer_complete", {
                queue: this
            });
        },
        
        _setupTimer: function () {
            var interval = this.get('interval');
            var timer = this.get('timer');
            if (timer) {
                clearTimeout(timer);
            }
            this.set('timer', setTimeout(function () {
                this._fireTimerEvent();
                this._setupTimer();
            }.bind(this), interval));            
        },
        
        /** stop the queue
            @returns {MBX.Queue#instance} the queue
        */
        stop: function () {
            var timer = this.get('timer');
            if (timer) {
                clearTimeout(timer);
                this.set('timer', null);
            }
            return this;
        },
        
        /** start the queue back up - the queue is NOT started at creation time
            @returns {MBX.Queue#instance} the queue
        */
        start: function () {
            if (this.get('functions').length === 0) {
                this.set('selfStopped', true);
            } else {
                this._setupTimer();
            }
            return this;
        },
        
        /** adds a function to the queue
            @params {Function} func the function to add
        */
        add: function (func) {
            if (this.get("singleItem")) {
                this.get('functions')[0] = func;
            } else {
                this.get('functions').push(func);
            }
            if (this.get('selfStopped')) {
                this._setupTimer();
                this.set('selfStopped', false);
            }
        },
        
        /** removes the function that is passed in from the queue
            @params {Function} func the function to remove
        */
        remove: function (func) {
            var iterator = function (f) {
                return f == func;
            };
            this.set("functions", $A(this.get("functions")).reject(iterator));
        },
        
        /** returns but does not remove the next function in the queue */
        nextFunction: function () {
            return this.get('functions')[0];
        },
        
        /** fires and removes the next pending function in the queue */
        fireNextFunction: function () {
            var funcs = this.get('functions');
            funcs.shift()();
            if (funcs.length === 0) {
                this.stop();
                this.set('selfStopped', true);
            }
        }
    }
    
});
