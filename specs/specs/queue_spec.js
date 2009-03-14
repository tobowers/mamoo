Screw.Unit(function() {
    describe('MBX.Queue', function() {
        
        it("should have Queue for a model name", function () {
            expect(MBX.Queue.modelName).to(equal, "Queue");
        });
        
        describe("A single queue", function () {
            var queue;
            var subscription;
            before(function () {
                queue = MBX.Queue.create({
                    interval: 0
                });
            });
            
            after(function () {
                queue.destroy();
            });
            
            describe('starting the queue', function () {
               describe('with no functions in it', function () {
                   before(function () {
                       queue.start();
                   });
                   
                   it("should assign selfStopped", function () {
                       expect(queue.get('selfStopped')).to(be_true);
                   });
                   
                   it('should not start the timer', function () {
                       expect(queue.get('timer')).to(be_undefined);
                   });
               });
               
               describe('with a function in it', function () {
                   before(function () {
                       queue.add(function () {});
                       queue.start();
                   });
                   
                   it("should start the timer", function () {
                       expect(typeof queue.get("timer")).to(equal, "number");
                   });
                   
                   it('should not set selfStopped', function () {
                       expect(queue.get('selfStopped')).to_not(be_true);
                   });
               });
                
            });
            
            
            it("should stop the timer when stop is called", function () {
                queue.stop();
                expect(queue.get("timer")).to(be_null);
            });
            
            describe('adding functions', function () {
                var blankFunc = function () {};
                describe("to a normal queue", function () {
                    before(function () {

                        secondQueue = MBX.Queue.create({
                            interval: 0
                        });

                        queue.add(blankFunc);
                    });

                    after(function () {
                        secondQueue.destroy();
                    });

                    it("should allow additions to the queue", function () {
                        expect(queue.get('functions')[0]).to(equal, blankFunc);
                    });

                    it("should only get added to one queue", function () {
                        expect(secondQueue.nextFunction()).to(be_undefined);
                    });

                    it("should return nextFunction", function () {
                        expect(queue.nextFunction()).to(equal, blankFunc);
                    });
                    
                    describe("and then removing them", function () {
                        before(function () {
                            expect(queue.get('functions').include(blankFunc)).to(be_true);
                            queue.remove(blankFunc);
                        });
                        
                        it("should remove the function from the queue", function () {
                            expect(queue.get('functions').include(blankFunc)).to_not(be_true);
                        });
                    });
                    
                });
                
                describe("to a singleItem queue", function () {
                    before(function () {
                        queue.set('singleItem', true);
                    });
                    
                    it("should only have one function at a time", function () {
                        expect(queue.get('functions').length).to(equal, 0);
                        queue.add(blankFunc);
                        expect(queue.get('functions').length).to(equal, 1);
                        queue.add(blankFunc);
                        expect(queue.get('functions').length).to(equal, 1);
                    });
                });
                
                describe("to a selfStopped queue", function () {
                    before(function () {
                        queue.set('selfStopped', true);
                        queue.add(blankFunc);
                    });
                    
                    it('should restart the timer', function () {
                        expect(queue.get('selfStopped')).to(equal, false);
                    });
                    
                });
                
                
            });
            
            describe('firing functions', function () {
                var funcCalled;
                var functionCaller = function () {
                    funcCalled = true;
                };
                
                before(function () {
                    funcCalled = false;
                    queue.add(functionCaller);
                    queue.start();
                });
                
                describe('with only one function in the queue', function () {
                    before(function () {
                        queue.fireNextFunction();
                    });
                    
                    it("should fire the function", function () {
                        expect(funcCalled).to(be_true);
                    });
                    
                    it("should stop the timer", function () {
                        expect(queue.get('timer')).to(be_null);
                    });
                    
                    it('should set the selfStopped to true', function () {
                        expect(queue.get('selfStopped')).to(be_true);
                    });
                });
                
                describe('with two items in the queue', function () {
                    before(function () {
                        queue.add(functionCaller);
                        queue.fireNextFunction();
                    });
                    
                    it("should fire the function", function () {
                        expect(funcCalled).to(be_true);
                    });
                    
                    it("should not stop the timer", function () {
                        expect(typeof queue.get('timer')).to(equal, "number");
                    });
                    
                    it('should NOT set the selfStopped to true', function () {
                        expect(queue.get('selfStopped')).to_not(be_true);
                    });
                    
                    it('should leave the next function in the queue', function () {
                        expect(queue.get('functions').length).to(equal, 1);
                    }); 
                    
                });
                
                
            });
            
            
        });
        
    });
});