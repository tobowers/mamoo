Screw.Unit(function() {
    describe('MBX.JsModel', function() {
        var MyModel, PrototypeTestModel;
        after(function () {
            MBX.JsModel.destroyModel("MyModel");
        });
        
        it("should have an event constant for new_model", function () {
            expect(MBX.JsModel.Event.newModel).to_not(be_null);
        });
        
        it("should call initialize on the model if it exists", function () {
            var called = false;
            MyModel = MBX.JsModel.create("MyModel", {
                initialize: function () {
                    called = true;
                }
            });
            expect(called).to(be_true);
        });
        
        it("should allow you to specify an afterCreate that gets executed after an instance is created", function () {
            MyModel = MBX.JsModel.create("MyModel", {
                instanceMethods: {
                    afterCreate: function () {
                        this.set('aFunctionDefinedAttribute', "cool");
                    }
                }
            });
            var instance = MyModel.create();
            expect(instance.get('aFunctionDefinedAttribute')).to(equal, "cool");
        });
        
        describe("convenience subscriptions", function () {
            var createCalled, destroyCalled, changeCalled;
            before(function() {
                createCalled = false;
                destroyCalled = false;
                changeCalled = false;
                MyModel = MBX.JsModel.create("MyModel");
            });
            
            it("should allow easy subscription to instanceCreation", function () {
                MyModel.onInstanceCreate(function () {
                    createCalled = true;
                });
                var instance = MyModel.create();
                expect(createCalled).to(be_true);
            });
            
            it("should allow easy subscription to instanceDestroy", function () {
                MyModel.onInstanceDestroy(function () {
                    destroyCalled = true;
                });
                var instance = MyModel.create();
                instance.destroy();
                expect(destroyCalled).to(be_true);
            });
            
            it("should allow easy subscription to changes", function () {
                MyModel.onInstanceChange(function (evt) {
                    changeCalled = [evt.object, evt.key];
                });
                var instance = MyModel.create();
                instance.set("attr", "val");
                expect(changeCalled).to(equal, [instance, "attr"]);
            });
            
        });
        
        describe("getting and setting", function () {
            var instanceOne, instanceTwo;
            before(function () {
                MyModel = MBX.JsModel.create("MyModel", {
                    instanceMethods: {
                        defaults: {
                            someArray: [],
                            someString: "hi",
                            someObject: {
                                someAttr: "attr"
                            }
                        }
                    }
                });
                instanceOne = MyModel.create();
                instanceTwo = MyModel.create();
            });
            
            it("should allow setting a new attribute on one instance only", function () {
                instanceOne.set("something", "hi");
                expect(instanceOne.get("something")).to(equal, "hi");
                expect(instanceTwo.get("something")).to(be_undefined);
            });
            
            it("should not interfere from instance to instance when changing defaults", function () {
                instanceOne.set("someString", "bye");
                expect(instanceOne.get("someString")).to(equal, "bye");
                expect(instanceTwo.get("someString")).to(equal, "hi");
            });
            
            it("should allow setting of deep objects without conflicting with other instances", function () {
                instanceOne.set("someObject", {
                    someAttr: 'hi'
                });
                expect(instanceOne.get("someObject").someAttr).to(equal, "hi");
                expect(instanceTwo.get("someObject").someAttr).to(equal, 'attr');
            });
            
            it("should allow setting of arrays without conflicting with other instances", function () {
                instanceOne.get("someArray").push("hi");
                expect(instanceOne.get("someArray")[0]).to(equal, "hi");
                expect(instanceTwo.get("someArray")[0]).to(be_undefined);
            });
            
            describe("class level attributes", function () {
                it("should allow you to store class level attributes", function () {
                    MyModel.set("hi", "bye");
                    expect(MyModel.get("hi")).to(equal, "bye");
                });
                
                describe("firing events", function () {
                    var classEventFired, keyEventFired;
                    before(function () {
                        classEventFired = false;
                        keyEventFired = false;
                        
                        var classFired = function (evt) {
                            classEventFired = evt;
                        };
                        
                        var keyFired = function (evt) {
                            keyEventFired = evt;
                        };
                        
                        MBX.EventHandler.subscribe(MBX, "MyModel_change_attribute", classFired);
                        MBX.EventHandler.subscribe(MyModel, "hi_changed", keyFired);
                        MyModel.set("hi", "something");
                    });
                    
                    it("should fire the class level event", function () {
                        expect(classEventFired).to(be_true);
                    });
                    
                    it("should fire the key level event", function () {
                        expect(keyEventFired).to(be_true);
                    });

					it("should allow you to touch the key and trigger change events", function () {
						keyEventFired = false;
						MyModel.touch("hi");
						expect(keyEventFired).to(be_true);
					});
                    
                    
                });
                
            });
            
        });
        
        describe("beforeCreate", function () {
            it("should allow you to halt the normal addition to the cache by adding an error", function () {
                var raised = false;
                MyModel = MBX.JsModel.create("MyModel", {
                    instanceMethods: {
                        beforeCreate: function () {
                            this.errors = "There was an error";
                        }
                    }
                });
                try {
                    var instance = MyModel.create();
                } catch (e) {
                    raised = true;
                }
                expect(raised).to(be_false);
                expect(instance.primaryKey()).to(be_undefined);
                expect(MyModel.findAll().length).to(equal, 0);
                expect(instance.errors).to(equal, "There was an error");
            });
            
            it("should get executed right after an instance gets its attributes", function () {
                MyModel = MBX.JsModel.create("MyModel", {
                    instanceMethods: {
                        beforeCreate: function () {
                            this.set('aFunctionDefinedAttribute', this.get('somePassedAttribute'));
                        }
                    }
                });
                var instance = MyModel.create({
                    somePassedAttribute: 'cool'
                });
                expect(instance.get('aFunctionDefinedAttribute')).to(equal, "cool");
            });
            
        });
        
        it("should allow default instance attributes", function () {
            MyModel = MBX.JsModel.create("MyModel", {
                instanceMethods: {
                    defaults: {
                        myAttr: "cool"
                    }
                }
            });
            
            expect(MyModel.create().get('myAttr')).to(equal, "cool");
        });
                
        describe("a new model", function () {
            before(function () {
                TH.countEvent(MBX.JsModel.Event.newModel);
                MyModel = MBX.JsModel.create('MyModel');
            });
            
            it("should have the modelName that was passed to it", function () {
                expect(MyModel.modelName).to(equal, "MyModel");
            });
            
            it("should have constants for new_instance, instance_change events", function (){ 
                expect(MyModel.Event.newInstance).to_not(be_null);
                expect(MyModel.Event.changeInstance).to_not(be_null);
            });
            
            it("should fire a new model event", function () {
                expect(TH.eventCountFor(MBX.JsModel.Event.newModel)).to(equal, 1);
            });
            
            it("should respond to create", function () {
                expect(typeof MyModel.create()).to(equal, "object"); 
            });
            
            it("should have the correct event names", function () {
                expect(MyModel.Event.changeInstance).to(match, /^MyModel_/);
                expect(MyModel.Event.newInstance).to(match, /^MyModel_/);   
            });
            
            it("should allow extentions of only this model", function () {
                MBX.JsModel.destroyModel('MyModel');
                MyModel = MBX.JsModel.create('MyModel', {
                    thisModelOnlyAttr: "cool"
                });
                expect(MyModel.thisModelOnlyAttr).to(equal, "cool");
            });
            
            it("should return findAll as an empty array without any instances", function () {
                expect(MyModel.findAll()).to(equal, []);
            });
            
        });
        
        describe('creating a model with the module pattern', function () {
            before(function () {
                MyModel = MBX.JsModel.create('MyModel', (function () {
                    var self = {};
                    var privateFunc = function () {
                        return 'private';
                    };
                    self.publicFunc = function () {
                        return 'public: private is: ' + privateFunc();
                    };
                    
                    self.instanceMethods = {
                        defaults: {
                            myAttr: "cool"
                        }
                    };
                    
                    return self;
                })());
            });
            
            it("should be a model", function () {
                expect(MyModel.modelName).to(equal, "MyModel");
                expect(MyModel.count()).to(equal, 0);
            });
            
            it("should retain its functions", function () {
                expect(MyModel.publicFunc()).to(equal, "public: private is: private");
            });
            
            it('should still get extended when using JsModel.extend', function () {
                MBX.JsModel.extend({
                   newAttr: "cool" 
                });
                expect(MyModel.newAttr).to(equal, "cool");
            });
            
            it('should still be able to use the pre-defined attributes if they are public', function () {
                expect(MyModel.create().get('myAttr')).to(equal, 'cool');
            });
            
            describe("extending instances using the module pattern", function () {
                before(function () {
                    MyModel.extendInstances((function () {
                        var self = {};
                        var privateInstanceFunc = function () {
                            return 'private';
                        };

                        self.publicInstanceFunc = function () {
                            return 'public:' + privateInstanceFunc();
                        };

                        return self;
                    })());
                });
                
                it('should retain instance-access to private functions', function () {
                    expect(MyModel.create().publicInstanceFunc()).to(equal, 'public:private');
                });
                
            });
            
        });
        
        describe('a model with a primary key other than GUID', function () {
           var instance;
           before(function () {
              MyModel = MBX.JsModel.create('MyModel', {
                  primaryKey: 'nativePath'
              });
              TH.countEvent(MyModel.Event.newInstance);
              instance = MyModel.create({
                  nativePath: "1"
              });
           });
           
           it('should cache the instance by the primary key', function () {
               expect(MyModel.instanceCache[instance.get('nativePath')]).to(equal, instance);
           });
           
           it("should not allow two objects with the same primary key", function () {
               var raised = false;
               try {
                   MyModel.create({ nativePath: "1" });
               } catch (e) {
                   raised = true;
               }
               expect(raised).to(be_true);
           });
           
           it("should respond to primaryKey() with its primary key", function () {
               expect(instance.primaryKey()).to(equal, '1');
           });

		   it("should allow you to change the primary key and still find objects", function () {
				instance.set('nativePath', '2');
				expect(MyModel.find('2')).to(equal, instance);
		   });
           
           it('should allow finds by the primary key', function () {
               expect(MyModel.find('1')).to(equal, instance);
           });
           
           it("should allow you to destroy the old object and then create a new one with the old primary key", function () {
               instance.destroy();
               var raised = false;
               try {
                   MyModel.create({ nativePath: "1" });
               } catch (e) {
                   raised = true;
               }
               expect(raised).to(be_false);
           });
           
        });
        
        describe('a model instance', function () {
           var instance, view;
           before(function () {
              MyModel = MBX.JsModel.create('MyModel');
              MyView = MBX.JsView.create({
                  model: MyModel
              });
              TH.countEvent(MyModel.Event.newInstance);
              instance = MyModel.create();
           });
           
           it("should fire a new instance event", function () {
               expect(TH.eventCountFor(MyModel.Event.newInstance)).to(equal, 1);
           });
           
           it("should have a GUID in the form <ModelName>_<Integer>", function () {
               expect(instance.GUID).to(match, /MyModel_\d+/); 
           });
           
           it("should cache the instance", function () {
               expect(MyModel.instanceCache[instance.GUID]).to(equal, instance);
           });
           
           it("should take attributes at create and allow 'get' to get them", function () {
               expect(MyModel.create({test: 'cool'}).get('test')).to(equal, 'cool');
           });
           
           it("should be found by Model.find", function () {
               expect(MyModel.find(instance.GUID)).to(equal, instance);
           });
           
           it("should respond to primaryKey() with the GUID", function () {
               expect(instance.primaryKey()).to(equal, instance.GUID);
           });
           
           it("should be in the instances returned by findAll", function () {
               expect(MyModel.count()).to(equal, 1);
               expect(MyModel.findAll().include(instance)).to(be_true);
           });
           
           it("should allow you to observe a key", function () {
               var called = false;
               var keyCalled = function (evt) {
                   called = true;
               };
               instance.observe("key", keyCalled);
               instance.set("key", "changed");
               expect(called).to(be_true);
           });
           
           it("should allow you to observe a key twice", function () {
               var called = false;
               var keyCalled = function (evt) {
                   called = true;
               };
               instance.observe("key", keyCalled);
               instance.set("key", "changed");
               called = false;
               instance.set("key", "changedAgain");
               
               expect(called).to(be_true);
           });
           
           it("should allow you to flush all instances of the model", function () {
               MyModel.flush();
               expect(MyModel.findAll().length).to(equal, 0);
           });
           
           it("should increase the count", function () {
               expect(MyModel.count()).to(equal, 1);
           });
           
           it("should be able to be found by an element with the correct classname", function () {
               var el = new Element("div", {
                   className: MyView.cssForInstance(instance)
               });
               $("dom_test").update(el);
               expect(MyModel.findByElement(el)).to(equal, instance);
           });
           
           describe("destroying an instance", function () {
               var primaryKey;
               before(function () {
                   TH.countEvent(MyModel.Event.destroyInstance);
                   TH.countEvent(MyModel.Event.changeInstance);
                   
                   primaryKey = instance.primaryKey();
                   instance.destroy();
               });
               
               it("should adjust the instance count", function () {
                   expect(MyModel.count()).to(equal, 0);
               });
               
               it("should remove the instance from the cache", function () {
                   expect(MyModel.findAll().include(instance)).to(be_false);
                   expect(MyModel.find(primaryKey)).to(be_null);
               });
               
               it("should fire the destroy event", function () {
                   expect(TH.eventCountFor(MyModel.Event.destroyInstance)).to(equal, 1);
               });
               
               it("should respond with true to isDestroyed()", function () {
                   expect(instance.isDestroyed()).to(be_true);
               });
               
               it("should no longer fire change events", function () {
                   instance.set('something', 'else');
                   expect(TH.eventCountFor(MyModel.Event.changeInstance)).to(equal, 0);
                   
               });
               
           });
           
           describe('when updating keys', function () {
               var changeEvent;
               before(function () {
                  changeEvent = MyModel.Event.changeInstance;
                  TH.countEvent(changeEvent);
                  expect(instance.get('myAttr')).to(be_null);
                  instance.set('myAttr', 'cool');
               });
               
               it("should fire a change event", function () {
                   expect(TH.eventCountFor(changeEvent)).to(equal, 1);
               });
               
               it("should set the actual key", function () {
                   expect(instance.get('myAttr')).to(equal, 'cool');
               });
               
               it("should namespace the attributes within the object", function () {
                   // NOTE:  never actually use the code below to access attributes
                   expect(instance.attributes.myAttr).to(equal, "cool");
               });
               
               it("should allow bulk updates using updateAttributes", function () {
                   instance.updateAttributes({
                       myAttr: "super-cool",
                       anotherAttr: "cool" 
                   });
                   expect(instance.get('myAttr')).to(equal, "super-cool");
                   expect(instance.get('anotherAttr')).to(equal, "cool");
               });
               
               it("should not fire a change event if the attribute hasn't changed", function () {
                   instance.set('myAttr', 'cool');
                   // the equal, 1 is from the original set - so this one should not increment it to 2
                   expect(TH.eventCountFor(changeEvent)).to(equal, 1);
               });
               
               it("should allow you to touch a key", function () {
                    instance.touch("myAttr");
                    expect(TH.eventCountFor(changeEvent)).to(equal, 2);
               });
               
           });
           
        });
        
        describe("extending instance methods", function () {
            before(function () {
               MyModel = MBX.JsModel.create("MyModel", {
                   instanceMethods: {
                       anAllInstanceMethod: function () {
                           return true;
                       }
                   }
               });
               InstanceMethodTestModel = MBX.JsModel.create("InstanceMethodTestModel");
            });
            
            after(function () {
                MBX.JsModel.destroyModel('InstanceMethodTestModel');
            });
            
            it("should add the method to all instances", function () {
                expect(MyModel.create().anAllInstanceMethod()).to(be_true);
            });
            
            it("should NOT add it to other model's instances", function () {
               expect(InstanceMethodTestModel.create().anAllInstanceMethod).to(be_undefined); 
            });
            
            it('should allow you to call .extendInstances on a model to extend the instances', function () {
                MyModel.extendInstances({
                   aNewAttribute: 'worked' 
                });
                expect(MyModel.create().aNewAttribute).to(equal, 'worked');
            });
            
        });
        
        describe("extending JsModel", function () {
            before(function () {
                TH.Mock.obj("MBX.JsModel");
                PrototypeTestModel = MBX.JsModel.create('PrototypeTestModel');
                MyModel = MBX.JsModel.create('MyModel');
            });
            
            after(function () {
                MBX.JsModel.destroyModel("PrototypeTestModel");
            });
             
            it("should allow extentions of all model's prototype", function () {
                MBX.JsModel.extend({
                   newAttr: "cool" 
                });
                expect(MyModel.newAttr).to(equal, "cool");
                expect(PrototypeTestModel.newAttr).to(equal, "cool");
            });

            it("should allow extentions of all model's instance prototypes", function () {
                MBX.JsModel.extendInstancePrototype({
                   newAttr: "cool" 
                });
                expect(MyModel.create().newAttr).to(equal, "cool");
                expect(PrototypeTestModel.create().newAttr).to(equal, "cool");
            });
        });
        
        
    });
});
