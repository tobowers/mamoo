// message_controller.js
MBX.MessageController = MBX.JsController.create("MessageController", {
    model: MBX.Message,
    
    onInstanceCreate: function (message) {
        this.resetClassCount();
    },
    
    onInstanceDestroy: function (message) {
        this.resetClassCount();
    },
    
    resetClassCount: function () {
        MBX.Message.set("count", MBX.Message.count());
    }
    
});
