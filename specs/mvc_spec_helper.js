TH.eventCountCache = {};
TH.eventSubscriptions = [];
    
TH.countEvent = function (eventName) {
    TH.Mock.eventCountCache[eventName] = 0;
    TH.eventSubscriptions.push(MBX.EventHandler.subscribe([".mbx", MBX], eventName, function () {
        TH.Mock.eventCountCache[eventName]++;
    }));
};
    
TH.eventCountFor = function (eventName) {
    return TH.Mock.eventCountCache[eventName];
};

TH.resetEventCount = function () {
    TH.Mock.eventCountCache = {};
    TH.eventSubscriptions.each(function (sub) {
        MBX.EventHandler.unsubscribe(sub);
    });
    TH.Mock.eventSubscriptions = [];
};

Screw.Matchers.be_near = {
     match: function(expected, actual) {
         if (!Object.isArray(expected)) {
             expected = [expected, 1];
         }
         return (actual < expected[0] + expected[1]) || (actual > expected[0] - expected[1]);
     },
     
     failure_message: function(expected, actual, not) {
       return 'expected ' + $.print(actual) + (not ? ' to not be within 1 of ' : ' to be within 1 of ') + expected;
     }
};

Screw.Unit(function() {
    before(function() {
        TH.resetEventCount();
        if (MBX.Queue) {
            MBX.Queue.findAll().each(function (q) {
                q.destroy();
            });
        }

    });
});
