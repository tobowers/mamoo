Screw.Unit(function() {
    describe('MBX.QueueController', function() {
        var queue;
        before(function () {
            // the 20 seconds should give us fine grain control on the test
            queue = MBX.Queue.create({ interval: 20000 }).start();
        });
        
        after(function () {
            queue.destroy();
        });
        
        it("should listen to Queue model events", function () {
            expect(MBX.QueueController.model).to(equal, MBX.Queue);
        });
        
        it("should stop the queue on destroy", function () {
            var stopCalled = false;
            queue.stop = queue.stop.wrap(function (oldStop) {
                stopCalled = true;
                oldStop();
            });
            queue.destroy();
            expect(stopCalled).to(be_true);
        });
        
        describe("queue timing", function () {
            var called;
            before(function() {
                called = 0;
                queue.add(function () {
                    called++;
                });
                
                // make the event fire right away even though we're allowing the eventhandler
                // to defer this
                //TH.setTimeout.mock();
                
                expect(MBX.QueueController.subscriptions[queue.primaryKey()]).to_not(be_null);
                MBX.EventHandler.fireCustom(queue, "timer_complete", {
                    queue: queue
                });
            });
            
            it('should fire the next function', function (me) {
                using(me).wait(2).and_then(function () {
                    expect(called).to(equal, 1);
                });
            });
            
            it('should not fire the next function if criteria returns false', function () {
                var newQueue = MBX.Queue.create({
                    interval: 20000,
                    criteria: function () { return false; }
                });
                newQueue.add(function () {
                    called++;
                });
                MBX.EventHandler.fireCustom(newQueue, "timer_complete", {
                    queue: newQueue
                });
                expect(called).to(equal, 0);
                newQueue.destroy();
            });
            
        });
        
        
        
    });
});
