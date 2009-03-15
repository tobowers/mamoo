//message_view.js
MBX.MessageView = MBX.JsView.create({
    model: MBX.Message,
    
    onInstanceCreate: function (message) {
        var li = this.buildLi(message);
        $("message_list").insert(li);
    },
    
    onInstanceDestroy: function (message) {
        message.get("uiElement").remove();
    },
    
    buildLi: function (message) {
        var idPrefix = "message_" + message.primaryKey();
        var li = new Element("li", { id: idPrefix });
        li.update(message.get('body'));
        li.updatesOn(message, "body");
        
        var a = new Element("a", { id: idPrefix + "_delete" });
        a.update("destroy");
        li.insert(a);
        
        MBX.EventHandler.subscribe(a, "click", function () {
            message.destroy();
        });
        
        message.set("uiElement", li);
        return li;
    },
    
    initialize: function () {
        MBX.EventHandler.onDomReady(function () {
           $("message_count").updatesOn(MBX.Message, "count"); 
        });
    }
    
});
