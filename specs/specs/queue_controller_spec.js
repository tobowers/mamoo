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
            queue.oldStop = queue.stop;
            queue.stop = function () {
                stopCalled = true;
                queue.oldStop();
            };
            queue.destroy();
            expect(stopCalled).to(be_true);
        });
        
        describe("queue timing", function () {
            var called = 0;
            before(function() {
                called = 0;
                queue.add(function () {
                    called++;
                });
                expect(MBX.QueueController.subscriptions[queue.primaryKey()]).to_not(be_null);
                queue.emit("timer_complete", {
                    queue: queue
                });
            });
            
            it('should fire the next function', function (me) {
                using(me).wait(2).and_then(function () {
                    expect(called).to(equal, 1);
                });
            });
            
            it('should not fire the next function if criteria returns false', function () {
                var newQueueCalled = 0;
                var newQueue = MBX.Queue.create({
                    interval: 20000,
                    criteria: function () { return false; }
                });
                newQueue.add(function () {
                    newQueueCalled++;
                });
                newQueue.emit("timer_complete", {
                    queue: newQueue
                });
                expect(newQueueCalled).to(equal, 0);
                newQueue.destroy();
            });
            
        });
        
        
        
    });
});
