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
        
        describe("loosely coupled controllers", function () {
            var MyModel;
            before(function() {
                Screw.MBXlooselyCoupledFired = false;
                MyModel = MBX.JsModel.create("MyModel");
                MyController = MBX.JsController.create("MyModelController", {
                    model: MyModel,
                    looselyCoupled: true,
                    onInstanceCreate: function () {
                        Screw.MBXlooselyCoupledFired = true;
                    }
                });
            });
            
            after(function () {
                MBX.JsModel.destroyModel("MyModel");
            });
            
            it("should defer the subscription when loosely coupled", function (me) {
                MyModel.create();
                expect(Screw.MBXlooselyCoupledFired).to(be_false);
                using(me).wait(2).and_then(function () {
                    expect(Screw.MBXlooselyCoupledFired).to(be_true);
                });
            });
            
            
        });
        
        describe("a new controller with a model", function () {
           var MyModel;
           before(function () {
               MyModel = MBX.JsModel.create("MyModel");
           });
           
           after(function () {
               MBX.JsModel.destroyModel('MyModel');
           });
           
           it('should subscribe to model events', function () {
               var eventSubscriptions = [];
               var mockedHandler = TH.Mock.obj("MBX.EventHandler");
               mockedHandler.subscribe = function (specifiers, evtTypes, funcs) {
                   eventSubscriptions.push([specifiers, evtTypes]);
               };               
               MyController = MBX.JsController.create('MyController', { model: MyModel });
               
               expect(eventSubscriptions[0]).to(equal, [MBX, MyModel.Event.changeInstance]);
               expect(eventSubscriptions[1]).to(equal, [MBX, MyModel.Event.newInstance]);
               expect(eventSubscriptions[2]).to(equal, [MBX, MyModel.Event.destroyInstance]);
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
              
              it("should call onInstanceDestroy when an instance is destroyed", function () {
                  lastCallback = null;
                  MyModel.set("hi", "bye");
                  expect(lastCallback).to(equal, "hi");
              });
              
           });
           
        });
    });
});
