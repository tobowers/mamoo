
if(!("MBX"in window)){MBX={};}
MBX.JsController=(function(){var publicObj={};var controllerCache={};var jsElementClass='.js_updateable';JsController=function(name,opts){opts=opts||{};if(!name){throw new Error("A name must be specified");}
if(controllerCache[name]){throw new Error("A controller by that name exists");}
this.controllerName=name;Object.extend(this,opts);if(opts.model){this._subscribeToEvents();}
controllerCache[name]=this;MBX.EventHandler.fireCustom(MBX,publicObj.Event.newController,{object:this});};JsController.prototype={_onInstanceChange:function(evt){if(this.onInstanceChange){this.onInstanceChange(evt.object,evt.key);}},_onInstanceCreate:function(evt){if(this.onInstanceCreate){this.onInstanceCreate(evt.object);}},fireAfterRender:function(){MBX.EventHandler.fireCustom(MBX,this.controllerName+"_"+MBX.JsController.Event.afterRender);},_onInstanceDestroy:function(evt){if(this.onInstanceDestroy){this.onInstanceDestroy(evt.object);}},_onAttributeChange:function(evt){if(typeof this.onAttributeChange=='function'){this.onAttributeChange(evt.key);}},_subscribeToEvents:function(){var changeEvent=this.model.Event.changeInstance;var newEvent=this.model.Event.newInstance;var destroyEvent=this.model.Event.destroyInstance;var attributeEvent=this.model.Event.changeAttribute;var defer=this.looselyCoupled;this.eventSubscriptions=[];this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX,changeEvent,this._onInstanceChange.bind(this),{defer:defer}));this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX,newEvent,this._onInstanceCreate.bind(this),{defer:defer}));this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX,destroyEvent,this._onInstanceDestroy.bind(this),{defer:defer}));this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX,attributeEvent,this._onAttributeChange.bind(this),{defer:defer}));},_unsubscribeToEvents:function(){if(this.eventSubscriptions&&this.eventSubscriptions[0]){this.eventSubscriptions.each(function(subscription){MBX.EventHandler.unsubscribe(subscription);});}}};publicObj.Event={newController:"new_controller",afterRender:"render_finished"};publicObj.extend=function(methsAndAttrs){methsAndAttrs=methsAndAttrs||{};Object.extend(JsController.prototype,methsAndAttrs);};publicObj.create=function(name,opts){if(controllerCache[name]){throw new Error("A controller with the name of "+name+" is already in use");}
var controller=new JsController(name,opts);if(typeof controller.initialize=="function"){controller.initialize();}
return controller;};publicObj.destroyController=function(name){if(controllerCache[name]){controllerCache[name]._unsubscribeToEvents();delete controllerCache[name];}};return publicObj;})();
if(!("MBX"in window)){MBX={};}
MBX.Constructor=function(o){function F(){}
F.prototype=o;return new F();};MBX.JsModel=(function(){var publicObj={};var currentGUID=0;var modelCache={};var oneJsModelInstance={set:function(key,value){var changed=false;if(this.attributes[key]!=value){changed=true;}
this.attributes[key]=value;if(changed){this._fireChangeEvent(key);}
return this;},touch:function(key){this._fireChangeEvent(key);},get:function(key){return this.attributes[key];},updateAttributes:function(obj){obj=obj||{};for(k in obj){if(obj.hasOwnProperty(k)){this.set(k,obj[k]);}}},primaryKey:function(){if(this.parentClass.primaryKey){return this.get(this.parentClass.primaryKey);}else{return this.GUID;}},destroy:function(){delete this.parentClass.instanceCache[this.primaryKey()];MBX.EventHandler.fireCustom(MBX,this.parentClass.Event.destroyInstance,{object:this});},observe:function(key,func){return MBX.EventHandler.subscribe(this,key+"_changed",func);},_createGUID:function(){this.GUID=this.parentClass.modelName+"_"+MBX.JsModel.nextGUID();},_fireChangeEvent:function(key){MBX.EventHandler.fireCustom(MBX,this.parentClass.Event.changeInstance,{object:this,key:key});MBX.EventHandler.fireCustom(this,key+"_changed");}};JsModel=function(name,opts){opts=opts||{};if(!name){throw new Error("A name must be specified");}
if(modelCache[name]){throw new Error("The model: "+name+" already exists");}
if(opts.primaryKey&&(typeof opts.primaryKey!="string")){throw new Error("primaryKey specified was not a string");}
Object.extend(this,opts);this.modelName=name;this.instanceCache={};this.attributes={};this.prototypeObject=MBX.Constructor(oneJsModelInstance);this.prototypeObject.parentClass=this;this.Event={newInstance:this.modelName+"_new_instance",changeInstance:this.modelName+"_change_instance",destroyInstance:this.modelName+"_destroy_instance",changeAttribute:this.modelName+"_change_attribute"};if(opts.instanceMethods){Object.extend(this.prototypeObject,opts.instanceMethods);}
modelCache[name]=this;if(typeof this.initialize=="function"){this.initialize();}
MBX.EventHandler.fireCustom(MBX,"new_model",{object:this});};JsModel.prototype={create:function(attrs){attrs=attrs||{};var obj=MBX.Constructor(this.prototypeObject);obj.errors=null;obj.attributes={};if(obj.defaults){Object.extend(obj.attributes,obj.defaults);$H(obj.attributes).each(function(pair){if(Object.isArray(pair.value)){obj.defaults[pair.key]=pair.value.clone();}else{if(typeof pair.value=="object"){obj.defaults[pair.key]==Object.clone(pair.value);}}});}
Object.extend(obj.attributes,attrs);if(typeof obj.beforeCreate=='function'){obj.beforeCreate();}
if(!obj.errors){if(this.validateObject(obj)){obj._createGUID();this.cacheInstance(obj);MBX.EventHandler.fireCustom(MBX,this.Event.newInstance,{object:obj});if(typeof obj.afterCreate=="function"){obj.afterCreate();}
return obj;}else{throw new Error("trying to create an instance of "+this.modelName+" with the same primary key: '"+obj.get(this.primaryKey)+"' as another instance");}}else{MBX.EventHandler.fireCustom(MBX,this.Event.newInstance,{object:obj});return obj;}},validateObject:function(instance){if(this.primaryKey){if(!instance.get(this.primaryKey)){return false;}
if(this.find(instance.get(this.primaryKey))){return false;}}
return true;},extendInstances:function(attrs){attrs=attrs||{};Object.extend(this.prototypeObject,attrs);},cacheInstance:function(instance){if(this.primaryKey){this.instanceCache[instance.get(this.primaryKey)]=instance;}else{this.instanceCache[instance.GUID]=instance;}},find:function(primaryKey){return this.instanceCache[primaryKey];},findAll:function(){return $H(this.instanceCache).values();},flush:function(){this.instanceCache={};},findByElement:function(el){el=$(el);var modelCss=this.modelName.toLowerCase();var match=el.className.match(new RegExp(modelCss+"_([^\\s$]+)"));if(match){var findIterator=function(pair){if(pair[0].gsub(/[^\w\-]/,"_").toLowerCase()==match[1]){return true;}};var instance=$H(this.instanceCache).find(findIterator);if(instance){return instance[1];}}},count:function(){return this.findAll().length;},set:function(key,value){var changed=false;if(this.attributes[key]!=value){changed=true;}
this.attributes[key]=value;if(changed){MBX.EventHandler.fireCustom(MBX,this.Event.changeAttribute,{object:this,key:key});MBX.EventHandler.fireCustom(this,key+"_changed");}},get:function(key){return this.attributes[key];},onInstanceCreate:function(func){return MBX.EventHandler.subscribe(MBX,this.Event.newInstance,func);},onInstanceDestroy:function(func){return MBX.EventHandler.subscribe(MBX,this.Event.destroyInstance,func);},onInstanceChange:function(func){return MBX.EventHandler.subscribe(MBX,this.Event.changeInstance,func);},onAttributeChange:function(func){return MBX.EventHandler.subscribe(MBX,this.Event.changeAttribute,func);}};publicObj.Event={newModel:"new_model"};publicObj.create=function(name,opts){return new JsModel(name,opts);};publicObj.nextGUID=function(){return currentGUID++;};publicObj.extend=function(methsAndAttrs){methsAndAttrs=methsAndAttrs||{};Object.extend(JsModel.prototype,methsAndAttrs);};publicObj.extendInstancePrototype=function(methsAndAttrs){Object.extend(oneJsModelInstance,methsAndAttrs);};publicObj.destroyModel=function(name){delete modelCache[name];};return publicObj;})();
if(!("MBX"in window)){MBX={};}
MBX.JsView=(function(){var self={};var jsElementClass='.js_updateable';self.modelCSS=function(model,prePend){prePend=prePend||"";return prePend+model.modelName.toLowerCase();};self.cssForInstance=function(instance,prePend){prePend=prePend||"";return prePend+self.modelCSS(instance.parentClass)+"_"+instance.primaryKey().toLowerCase().gsub(/[^\w\-]/,"_");};var View=function(opts){opts=opts||{};Object.extend(this,opts);if(this.model){this._subscribeToEvents();}
if(typeof this.initialize=='function'){this.initialize();}};View.prototype={div:function(className,opts){opts=opts||{};Object.extend(opts,{className:className});return new Element('div',opts);},imageTag:function(src,opts){opts=opts||{};Object.extend(opts,{src:src});return new Element("img",opts);},_onInstanceChange:function(evt){if(typeof this.onInstanceChange=='function'){this.onInstanceChange(evt.object,evt.key);}},_onInstanceCreate:function(evt){if(typeof this.onInstanceCreate=='function'){this.onInstanceCreate(evt.object);}},_onInstanceDestroy:function(evt){if(typeof this.onInstanceDestroy=='function'){this.onInstanceDestroy(evt.object);}},_onAttributeChange:function(evt){if(typeof this.onAttributeChange=='function'){this.onAttributeChange(evt.key);}},_subscribeToEvents:function(){var changeEvent=this.model.Event.changeInstance;var newEvent=this.model.Event.newInstance;var destroyEvent=this.model.Event.destroyInstance;var attributeEvent=this.model.Event.changeAttribute;var defer=this.looselyCoupled;this.eventSubscriptions=[];this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX,changeEvent,this._onInstanceChange.bind(this),{defer:defer}));this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX,newEvent,this._onInstanceCreate.bind(this),{defer:defer}));this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX,destroyEvent,this._onInstanceDestroy.bind(this),{defer:defer}));this.eventSubscriptions.push(MBX.EventHandler.subscribe(MBX,attributeEvent,this._onAttributeChange.bind(this),{defer:defer}));},modelCSS:function(prePend){return MBX.JsView.modelCSS(this.model,prePend);},cssForInstance:function(instance,prePend){return MBX.JsView.cssForInstance(instance,prePend);},elementsFromInstance:function(instance){return $$(this.modelCSS(".")+" "+cssForInstance("."));},domCollections:function(){var findString=[jsElementClass,this.modelCSS("."),'.collection'].join('');return $$(findString);}};self.create=function(opts){return new View(opts);};self.extend=function(methsAndAttrs){methsAndAttrs=methsAndAttrs||{};Object.extend(View.prototype,methsAndAttrs);};self.updatesOn=function(element,obj,key,opts){if(!obj||!key){throw new Error("You must specify a key or an object with updatesOn");}
element=$(element);opts=opts||{};var changeHandler=function(evt){var content=obj.get(key);if(opts.preProcess){content=opts.preProcess(obj,content,key);}
if(opts.handler){opts.handler(obj,element,content);}else{element.update(content);}};var sub=MBX.EventHandler.subscribe(obj,key+"_changed",changeHandler);element.__JsViewSubscriptions=element.__JsViewSubscriptions||[];element.__JsViewSubscriptions.push(sub);obj.__JsViewSubscriptions=obj.__JsViewSubscriptions||[];obj.__JsViewSubscriptions.push(sub);if(opts.updateNow){changeHandler();}
return element;};self.stopUpdating=function(element){element=$(element);if(element.__JsViewSubscriptions){while(element.__JsViewSubscriptions.length>0){MBX.EventHandler.unsubscribe(element.__JsViewSubscriptions.pop());}}
return element;};self.assignInstance=function(element,instance){element=$(element);element.__JsViewMvcInstance=instance;element.addClassName(MBX.JsView.modelCSS(instance.parentClass));element.addClassName(MBX.JsView.cssForInstance(instance));return element;};self.getInstance=function(element,instance){return element.__JsViewMvcInstance;};Element.addMethods({updatesOn:self.updatesOn,stopUpdating:self.stopUpdating,assignInstance:self.assignInstance,getInstance:self.getInstance});return self;})();
MBX.Queue=MBX.JsModel.create("Queue",{instanceMethods:{defaults:{interval:1000,functions:[],singleItem:false,selfStopped:false},_fireTimerEvent:function(){MBX.EventHandler.fireCustom(this,"timer_complete",{queue:this});},_setupTimer:function(){var interval=this.get('interval');var timer=this.get('timer');if(timer){clearTimeout(timer);}
this.set('timer',setTimeout(function(){this._fireTimerEvent();this._setupTimer();}.bind(this),interval));},stop:function(){var timer=this.get('timer');if(timer){clearTimeout(timer);this.set('timer',null);}
return this;},start:function(){if(this.get('functions').length===0){this.set('selfStopped',true);}else{this._setupTimer();}
return this;},add:function(func){if(this.get("singleItem")){this.get('functions')[0]=func;}else{this.get('functions').push(func);}
if(this.get('selfStopped')){this._setupTimer();this.set('selfStopped',false);}},remove:function(func){var iterator=function(f){return f==func;};this.set("functions",$A(this.get("functions")).reject(iterator));},nextFunction:function(){return this.get('functions')[0];},fireNextFunction:function(){var funcs=this.get('functions');funcs.shift()();if(funcs.length===0){this.stop();this.set('selfStopped',true);}}}});
MBX.QueueController=MBX.JsController.create("QueueController",{model:MBX.Queue,subscriptions:{},handleTimerComplete:function(evt){var queue=evt.queue;if(queue.nextFunction()){var criteria=queue.get("criteria");if(criteria){if(criteria()){queue.fireNextFunction();}}else{queue.fireNextFunction();}}},onInstanceCreate:function(queue){this.subscriptions[queue.primaryKey()]=MBX.EventHandler.subscribe(queue,"timer_complete",this.handleTimerComplete.bind(this),{defer:true});},onInstanceDestroy:function(queue){this.renderNothing=true;var subscription=this.subscriptions[queue.primaryKey()];if(subscription){MBX.EventHandler.unsubscribe(subscription);delete this.subscriptions[queue.primaryKey()];}
queue.stop();}});