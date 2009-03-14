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
        this.subscriptions[queue.primaryKey()] = MBX.EventHandler.subscribe(queue, "timer_complete", this.handleTimerComplete.bind(this), {
            defer: true
        });
    },
    
    onInstanceDestroy: function (queue) {
        this.renderNothing = true;
        var subscription = this.subscriptions[queue.primaryKey()];
        if (subscription) {
            MBX.EventHandler.unsubscribe(subscription);
            delete this.subscriptions[queue.primaryKey()];
        }
        queue.stop();
    }
    
});
