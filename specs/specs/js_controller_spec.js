Screw.Unit(function() {
    describe('MBX.JsController', function() {
        var MyController;
        
        after(function () {
           MBX.JsController.destroyController('MyController');
        });
        
        it("should allow the creation of a controller", function () {
            expect(typeof MBX.JsController.create('MyController')).to(equal, "object");
        });
        
        it("should fire a new controller event when creating a controller", function () {
            TH.countEvent(MBX.JsController.Event.newController);
            MyController = MBX.JsController.create("MyController");
            expect(TH.eventCountFor(MBX.JsController.Event.newController)).to(equal, 1);
        });
        
        it("should allow extentions of all controllers", function () {
            TH.Mock.obj("MBX.JsController");
            PrototypeTestController = MBX.JsController.create('PrototypeTestController');
            MyController = MBX.JsController.create('MyController');
            
            MBX.JsController.extend({ newAttr: "cool" });
            
            expect(PrototypeTestController.newAttr).to(equal, "cool");
            expect(MyController.newAttr).to(equal, "cool");
            
            MBX.JsController.destroyController('PrototypeTestController');
        });
        
        it("should call initialize if it exists", function () {
            var thisController = MBX.JsController.create("ATestController", {
                initialize: function () {
                    this.anAfterCreateAttr = "cool";
                }
            });
            expect(thisController.anAfterCreateAttr).to(equal, "cool");
            MBX.JsController.destroyController("ATestController");
        });
        
//        describe("loosely coupled controllers", function () {
//            var MyModel;
//            before(function() {
//                Screw.MBXlooselyCoupledFired = false;
//                MyModel = MBX.JsModel.create("MyModel");
//                MyController = MBX.JsController.create("MyModelController", {
//                    model: MyModel,
//                    looselyCoupled: true,
//                    onInstanceCreate: function () {
//                        Screw.MBXlooselyCoupledFired = true;
//                    }
//                });
//            });
//
//            after(function () {
//                MBX.JsModel.destroyModel("MyModel");
//            });
//
//            it("should defer the subscription when loosely coupled", function (me) {
//                MyModel.create();
//                //expect(Screw.MBXlooselyCoupledFired).to(be_false);
//                using(me).wait(2).and_then(function () {
//                    expect(Screw.MBXlooselyCoupledFired).to(be_true);
//                });
//            });
//
//
//        });
        
        describe("a new controller with a model", function () {
           var MyModel;
           before(function () {
               MyModel = MBX.JsModel.create("MyModel");
           });
           
           after(function () {
               MBX.JsModel.destroyModel('MyModel');
           });
           
           it('should subscribe to model events', function () {
               var changeInstanceFired = false,
                   newInstanceFired = false,
                   destroyInstanceFired = false;
               var MyController = MBX.JsController.create("MyModelController", {
                    model: MyModel,
                    onInstanceCreate: function () {
                        newInstanceFired = true;
                    },
                    onInstanceChange: function () {
                        changeInstanceFired = true;
                    },
                    onInstanceDestroy: function () {
                        destroyInstanceFired = true;
                    }
               });

               var inst = MyModel.create();
               inst.set('somethingElse', true);
               inst.destroy();
               
               expect(changeInstanceFired).to(be_true);
               expect(destroyInstanceFired).to(be_true);
               expect(newInstanceFired).to(be_true);

               MBX.JsController.destroyController('MyModelController');
           });
           
           it("should be able to handle an array of models", function () {
               var MyModel2 = MBX.JsModel.create("MyModel2");
               var changeInstanceFired = 0,
                   newInstanceFired = 0,
                   destroyInstanceFired = 0;
               MyController = MBX.JsController.create("MyModelController", {
                    model: [MyModel, MyModel2],
                    onInstanceCreate: function () {
                        newInstanceFired++;
                    },
                    onInstanceChange: function () {
                        changeInstanceFired++;
                    },
                    onInstanceDestroy: function () {
                        destroyInstanceFired++;
                    }
               });

               var inst = MyModel.create();
               inst.set('somethingElse', true);
               inst.destroy();
               var inst2 = MyModel2.create();
               inst2.set('somethingElse', true);
               inst.destroy();

               expect(changeInstanceFired).to(equal, 2);
               expect(destroyInstanceFired).to(equal, 2);
               expect(newInstanceFired).to(equal, 2);
               MBX.JsController.destroyController('MyModelController');
           });
           
           describe("callbacks", function () {
              var lastCallback, instance;
              before(function () {
                  lastCallback = null;
                  MyController = MBX.JsController.create('MyController', {
                      model: MyModel,
                      onInstanceCreate: function (instance) {
                          lastCallback = instance;
                      },
                      onInstanceChange: function (instance, key) {
                          lastCallback = [instance, key];
                      },
                      onInstanceDestroy: function (instance) {
                          lastCallback = instance;
                      },
                      onAttributeChange: function (key) {
                          lastCallback = key;
                      }
                  });
                  instance = MyModel.create();
              });
              
              it("should not call callbacks when deactivated", function () {
                  MyController.deactivate();
                  lastCallback = null;
                  
                  instance = MyModel.create();
                  instance.set("something", "is different");
                  instance.destroy();
                  MyModel.set('hi', 'bye');
                  expect(lastCallback).to(be_null);
              });
              
              it("should call onInstanceCreate when a new instance of Model is created", function () {
                  expect(lastCallback).to(equal, instance);
              });
              
              it("should call onInstanceChange when an instance is changed", function () {
                  lastCallback = null;
                  instance.set('AChange', 'IsDifferent');
                  expect(lastCallback).to(equal, [instance, 'AChange']);
              });
              
              it("should call onInstanceDestroy when an instance is destroyed", function () {
                  lastCallback = null;
                  instance.destroy();
                  expect(lastCallback).to(equal, instance);
              });
              
              it("should call onAttributeChange when a model attribute is changed", function () {
                  lastCallback = null;
                  MyModel.set("hi", "bye");
                  expect(lastCallback).to(equal, "hi");
              });
              
              it("should handle callbacks on multiple models if specified", function () {
                  var MyModel3 = MBX.JsModel.create("MyModel3");
                  var MyModel4 = MBX.JsModel.create("MyModel4");
                  var MyController2 = MBX.JsController.create("MyController2", {
                      model: [MyModel3, MyModel4],
                      onInstanceCreate: function (instance) {
                          lastCallback = instance;
                      }
                  });
                  var inst = MyModel3.create();
                  expect(lastCallback).to(equal, inst);
                  inst = MyModel4.create();
                  expect(lastCallback).to(equal, inst);
              });
              
           });
           
        });
    });
});
