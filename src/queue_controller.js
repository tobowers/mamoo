MBX.QueueController = MBX.JsController.create("QueueController", {
    model: MBX.Queue,
    
    subscriptions: {},
    
    handleTimerComplete: function (evt) {
        var queue = evt.queue;        
        if (queue.nextFunction()) {
            var criteria = queue.get("criteria");
            if (criteria) {
                if (criteria()) {
                    queue.fireNextFunction();
                }
            } else {
                queue.fireNextFunction();
            }
        }
    },
    
    onInstanceCreate: function (queue) {
        var handler = _(this.handleTimerComplete).bind(this);
        this.subscriptions[queue.primaryKey()] = handler;
        queue.on("timer_complete", handler);
    },
    
    onInstanceDestroy: function (queue) {
        this.renderNothing = true;
        var subscription = this.subscriptions[queue.primaryKey()];
        if (subscription) {
            queue.removeListener("timer_complete", subscription);
            delete this.subscriptions[queue.primaryKey()];
        }
        queue.stop();
    }
    
});
