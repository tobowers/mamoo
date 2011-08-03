Screw.Unit(function() {
    describe('MBX.JsModelBindings', function() {
        var MyModel;
        before(function () {
            MyModel = MBX.JsModel.create("MyModel");
        });

        after(function () {
            MBX.JsModel.destroyModel("MyModel");
        });

        it("should update objects on attribute changes", function () {
            var testObj = {}
            MyModel.updatesOn("key", {
                object: testObj,
                attribute: "testKey"
            });
            MyModel.set("key", "something");
            expect(testObj.testKey).to(equal,   "something");

        });
    });
});
