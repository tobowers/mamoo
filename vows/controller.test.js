var vows = require('vows'),
    assert = require('assert');
require("../lib/mamoo");

var MBX = global.MBX;

vows.describe("a controller").addBatch({
    "creating a model": {
        topic: function () {
            var topic = this;
            var MyModel = MBX.JsModel.create("MyModel");
            var controller = MBX.JsController.create("MyModelController", {
                model: MyModel,
                onInstanceCreate: function (obj) {
                    topic.callback(null, obj, MyModel);
                }
            });
            MyModel.create();
        },
        "should get the object": function (err, obj, model) {
            assert.equal(obj.parentClass.modelName, model.modelName);
        }
    }
}).export(module);
