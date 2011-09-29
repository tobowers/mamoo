Screw.Unit(function() {
    describe('MBX.JsView', function() {
        var MyModel;
        before(function () {
            MyModel = MBX.JsModel.create("MyModel");
            TH.insertDomMock("video_collection");
        });
        
        after(function () {
            MBX.JsModel.destroyModel("MyModel");
        });
        
        
        it("should allow extentions of all views", function () {
            TH.Mock.obj("MBX.JsView");
            PrototypeTestView = MBX.JsView.create('PrototypeTestView');
            MyView = MBX.JsView.create('MyView');
            
            MBX.JsView.extend({ newAttr: "cool" });
            
            expect(PrototypeTestView.newAttr).to(equal, "cool");
            expect(MyView.newAttr).to(equal, "cool");
        });
        
        it("should call initialize", function () {
            var called = false;
            MyModel = MBX.JsView.create({
                initialize: function () {
                    called = true;
                }
            });
            expect(called).to(be_true);
        });
        
//        describe("extended prototype elements", function () {
//
//            it("should extend elements", function () {
//                expect(typeof $("mocked_video_collection").updatesOn).to(equal, "function");
//                expect(typeof $("mocked_video_collection").stopUpdating).to(equal, "function");
//                expect(typeof $("mocked_video_collection").assignInstance).to(equal, "function");
//                expect(typeof $("mocked_video_collection").getInstance).to(equal, "function");
//            });
//
//            describe('assignInstance', function () {
//                var el, instance;
//                before(function () {
//                    instance = MyModel.create();
//                    el = $("mocked_video_collection");
//                    el.assignInstance(instance);
//                });
//
//                it('should have a reference to the instance', function () {
//                    expect(el.getInstance()).to(equal, instance);
//                });
//
//                it("should add the appropriate class names", function () {
//                    expect(el.hasClassName(MBX.JsView.modelCSS(instance.parentClass))).to(be_true);
//                    expect(el.hasClassName(MBX.JsView.cssForInstance(instance))).to(be_true);
//                });
//
//            });
//
//            describe("with observers", function () {
//                var mock, instance;
//                before(function () {
//                    instance = MyModel.create({
//                        someKey: "hi"
//                    });
//                    mock = $("mocked_video_collection");
//                    mock.updatesOn(instance, "someKey").update("");
//                });
//
//                after(function () {
//                    mock.stopUpdating();
//                });
//
//                it("should not update on actual creation", function () {
//                    expect(mock.innerHTML).to(equal, "");
//                });
//
//                it("should update on a new update", function () {
//                    instance.set("someKey", "bye");
//                    expect(mock.innerHTML).to(equal, "bye");
//                });
//
//                it("should add the subscription", function () {
//                    expect(mock.retrieve("__JsViewSubscriptions").length).to(equal, 1);
//                });
//
//                it("should update from a class attribute", function () {
//                    mock.stopUpdating();
//                    mock.updatesOn(MyModel, "attr").update("");
//                    MyModel.set("attr", "hi");
//                    expect(mock.innerHTML).to(equal, "hi");
//                });
//
//                describe("on stop updating", function () {
//                    before(function () {
//                        mock.stopUpdating();
//                    });
//
//                    it("should not update the element anymore", function () {
//                        instance.set("someKey", "bye");
//                        expect(mock.innerHTML).to(equal, "");
//                    });
//
//                    it("should remove the event subscription", function () {
//                        expect(mock.retrieve("__JsViewSubscriptions").length).to(equal, 0);
//                    });
//                });
//
//            });
//
//            describe("with observers and preProcessors", function () {
//                var mock, instance;
//                before(function () {
//                    instance = MyModel.create({
//                        someKey: "hi"
//                    });
//                    mock = $("mocked_video_collection");
//                    mock.updatesOn(instance, "someKey", {
//                        preProcess: function (obj, content, key) {
//                            return content + " preprocess";
//                        }
//                    });
//                });
//
//                it("should update on a new update after being preprocessed", function () {
//                    instance.set("someKey", "bye");
//                    expect(mock.innerHTML).to(equal, "bye preprocess");
//                });
//            });
//
//            describe("with observers and handlers", function () {
//                var mock, instance;
//                before(function () {
//                    instance = MyModel.create({
//                        someKey: "hi"
//                    });
//                    mock = $("mocked_video_collection");
//                    mock.updatesOn(instance, "someKey", {
//                        handler: function (obj, content, key) {
//                            mock.update("handler");
//                        }
//                    });
//                });
//
//                it("should only have updates from the handler", function () {
//                    instance.set("someKey", "bye");
//                    expect(mock.innerHTML).to(equal, "handler");
//                });
//            });
//
//            describe("with observers and preprocessors and handlers", function () {
//                var mock, instance;
//                before(function () {
//                    instance = MyModel.create({
//                        someKey: "hi"
//                    });
//                    mock = $("mocked_video_collection");
//                    mock.updatesOn(instance, "someKey", {
//                        preProcess: function (obj, content, key) {
//                            return content + " preprocess";
//                        },
//                        handler: function (obj, element, content) {
//                            mock.update(content + " handler");
//                        }
//                    });
//                });
//
//                it("should have updates from the preprocessor and the handler", function () {
//                    instance.set("someKey", "bye");
//                    expect(mock.innerHTML).to(equal, "bye preprocess handler");
//                });
//            });
//
//            describe("with two separate handlers for the same object key", function () {
//                var handlerOne, handlerTwo;
//                var el;
//                var mock, instance;
//                before(function () {
//                    handlerOne = false;
//                    handlerTwo = false;
//                    el = new Element("div", {id: 'mockTwo'});
//                    $("dom_test").insert(el);
//
//                    instance = MyModel.create({
//                        someKey: "hi"
//                    });
//                    mock = $("mocked_video_collection");
//                    mock.updatesOn(instance, "someKey", {
//                        handler: function (obj, element, content) {
//                            handlerOne = true;
//                        }
//                    });
//                    el.updatesOn(instance, "someKey", {
//                        handler: function (obj, element, content) {
//                            handlerTwo = true;
//                        }
//                    });
//                    instance.set("someKey", "bye");
//                });
//
//                it("should call the first handler", function () {
//                    expect(handlerOne).to(be_true);
//                });
//
//                it("should call the second handler", function () {
//                    expect(handlerTwo).to(be_true);
//                });
//            });
//
//        });
//
        describe("A view instance", function () {
            var view, instance, onInstanceCreateCalled, onInstanceChangeCalled,
                onInstanceDestroyCalled, onAttributeChangeCalled;
                
            before(function () {
                onAttributeChangeCalled = onInstanceCreateCalled = onInstanceChangeCalled = onInstanceDestroyCalled = false;
                view = MBX.JsView.create({
                    model: MyModel,
                    onInstanceCreate: function (ins) {
                        // expect to have access to private helper functions
                        // expect(typeof imageTag).to(equal, "function");
                        // expect(typeof div).to(equal, "function");
                        onInstanceCreateCalled = ins;
                    },
                    onInstanceChange: function (ins, key) {
                        onInstanceChangeCalled = {
                            'object': ins,
                            'key': key
                        };
                    },
                    onInstanceDestroy: function (ins) {
                        onInstanceDestroyCalled = ins;
                    },
                    onAttributeChange: function (key) {
                        onAttributeChangeCalled = key;
                    }
                });
                
                instance = MyModel.create();
            });
            
            it("should not fire callbacks when deactivated", function () {
                view.deactivate();
                onInstanceCreateCalled = onInstanceChangeCalled = onInstanceDestroyCalled = false;
                instance = MyModel.create();
                instance.set("something", "different");
                instance.destroy();
                MyModel.set("attr", "something");
                expect(onInstanceCreateCalled).to(be_false);
                expect(onInstanceChangeCalled).to(be_false);
                expect(onInstanceDestroyCalled).to(be_false);
                expect(onAttributeChangeCalled).to(be_false);
            });
            
            it("should listen to createInstance calls", function () {
                expect(onInstanceCreateCalled).to(equal, instance);
            });
            
            it("should listen to changeInstance calls", function () {
                expect(onInstanceChangeCalled).to_not(be_true);
                instance.set("someAttr", 'something');
                expect(onInstanceChangeCalled).to(equal, {
                    'object': instance,
                    'key': 'someAttr'
                });
            });
            
            it("should listen to destroyInstance calls", function () {
                instance.destroy();
                expect(onInstanceDestroyCalled).to(equal, instance);
            });
            
            it("should listen to destroyInstance calls when a controller is also listening", function () {
                var controllerDestroyedInstance;
                var controller = MBX.JsController.create("TestController", {
                    model: MyModel,
                    onInstanceDestroy: function (inst) {
                        controllerDestroyedInstance = inst;
                    }
                });
                instance.destroy();
                expect(onInstanceDestroyCalled).to(equal, instance);
                expect(controllerDestroyedInstance).to(equal, instance);
                MBX.JsController.destroyController('TestController');
            });
            
            it("should listen to changeAttribute calls", function () {
                MyModel.set("hi", "bye");
                expect(onAttributeChangeCalled).to(equal, "hi");
            });
            
//            describe("instance CSS", function () {
//
//                it("should return the css of the model", function () {
//                    expect(view.modelCSS()).to(equal, "mymodel");
//                    expect(view.modelCSS(".")).to(equal, ".mymodel");
//                });
//
//                it("should be able to return the finder CSS from an instance", function () {
//                    expect(view.cssForInstance(instance)).to(equal, "mymodel_" + instance.primaryKey().toLowerCase().gsub(/[^\w\-]/, "_"));
//                });
//
//            });
//
             
        });
        
//        describe("loosely coupled view", function () {
//            before(function() {
//                Screw.MBXlooselyCoupledViewFired = false;
//                MyController = MBX.JsView.create({
//                    model: MyModel,
//                    looselyCoupled: true,
//                    onInstanceCreate: function () {
//                        Screw.MBXlooselyCoupledViewFired = true;
//                    }
//                });
//            });
//
//            it("should defer the subscription when loosely coupled", function (me) {
//                MyModel.create();
//                expect(Screw.MBXlooselyCoupledViewFired).to(be_false);
//                using(me).wait(2).and_then(function () {
//                    expect(Screw.MBXlooselyCoupledViewFired).to(be_true);
//                });
//            });
//
//
//        });
        
    });
});
