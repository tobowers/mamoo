TH.eventCountCache = {};
TH.eventSubscriptions = [];
    
TH.countEvent = function (eventName) {
    TH.eventCountCache[eventName] = 0;
    var handler = function () {
        TH.eventCountCache[eventName]++;
    };
    MBX.on(eventName, handler);
    TH.eventSubscriptions.push({name: eventName, handler: handler});
};
    
TH.eventCountFor = function (eventName) {
    return TH.eventCountCache[eventName];
};

TH.resetEventCount = function () {
    TH.Mock.eventCountCache = {};
    _(TH.eventSubscriptions).each(function (obj) {
        MBX.removeListener(obj.name, obj.handler);
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
            _(MBX.Queue.findAll()).each(function (q) {
                q.destroy();
            });
        }

    });
});
