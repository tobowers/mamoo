//message.js
MBX.Message = MBX.JsModel.create("Message", {
    imAClassMethod: function () {},
    
    instanceMethods: {
        alertMyBody: function () {
            alert(this.get("body"));
        }
    }
    
});