Screw.Unit(function() {
    describe('MBX.JsTemplate', function() {
        var myTemplate;
        var MyModel;
        before(function () {
            MyModel = MBX.JsModel.create('MyModel');
            MBX.JsTemplate.destroyTemplate('MyTemplate');
            myTemplate = function (obj) {
                return ["hi", obj.name, "bye"].join('');
            };
        });
        
        after(function () {
           MBX.JsModel.destroyModel("MyModel"); 
        });
        
        it("should be able to give you a template class from a model name", function () {
            expect(MBX.JsTemplate.cssFromModel(MyModel)).to(equal, "mymodel");
        });
        
        it("should be able to give you a css class from an instance", function () {
            var instance = MyModel.create();
            expect(MBX.JsTemplate.cssFromInstance(instance)).to(equal, "mymodel_" + instance.primaryKey().toLowerCase());
        });
        
        describe("a new template", function () {
            before(function () {
               MBX.JsTemplate.create("MyTemplate", myTemplate); 
            });
            
            it("should be able to retrieve that template", function () {
               expect(MBX.JsTemplate.find("MyTemplate")).to(equal, myTemplate); 
            });
            
            it("should be able to render the template", function () {
               expect(MBX.JsTemplate.render("MyTemplate", {name: 'bob'})).to(equal, "hibobbye"); 
            });
            
        });
        
        // this template test fails for now... it's a timing issue - the domMock isn't getting evaluated fast enough
        describe("prerendered templates", function () {
            before(function () {
                MBX.prerenderedTemplates = {
                    myPrerendered: function (obj) {
                        return ['pre', obj.words].join('');
                    }
                };                
                MBX.JsTemplate.fetchPreRenderedTemplates();
            });
            
            it("should load the prerendered templates from the MBX.prerenderedTemplates object", function () {                
                expect(MBX.JsTemplate.render("myPrerendered", {words: 'rendered'})).to(equal, "prerendered");
            });
            
        });
        
        
    });
});
