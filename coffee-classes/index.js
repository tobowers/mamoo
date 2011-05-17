require("coffee-script");

var Mamoo = exports = module.exports = {
    Model: require("./model"),
    Controller: require("./controller"),
    View: require("./view"),
    setUpWith: function (globalVariable) {
        globalVariable = Mamoo;
    }
};






