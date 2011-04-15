
if(typeof MBX=='undefined'){if(typeof _=='undefined'){throw new Error("Mamoo depends upon the underscore library");}
if(typeof EventEmitter=='undefined'){throw new Error("Mamoo depends upon the EventEmitter library");}
MBX={};_(MBX).extend(EventEmitter.prototype);}
MBX.JsController=(function(){var publicObj={};var controllerCache={};var jsElementClass='.js_updateable';var JsController=function(name,opts){opts=opts||{};if(!name){throw new Error("A name must be specified");}
if(controllerCache[name]){throw new Error("A controller by that name exists");}
this.controllerName=name;_(this).extend(opts);if(this.model){this._subscribeToEvents();}
controllerCache[name]=this;MBX.emit(publicObj.Event.newController,{object:this});};_(JsController.prototype).extend(EventEmitter.prototype);_(JsController.prototype).extend({active:true,activate:function(){this.active=true;},deactivate:function(){this.active=false;},_onInstanceChange:function(evt){if(this.onInstanceChange&&this.active){this.onInstanceChange(evt.object,evt.key);}},_onInstanceCreate:function(evt){if(this.onInstanceCreate&&this.active){this.onInstanceCreate(evt.object);}},_onInstanceDestroy:function(evt){if(this.onInstanceDestroy&&this.active){this.onInstanceDestroy(evt.object);}},_onAttributeChange:function(evt){if(this.active&&typeof this.onAttributeChange=='function'){this.onAttributeChange(evt.key);}},_subscribeToEvents:function(){var model=this.model;if(!_(model).isArray()){model=[model];}
this.eventSubscriptions=[];_(model).each(_(function(model){var changeEvent=model.Event.changeInstance;var newEvent=model.Event.newInstance;var destroyEvent=model.Event.destroyInstance;var attributeEvent=model.Event.changeAttribute;var onInstanceChange=_(this._onInstanceChange).bind(this);var onInstanceCreate=_(this._onInstanceCreate).bind(this);var onInstanceDestroy=_(this._onInstanceDestroy).bind(this);var onAttributeChange=_(this._onAttributeChange).bind(this);MBX.on(changeEvent,onInstanceChange);this.eventSubscriptions.push({name:changeEvent,handler:onInstanceChange});MBX.on(newEvent,onInstanceCreate);this.eventSubscriptions.push({name:newEvent,handler:onInstanceCreate});MBX.on(destroyEvent,onInstanceDestroy);this.eventSubscriptions.push({name:destroyEvent,handler:onInstanceDestroy});MBX.on(attributeEvent,onAttributeChange);this.eventSubscriptions.push({name:attributeEvent,handler:onAttributeChange});}).bind(this));},_unsubscribeToEvents:function(){if(this.eventSubscriptions&&this.eventSubscriptions[0]){_(this.eventSubscriptions).each(function(obj){MBX.removeListener(obj.name,obj.handler);});}}});publicObj.Event={newController:"new_controller",afterRender:"render_finished"};publicObj.extend=function(methsAndAttrs){methsAndAttrs=methsAndAttrs||{};_(JsController.prototype).extend(methsAndAttrs);};publicObj.destroyController=function(name){if(controllerCache[name]){controllerCache[name]._unsubscribeToEvents();delete controllerCache[name];}};publicObj.create=function(name,opts){if(controllerCache[name]){throw new Error("A controller with the name of "+name+" is already in use");}
var controller=new JsController(name,opts);if(typeof controller.initialize=="function"){controller.initialize();}
return controller;};return publicObj;})();
MBX.Constructor=function(o){function F(){}
F.prototype=o;return new F();};MBX.JsModel=(function(){var publicObj={};var currentGUID=0;var modelCache={};var oneJsModelInstance={set:function(key,value){var changed=false;if(this.attributes[key]!=value){changed=true;}
var oldValue=this.attributes[key];this.attributes[key]=value;if(changed){if(key==this.parentClass.primaryKey){this._handlePrimaryKeyChange(oldValue,value);}
this._fireChangeEvent(key);}
return this;},touch:function(key){this._fireChangeEvent(key);},get:function(key){return this.attributes[key];},updateAttributes:function(obj){obj=obj||{};for(k in obj){if(obj.hasOwnProperty(k)){this.set(k,obj[k]);}}},primaryKey:function(){if(this.parentClass.primaryKey){return this.get(this.parentClass.primaryKey);}else{return this.GUID;}},destroy:function(){delete this.parentClass.instanceCache[this.primaryKey()];this.__MBXJsModelWasDestroyed=true;MBX.emit(this.parentClass.Event.destroyInstance,{object:this});},isDestroyed:function(){return this.__MBXJsModelWasDestroyed;},observe:function(key,func){return this.on(key+"_changed",func);},_createGUID:function(){this.GUID=this.parentClass.modelName+"_"+MBX.JsModel.nextGUID();},_fireChangeEvent:function(key){if(!this.isDestroyed()){var changeObject={object:this,key:key};MBX.emit(this.parentClass.Event.changeInstance,changeObject);this.emit(key+"_changed",changeObject);}},_handlePrimaryKeyChange:function(oldValue,newValue){var instanceCache=this.parentClass.instanceCache;if(instanceCache[oldValue]){delete instanceCache[oldValue]
instanceCache[newValue]=this;}}};_(oneJsModelInstance).extend(EventEmitter.prototype);var JsModel=function(name,opts){opts=opts||{};if(!name){throw new Error("A name must be specified");}
if(modelCache[name]){throw new Error("The model: "+name+" already exists");}
if(opts.primaryKey&&(typeof opts.primaryKey!="string")){throw new Error("primaryKey specified was not a string");}
_(this).extend(opts);this.modelName=name;this.instanceCache={};this.attributes={};this.prototypeObject=MBX.Constructor(oneJsModelInstance);this.prototypeObject.parentClass=this;this.Event={newInstance:this.modelName+"_new_instance",changeInstance:this.modelName+"_change_instance",destroyInstance:this.modelName+"_destroy_instance",changeAttribute:this.modelName+"_change_attribute"};if(opts.instanceMethods){_(this.prototypeObject).extend(opts.instanceMethods);}
modelCache[name]=this;if(typeof this.initialize=="function"){this.initialize();}
MBX.emit("new_model",{object:this});};JsModel.prototype={create:function(attrs){attrs=attrs||{};var obj=MBX.Constructor(this.prototypeObject);obj.errors=null;obj.attributes={};if(obj.defaults){_(obj.attributes).extend(obj.defaults);_(obj.attributes).each(function(value,key){if(_(value).isArray()){obj.defaults[key]=_(value).clone();}else{if(typeof value=="object"){obj.defaults[key]=_.clone(value);}}});}
_(obj.attributes).extend(attrs);if(typeof obj.beforeCreate=='function'){obj.beforeCreate();}
if(!obj.errors){if(this.validateObject(obj)){obj._createGUID();this.cacheInstance(obj);MBX.emit(this.Event.newInstance,{object:obj});if(typeof obj.afterCreate=="function"){obj.afterCreate();}
return obj;}else{throw new Error("trying to create an instance of "+this.modelName+" with the same primary key: '"+obj.get(this.primaryKey)+"' as another instance. Caller was: "+arguments.callee.caller.toString());}}else{MBX.emit(this.Event.newInstance,{object:obj});return obj;}},validateObject:function(instance){if(this.primaryKey){if(!instance.get(this.primaryKey)){return false;}
if(this.find(instance.get(this.primaryKey))){return false;}}
return true;},extendInstances:function(attrs){attrs=attrs||{};_(this.prototypeObject).extend(attrs);},cacheInstance:function(instance){if(this.primaryKey){this.instanceCache[instance.get(this.primaryKey)]=instance;}else{this.instanceCache[instance.GUID]=instance;}},find:function(primaryKey){return this.instanceCache[primaryKey];},findAll:function(){return _(this.instanceCache).values();},flush:function(){this.instanceCache={};},count:function(){return this.findAll().length;},set:function(key,value){var changed=false;if(this.attributes[key]!=value){changed=true;}
this.attributes[key]=value;if(changed){this._fireChangeEvent(key);}},touch:function(key){this._fireChangeEvent(key);},get:function(key){return this.attributes[key];},onInstanceCreate:function(func){return MBX.on(this.Event.newInstance,func);},onInstanceDestroy:function(func){return MBX.on(this.Event.destroyInstance,func);},onInstanceChange:function(func){return MBX.on(this.Event.changeInstance,func);},onAttributeChange:function(func){return MBX.on(this.Event.changeAttribute,func);},_fireChangeEvent:function(key){MBX.emit(this.Event.changeAttribute,{object:this,key:key});this.emit(key+"_changed",{object:this});}};_(JsModel.prototype).extend(EventEmitter.prototype);publicObj.Event={newModel:"new_model"};publicObj.create=function(name,opts){return new JsModel(name,opts);};publicObj.nextGUID=function(){return currentGUID++;};publicObj.extend=function(methsAndAttrs){methsAndAttrs=methsAndAttrs||{};_(JsModel.prototype).extend(methsAndAttrs);};publicObj.extendInstancePrototype=function(methsAndAttrs){_(oneJsModelInstance).extend(methsAndAttrs);};publicObj.destroyModel=function(name){delete modelCache[name];};return publicObj;})();
MBX.JsView=(function(){var self={};var View=function(opts){opts=opts||{};_(this).extend(opts);if(this.model){this._subscribeToEvents();}
if(typeof this.initialize=='function'){this.initialize();}};View.prototype={active:true,activate:function(){this.active=true;},deactivate:function(){this.active=false;},_onInstanceChange:function(evt){if(this.active&&typeof this.onInstanceChange=='function'){this.onInstanceChange(evt.object,evt.key);}},_onInstanceCreate:function(evt){if(this.active&&typeof this.onInstanceCreate=='function'){this.onInstanceCreate(evt.object);}},_onInstanceDestroy:function(evt){if(this.active&&typeof this.onInstanceDestroy=='function'){this.onInstanceDestroy(evt.object);}},_onAttributeChange:function(evt){if(this.active&&typeof this.onAttributeChange=='function'){this.onAttributeChange(evt.key);}},_subscribeToEvents:function(){var changeEvent=this.model.Event.changeInstance;var newEvent=this.model.Event.newInstance;var destroyEvent=this.model.Event.destroyInstance;var attributeEvent=this.model.Event.changeAttribute;var defer=this.looselyCoupled;MBX.on(changeEvent,_(this._onInstanceChange).bind(this));MBX.on(newEvent,_(this._onInstanceCreate).bind(this));MBX.on(destroyEvent,_(this._onInstanceDestroy).bind(this));MBX.on(attributeEvent,_(this._onAttributeChange).bind(this));}};self.create=function(opts){return new View(opts);};self.extend=function(methsAndAttrs){methsAndAttrs=methsAndAttrs||{};_(View.prototype).extend(methsAndAttrs);};_(View.prototype).extend(EventEmitter.prototype);return self;})();
MBX.Queue=MBX.JsModel.create("Queue",{instanceMethods:{defaults:{interval:1000,functions:[],singleItem:false,selfStopped:false},_fireTimerEvent:function(){this.emit("timer_complete",{queue:this});},_setupTimer:function(){var interval=this.get('interval');var timer=this.get('timer');if(timer){clearTimeout(timer);}
this.set('timer',setTimeout(_(function(){this._fireTimerEvent();this._setupTimer();}).bind(this),interval));},stop:function(){var timer=this.get('timer');if(timer){clearTimeout(timer);this.set('timer',null);}
return this;},start:function(){if(this.get('functions').length===0){this.set('selfStopped',true);}else{this._setupTimer();}
return this;},add:function(func){if(this.get("singleItem")){this.get('functions')[0]=func;}else{this.get('functions').push(func);}
if(this.get('selfStopped')){this._setupTimer();this.set('selfStopped',false);}},remove:function(func){var iterator=function(f){return f==func;};this.set("functions",_(this.get("functions")).reject(iterator));},nextFunction:function(){return this.get('functions')[0];},fireNextFunction:function(){var funcs=this.get('functions');funcs.shift()();if(funcs.length===0){this.stop();this.set('selfStopped',true);}}}});
MBX.QueueController=MBX.JsController.create("QueueController",{model:MBX.Queue,subscriptions:{},handleTimerComplete:function(evt){var queue=evt.queue;if(queue.nextFunction()){var criteria=queue.get("criteria");if(criteria){if(criteria()){queue.fireNextFunction();}}else{queue.fireNextFunction();}}},onInstanceCreate:function(queue){var handler=_(this.handleTimerComplete).bind(this);this.subscriptions[queue.primaryKey()]=handler;queue.on("timer_complete",handler);},onInstanceDestroy:function(queue){this.renderNothing=true;var subscription=this.subscriptions[queue.primaryKey()];if(subscription){queue.removeListener("timer_complete",subscription);delete this.subscriptions[queue.primaryKey()];}
queue.stop();}});