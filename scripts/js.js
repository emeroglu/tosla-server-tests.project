$global.$js = function() {

    this.id = 0;
    this.schemas = {};

    this.clone = function(o) {
        return JSON.parse(JSON.stringify(o));
    };

    this.stringify = function(o) {
        return JSON.stringify(o, function(key, value) {

            if (key.indexOf("__") != -1)
                return;

            return value;

        }, 2);
    };

    this.depth = 0;
    this.prefix = "";
    this.log = function(text) {

        process.stdout.write("\x1b[32m");
        process.stdout.write(this.prefix + ": ");

        var s = "";

        for (var i = 0; i < this.depth; i++) {
            s += "\t";
        }

        s += text;

        if (s.indexOf("---") == -1)
            console.log(s);
        else {
            process.stdout.write("\x1b[36m");
            console.log(s);
        }

        process.stdout.write("\x1b[32m");
        console.log(this.prefix + ": ");

    };
    this.error = function(text) {

        process.stdout.write("\x1b[32m");
        process.stdout.write(this.prefix + ": ");

        var s = "";

        for (var i = 0; i < this.depth; i++) {
            s += "\t";
        }

        s += text;

        process.stdout.write("\x1b[31m");
        console.log(s);

        process.stdout.write("\x1b[32m");
        console.log(this.prefix + ": ");

    };

    this.compile = function(name, proto, delegate) {

        $js.schemas[name] = { proto: proto, delegate: delegate };

        eval("$global['" + name + "'] = function " + name + "() { this.__key__ = '" + name + "'; if (this.__schema__ == undefined) { this.__schema__ = '" + name + "'; $js.generate(this); } $js.instantiate(this); };");

    };

    this.generate = function(instance) {

        instance.__public__ = { __virtuals__: {}, __extensions__: {} };
        instance.__private__ = {};
        instance.__protected__ = { __virtuals__: {}, __extensions__: {} };
        instance.__self__ = {};

        instance.__public_schema__ = { field: {}, func: {}, void: {}, delegate: {}, virtual: { func: {}, void: {} }, override: { func: {}, void: {} }, extension: { func: {}, void: {} } };
        instance.__private_schema__ = { field: {}, func: {}, void: {} };
        instance.__protected_schema__ = { field: {}, func: {}, void: {}, delegate: {}, virtual: { func: {}, void: {} }, override: { func: {}, void: {} }, extension: { func: {}, void: {} } };

    };

    this.instantiate = function(instance) {

        var proto = $js.schemas[instance.__key__].proto;
        var delegate = $js.schemas[instance.__key__].delegate;

        if (proto != null)
            proto.call(instance);
            
        delegate(instance.__public_schema__, instance.__private_schema__, instance.__protected_schema__, instance.__self__);

        $js.build(instance);
        
        this.id++;
        instance.__self__.__id__ = this.id;
        
        for (var key in instance.__public__) {
            if (key != "__virtuals__" && key != "__extensions__")
                instance[key] = instance.__public__[key];
        }

        if ($js.schemas[instance.__schema__].proto == null) {

            delete instance.__key__;

            if (instance.on_build != null) { 
                instance.on_build(); 
            }

        }

        if (proto != null && proto.name == $js.schemas[instance.__schema__].proto.name) {
            
            delete instance.__key__;

            if (instance.on_build != null) { 
                instance.on_build(); 
            }

        }

    };

    this.build = function(instance) {

        for (var key in instance.__public_schema__.field) {
            instance.__public__[key] = instance.__public_schema__.field[key];
            instance.__self__[key] = instance.__public_schema__.field[key];
        }

        for (var key in instance.__public_schema__.func) {
            instance.__public__[key] = instance.__public_schema__.func[key];
            instance.__self__[key] = instance.__public_schema__.func[key];
        }

        for (var key in instance.__public_schema__.void) {
            instance.__public__[key] = instance.__public_schema__.void[key];
            instance.__self__[key] = instance.__public_schema__.void[key];
        }

        for (var key in instance.__public_schema__.delegate) {
            instance.__public__[key] = instance.__public_schema__.delegate[key];
            instance.__self__[key] = instance.__public_schema__.delegate[key];
        }

        for (var key in instance.__public_schema__.virtual.func) {
            instance.__public__.__virtuals__[key] = instance.__public_schema__.virtual.func[key];
            instance.__public__[key] = instance.__public_schema__.virtual.func[key];
            instance.__self__[key] = instance.__public_schema__.virtual.func[key];
        }

        for (var key in instance.__public_schema__.virtual.void) {
            instance.__public__.__virtuals__[key] = instance.__public_schema__.virtual.void[key];
            instance.__public__[key] = instance.__public_schema__.virtual.void[key];
            instance.__self__[key] = instance.__public_schema__.virtual.void[key];
        }

        for (var key in instance.__public_schema__.extension.func) {
            
            if (instance.__public__.__extensions__[key] == null) 
                instance.__public__.__extensions__[key] = [];

            instance.__public__.__extensions__[key].push(instance.__public_schema__.extension.func[key]);
            
            eval("instance.__public__['" + key + "'] = function() { instance.__public__.__virtuals__['" + key + "'](); for (var index in instance.__public__.__extensions__['" + key + "']) instance.__public__.__extensions__['" + key + "'][index](); }");
            eval("instance.__self__['" + key + "'] = function() { instance.__public__.__virtuals__['" + key + "'](); for (var index in instance.__public__.__extensions__['" + key + "']) instance.__public__.__extensions__['" + key + "'][index](); }");

        }

        for (var key in instance.__public_schema__.extension.void) {
            
            if (instance.__public__.__extensions__[key] == null) 
                instance.__public__.__extensions__[key] = [];

            instance.__public__.__extensions__[key].push(instance.__public_schema__.extension.void[key]);
            
            eval("instance.__public__['" + key + "'] = function() { instance.__public__.__virtuals__['" + key + "'](); for (var index in instance.__public__.__extensions__['" + key + "']) instance.__public__.__extensions__['" + key + "'][index](); }");
            eval("instance.__self__['" + key + "'] = function() { instance.__public__.__virtuals__['" + key + "'](); for (var index in instance.__public__.__extensions__['" + key + "']) instance.__public__.__extensions__['" + key + "'][index](); }");

        }

        for (var key in instance.__public_schema__.override.func) {
            instance.__public__[key] = instance.__public_schema__.override.func[key];
            instance.__self__[key] = instance.__public_schema__.override.func[key];
        }

        for (var key in instance.__public_schema__.override.void) {
            instance.__public__[key] = instance.__public_schema__.override.void[key];
            instance.__self__[key] = instance.__public_schema__.override.void[key];
        }


        
        for (var key in instance.__private_schema__.field) {
            instance.__private__[key] = instance.__private_schema__.field[key];
            instance.__self__[key] = instance.__private_schema__.field[key];
        }

        for (var key in instance.__private_schema__.func) {
            instance.__private__[key] = instance.__private_schema__.func[key];
            instance.__self__[key] = instance.__private_schema__.func[key];
        }

        for (var key in instance.__private_schema__.void) {
            instance.__private__[key] = instance.__private_schema__.void[key];
            instance.__self__[key] = instance.__private_schema__.void[key];
        }

        for (var key in instance.__private_schema__.delegate) {
            instance.__private__[key] = instance.__private_schema__.delegate[key];
            instance.__self__[key] = instance.__private_schema__.delegate[key];
        }



        for (var key in instance.__protected_schema__.field) {
            instance.__protected__[key] = instance.__protected_schema__.field[key];
            instance.__self__[key] = instance.__protected_schema__.field[key];
        }

        for (var key in instance.__protected_schema__.func) {
            instance.__protected__[key] = instance.__protected_schema__.func[key];
            instance.__self__[key] = instance.__protected_schema__.func[key];
        }

        for (var key in instance.__protected_schema__.void) {
            instance.__protected__[key] = instance.__protected_schema__.void[key];
            instance.__self__[key] = instance.__protected_schema__.void[key];
        }

        for (var key in instance.__protected_schema__.delegate) {
            instance.__protected__[key] = instance.__protected_schema__.delegate[key];
            instance.__self__[key] = instance.__protected_schema__.delegate[key];
        }

        for (var key in instance.__protected_schema__.virtual.func) {
            instance.__protected__.__virtuals__[key] = instance.__protected_schema__.virtual.func[key];
            instance.__protected__[key] = instance.__protected_schema__.virtual.func[key];
            instance.__self__[key] = instance.__protected_schema__.virtual.func[key];
        }

        for (var key in instance.__protected_schema__.virtual.void) {
            instance.__protected__.__virtuals__[key] = instance.__protected_schema__.virtual.void[key];
            instance.__protected__[key] = instance.__protected_schema__.virtual.void[key];
            instance.__self__[key] = instance.__protected_schema__.virtual.void[key];
        }

        for (var key in instance.__protected_schema__.extension.func) {
            
            if (instance.__protected__.__extensions__[key] == null) 
                instance.__protected__.__extensions__[key] = [];

            instance.__protected__.__extensions__[key].push(instance.__protected_schema__.extension.func[key]);
            
            eval("instance.__protected__['" + key + "'] = function() { instance.__protected__.__virtuals__['" + key + "'](); for (var index in instance.__protected__.__extensions__['" + key + "']) instance.__protected__.__extensions__['" + key + "'][index](); }");
            eval("instance.__self__['" + key + "'] = function() { instance.__protected__.__virtuals__['" + key + "'](); for (var index in instance.__protected__.__extensions__['" + key + "']) instance.__protected__.__extensions__['" + key + "'][index](); }");

        }

        for (var key in instance.__protected_schema__.extension.void) {
            
            if (instance.__protected__.__extensions__[key] == null) 
                instance.__protected__.__extensions__[key] = [];

            instance.__protected__.__extensions__[key].push(instance.__protected_schema__.extension.void[key]);
            
            eval("instance.__protected__['" + key + "'] = function() { instance.__protected__.__virtuals__['" + key + "'](); for (var index in instance.__protected__.__extensions__['" + key + "']) instance.__protected__.__extensions__['" + key + "'][index](); }");
            eval("instance.__self__['" + key + "'] = function() { instance.__protected__.__virtuals__['" + key + "'](); for (var index in instance.__protected__.__extensions__['" + key + "']) instance.__protected__.__extensions__['" + key + "'][index](); }");

        }

        for (var key in instance.__protected_schema__.override.func) {
            instance.__protected__[key] = instance.__protected_schema__.override.func[key];
            instance.__self__[key] = instance.__protected_schema__.override.func[key];
        }

        for (var key in instance.__protected_schema__.override.void) {
            instance.__protected__[key] = instance.__protected_schema__.override.void[key];
            instance.__self__[key] = instance.__protected_schema__.override.void[key];
        }

    };

}