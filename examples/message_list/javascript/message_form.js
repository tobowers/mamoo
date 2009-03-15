if (!"MBX" in window) {
    MBX = {};
}

MBX.MessageForm = (function () {
    var handleFormSubmission = function (evt) {
        evt.stop();
        MBX.Message.create({ body: $F("message_body") });
    };
    
    var clearTextarea = function () {
        $("message_body").value = "";
    };
    
    MBX.EventHandler.onDomReady(function () {
        $("message_form").observe("submit", handleFormSubmission);
        MBX.Message.onInstanceCreate(clearTextarea);
    });    
    
})();