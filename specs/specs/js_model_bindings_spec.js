Screw.Unit(function() {
    describe('MBX.JsModelBindings', function() {
        var MyModel;
        before(function () {
            MyModel = MBX.JsModel.create("MyModel");
        });

        after(function () {
            MBX.JsModel.destroyModel("MyModel");
        });

        describe("Model bindings", function () {
           var binding, testObj = {};
           before(function () {
               testObj = {};
               binding = MyModel.updatesOn("key", {
                   object: testObj,
                   attribute: "testKey"
               });
               MyModel.set("key", "something");
           });
           it("should update objects on attribute changes", function () {
               expect(testObj.testKey).to(equal, "something");
           });

           it("should be able to stop listening", function () {
               binding.stopUpdating();
               MyModel.set("key", "somethingElse");
               expect(testObj.testKey).to(equal, "something")
           });

           describe("with a preprocessor", function () {
                before(function () {
                    binding.stopUpdating();
                    binding = MyModel.updatesOn("key", {
                        object: testObj,
                        attribute: "testKey",
                        preProcess: function (data) {
                            return data + "_pre";
                        }
                    });
                });

                it("should run the payload through the preprocessor", function () {
                    MyModel.set("key", "hi");
                    expect(testObj.testKey).to(equal, "hi_pre");
                });
           });

           describe("with a handler", function () {
               var HandlerModel;
                //handler receives (payload, targetObj, targetAttribute, model, key);

               before(function () {
                    HandlerModel = MBX.JsModel.create("HandlerModel");
                    binding.stopUpdating();
                    binding = HandlerModel.updatesOn("key", {
                        object: testObj,
                        attribute: "testKey",
                        handler: function (data, targetObj, targetAttribute, model, key) {
                            testObj.handlerKey = data;
                            expect(targetObj).to(equal, testObj);
                            expect(targetAttribute).to(equal, "testKey");
                            expect(model).to(equal, HandlerModel);
                            expect(key).to(equal, "key");
                        }
                    });
               });

               after(function () {
                   MBX.JsModel.destroyModel("HandlerModel");
               });

               it("should call the handler and not do its own updating", function () {
                   HandlerModel.set("key", "handler");
                   expect(testObj.testKey).to_not(equal, "handler");
                   expect(testObj.handlerKey).to(equal, "handler");
               });
           });

        });

        describe("instance bindings", function () {
           var binding, instance, testObj = {};
           before(function () {
               testObj = {};
               instance = MyModel.create();
               binding = instance.updatesOn("key", {
                   object: testObj,
                   attribute: "testKey"
               });
               instance.set("key", "something");
           });
           it("should update objects on attribute changes", function () {
               expect(testObj.testKey).to(equal, "something");
           });

           it("should be able to stop listening", function () {
               binding.stopUpdating();
               instance.set("key", "somethingElse");
               expect(testObj.testKey).to(equal, "something")
           });

           describe("with a preprocessor", function () {
                before(function () {
                    binding.stopUpdating();
                    binding = instance.updatesOn("key", {
                        object: testObj,
                        attribute: "testKey",
                        preProcess: function (data) {
                            return data + "_pre";
                        }
                    });
                });

                it("should run the payload through the preprocessor", function () {
                    instance.set("key", "hi");
                    expect(testObj.testKey).to(equal, "hi_pre");
                });
           });

           describe("with a handler", function () {
                //handler receives (payload, targetObj, targetAttribute, model, key);

               before(function () {
                    binding.stopUpdating();
                    binding = instance.updatesOn("key", {
                        object: testObj,
                        attribute: "testKey",
                        handler: function (data, targetObj, targetAttribute, model, key) {
                            testObj.handlerKey = data;
                            expect(targetObj).to(equal, testObj);
                            expect(targetAttribute).to(equal, "testKey");
                            expect(model).to(equal, instance);
                            expect(key).to(equal, "key");
                        }
                    });
               });

               it("should call the handler and not do its own updating", function () {
                   instance.set("key", "handler");
                   expect(testObj.testKey).to_not(equal, "handler");
                   expect(testObj.handlerKey).to(equal, "handler");
               });
           });

        });







    });
});
