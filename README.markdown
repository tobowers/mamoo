#Mamoo
The Motionbox Advanced Model Observer Observer

A light-weight MVC framework for separating concerns (Data model, views, related actions).  It's built on top of [Prototype](http://prototypejs.org) and the [Motionbox EventHandler](http://github.com/tobowers/motionbox-eventhandler). Minimized it's about 13k.

#introduction

Mamoo is designed for relatively serious javascript applications. However, it's light-weight enough and the syntax simple enough to help out with simpler projects too.

At its simplest, you have your models handle holding and manipulating data, your controllers act on changes in data, and your view display the data.

Here's a "hello world" example:

    var MyModel = MBX.JsModel.create("MyModel");
    var myController = MBX.JsController.create("myController", {
        model: MyModel, // here we're saying: "please listen to MyModel"
        
        // gets fired when an instance is created
        onInstanceCreate: function (instance) {
            alert("instance created");
        },
        
        // when you change an attribute on an instance, using the
        // following syntax:
        // instance.set("key", "value");
        // instance.get("key"); - returns 'value';
        onInstanceChange: function (instance, key) {
            alert("instance changed its attribute: " + key);
        },
        
        //called when an instance is destroyed
        onInstanceDestroy: function (instance) {
            alert("instance destroyed");
        }
    });
    var instance = MyModel.create(); // would alert "instance created"
    instance.set("attr", "value"); // would alert "instance changed its attribute attr"
    instance.destroy(); // would alert("instance destroyed");


#Model
It all starts with the Model.  Just like in Rails, the model should really only deal with data and methods surrounding data.  It shouldn't interact with the UI or (and this is up for debate) the server.  Things like pagination, etc should be handled in the controller.

The simplest possible model looks like this:
    MBX.MyModel = MBX.JsModel.create("MyModel");

That'll give you a model with the standard model functions.  

* MBX.MyModel.create()
* MBX.MyModel.find()
* MBX.MyModel.findAll()
* MBX.MyModel.count()

Calling create will create an instance which will have its own methods.
    
    var myObj = MBX.MyModel.create();
    myObj.primaryKey(); // this will be automatically assigned (or can be chosen explicitly - more of that in advanced)
    myObj.parentClass; // == MBX.MyModel
    
    // below is important
    // NEVER call myObj.blah for an attribute
    myObj.set('foo', 'bar');
    myObj.get('foo'); // == 'bar'


set() and get() are important.  They allow us to fire events on 
changes to attributes.

#Controller

This kinda where the magic happens. Controllers handle the events from models and model instances. You can hook into various model events.  If you can specify a model then you can also specify:

* onInstanceChange
* onInstanceCreate
* onInstanceDestroy

example:

    MBX.MyController = MBX.JsController.create("MyController", {
        // listen to MyModel
        model: MyModel,
        
        // looselyCoupled is a special option (that defaults to false)
        // if you specify true, then events will propogate to this
        // controller using setTimout.  That will be a performance enhancement, but (obviously) your process shouldn't be real-time dependent
        looselyCoupled: false,
        
        // gets fired when an instance is created
        onInstanceCreate: function (instance) {
            alert("instance created");
        },
        
        // when you change an attribute on an instance, using the
        // following syntax:
        // instance.set("key", "value");
        // instance.get("key"); - returns 'value';
        onInstanceChange: function (instance, key) {
            alert("instance changed its attribute: " + key);
        },
        
        //called when an instance is destroyed
        onInstanceDestroy: function (instance) {
            alert("instance destroyed");
        },
        
        // this gets fired when a model-level attribute changes
        // eg: MyModel.set("key", "value"); - notice how that is *not* an instance
        onAttributeChange: function (key) {
            alert("a model-level attribute changed");
        }
        
    });

#View

This is (by convention) where you handle dom-manipulation based on model or instance changes. The syntax is the same as controllers and views add some convenience methods.  See the docs for details.

    MBX.JsView.create({
        // works the same as controllers
        model: MyModel;
    });


# A simple setup

## video.html
    <div id= 'video_list'></div>

## video.js
    Video = MBX.JsModel.create("Video", {
      instanceMethods: {
        defaults: {
          words: "defaultWords"
        }
      }
    });

## video_view.js
    MBX.JsView.create({
        model: Video,
        onInstanceCreate: function (video) {
            var el = new Element("div", {id: "video_" + video.primaryKey()});
            video.set("uiElement", el);
            
            // Mamoo adds updatesOn to all elements, 
            // allows you seamlessly update tons of ui
            // without explicitly going through everything
            el.updatesOn(video, "words");
            
            $("video_list").insert(el);
        }
    });

## video_controller.js
    VideoController = MBX.JsController("VideoController", {
      model: Video,
      onInstanceChange: (video, key) {
          if (key == "words" && video.get(key) == "boom") {
              video.set("words", "boom shackalacka");
          }
      }
      
    });

## Let's see how this interacts:
If you were to now call:

    var videoInstance = Video.create();

Your video.html would look like this:

    <div id='video_list'>
      <div id="video_0">
          defaultWords
      </div>
    </div>

Then if you were to call:
    
    videoInstance.set('words', 'other words');

Your video.html would now look like:

    <div id='video_list'>
      <div id="video_0">
          other words
      </div>
    </div>
    
If you then did:
   
    videoInstance.set("words", "boom");
   
Your video.html would look like:

    <div id='video_list'>
      <div id="video_0">
          boom shackalacka
      </div>
    </div>


Then if you were to call:
    
    videoInstance.destroy();


Your video.html would now look like:
    
    <div id= 'video_list'></div>
    

