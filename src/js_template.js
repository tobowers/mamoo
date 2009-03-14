if (!("MBX" in window)) {
    /** @namespace
        @ignore
    */
    MBX = {};
}

/**
    Renders and stores templates. If you name templates the same as your models
    they will flow through the system automatically.  Otherwise, you can specify templates
    of any name and they can be used in your controllers
    @namespace
*/
MBX.JsTemplate = (function () {
    var publicObj = {};
    var templateCache = {};
    
    var parseTemplate = function (template, obj) {
        obj = obj || {};
        // for now
        return template(obj);
    };
    
    /**
        Given a model return the expected css class
        @param {JsModel} model the model of the class
        @returns a string of the expected class (no period)
        
        @name MBX.JsTemplate.cssFromModel
        @function
    */
    publicObj.cssFromModel = function (model) {
        return model.modelName.toLowerCase();
    };
    
    /**
        Given a model *instance* return the expected css class
        @param {JsModel#instance} instance the instance of a model
        @returns a string of the expected class (no period)
        
        @name MBX.JsTemplate.cssFromInstance
        @function
    */
    publicObj.cssFromInstance = function (instance) {
        return publicObj.cssFromModel(instance.parentClass) + "_" + instance.primaryKey().toLowerCase().gsub(/[^\w\-]/, "_");
    };
    
    /** Adds a new template to the system. Templates are not namespaced and hence all are global.
        Templates that have the same name as the model they belong to will be rendered by default on changes and creates.
        
        @param {String} name the name of the template
        @param {Function} template should be a function that will be passed an instance and return either a domElement or a string
        
        @name MBX.JsTemplate.create
        @function
    */
    publicObj.create = function (name, template) {
        templateCache[name] = template;
    };
    
    /** @returns the actual template function
        @param {String} name the name of the template
        @name MBX.JsTemplate.find
        @function
    */
    publicObj.find = function (name) {
        return templateCache[name];
    };
    
    /** @returns the actual DOM object or a string given whatever the template renders
        @param {String} name the name of a template
        @param {Object} obj the object that gets passed to the template
        @throws an error if the template doesn't exist
        @name MBX.JsTemplate.render
        @function
    */
    publicObj.render = function (name, obj) {
        if (!publicObj.find(name)) {
            throw new Error("Template: " + name + " does not exist");
        }
        return parseTemplate(templateCache[name], obj);
    };
    
    /** remove the template from the system
        @name MBX.JsTemplate.destroyTemplate
        @function
    */
    publicObj.destroyTemplate = function (name) {
        delete templateCache[name];
    };
    
    /** grab any templates from an object called MBX.prerenderedTemplates
        @name MBX.JsTemplate.fetchPreRenderedTemplates
        @function
    */
    publicObj.fetchPreRenderedTemplates = function () {
        if (MBX.prerenderedTemplates) {
            for (t in MBX.prerenderedTemplates) {
                if (MBX.prerenderedTemplates.hasOwnProperty(t)) {
                    publicObj.create(t, MBX.prerenderedTemplates[t]);
                }
            }
        }
    };
    
    MBX.EventHandler.onDomReady(publicObj.fetchPreRenderedTemplates);
    
    return publicObj;
})();
