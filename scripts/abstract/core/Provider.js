$js.compile("Provider", null, function($public, $private, $protected, $self) {

    $private.field.key = {};
    $public.void.set_key = function(_key) { $self.key = _key; };
    $public.void.get_key = function(_key) { return $self.key; };

    $private.field.name = {};
    $public.void.set_name = function(_name) { $self.name = _name; };
    
    $private.field.feed = {};
    $public.void.set_feed = function(_feed) { $self.feed = _feed; };

    $private.field.steps = {};
    $public.void.set_steps = function(_steps) { $self.steps = _steps; };

    $private.field.initial = {};
    $public.void.set_initial = function(_initial) { $self.initial = _initial; };

    $public.delegate.begin = function() { return $self };

    $protected.field.scenario = null;
    $public.delegate.setScenario = function(_scenario) { $self.scenario = _scenario; return $self; };

    $protected.void.on_finish  = function() { };
    $public.delegate.onFinish = function(_delegate) { $self.on_finish = _delegate; return $self; };

    $protected.void.on_fail  = function() { };
    $public.delegate.onFail = function(_delegate) { $self.on_fail = _delegate; return $self; };
    
    $public.void.provide = function() { 

        $js.log("--- PROVIDER (" + $self.name + ") ---");
        $js.depth++;

        $self.index = -1;
        $self.flow = {};
        $self.next($self.initial);

    };

    $private.field.index = 0;
    $private.field.step = {};
    $private.field.flow = {};
    $private.void.next = function(_step) {

        if (_step == "exit") {

            $js.depth--;
            $js.log("--- PROVIDER END ---");

            $self.on_finish();

        } else if (_step == "break") {

            $js.depth--;
            $js.error("--- PROVIDER CRASHED ---");

            $self.on_fail();

        } else {

            for (var index in $self.steps) {
                if ($self.steps[index].key == _step) {
                    $self.step = $self.steps[index];
                    break;
                }
            }
             
            $js.log("--- STEP (" + $self.step.key + ") ---");
            $js.depth++;

            $self.print();

            eval("$self." + $self.step.type + "();");

        }

    };

    //////////

    $private.void.pass = function() {

        $js.log("Passing to " + $self.step.next);

        $js.depth--;
        $js.log("--- STEP END ---");

        $self.next($self.step.next);

    };

    $private.void.manifold = function() {

        for (var index in $self.step.next) {
        
            var js = $self.step.next[index].when.replace("$flow", "$self.flow").replace("$feed", "$self.feed");
            eval("var value = " + js + ";");
            
            if (value == $self.step.next[index].equals) {
                
                $js.log("Redirecting to " + $self.step.next[index].step + " because " + $self.step.next[index].when + " equals " + value);

                $js.depth--;
                $js.log("--- STEP END ---");

                $self.print_next($self.step.next[index]);

                $self.next($self.step.next[index].step);
                
                break;

            }

        }

    };

    $private.void.save = function() {

        var pack = {};                    
        $self.evaluate([], pack, $self.step.package);

        $self.scenario.flow[$self.key] = pack;

        $js.log("User saved as '" + $self.key + "' in scenario's flow...");

        $js.depth--;
        $js.log("--- STEP END ---");

        $self.next("exit");

    };

    $private.void.http = function() {

        var name = $self.step.name;
        var method = $self.step.method;
        var url = $self.step.url;

        url = $self.evaluate_querystring(url);
        url = $self.evaluate_params(url);

        var http = $http
            .begin()
                .setName(name)
                .setMethod(method)
                .setUrl(url)
                .onEnd(function(_status, _body, _json) {

                    $self.keep(_json);

                    for (var index in $self.step.next) {

                        if ($self.step.next[index].when == "$res.status") {
                            
                            if ($self.step.next[index].equals == _status) {

                                $self.print_next($self.step.next[index]);

                                $js.depth--;
                                $js.log("--- STEP END ---");

                                $self.next($self.step.next[index].step);

                                break;

                            }

                            if ($self.step.next[index].not_equals != undefined) {
                                if ($self.step.next[index].not_equals != _status) {

                                    $self.print_next($self.step.next[index]);

                                    $js.depth--;
                                    $js.log("--- STEP END ---");

                                    $self.next($self.step.next[index].step);

                                    break;

                                }
                            }

                        } else {

                            var js = $self.step.next[index].when.replace("$json", "_json").replace("$flow", "$self.flow").replace("$feed", "$self.feed");
                            eval("var value = " + js + ";");
                            
                            if (value == $self.step.next[index].equals) {
                                
                                $self.print_next($self.step.next[index]);

                                $js.depth--;
                                $js.log("--- STEP END ---");

                                $self.next($self.step.next[index].step);

                                break;

                            }

                            if ($self.step.next[index].not_equals != undefined) {
                                if (value != $self.step.next[index].not_equals) {

                                    $self.print_next($self.step.next[index]);

                                    $js.depth--;
                                    $js.log("--- STEP END ---");

                                    $self.next($self.step.next[index].step);

                                    break;

                                }
                            }

                        }

                    }

                });

        if ($self.step.headers != undefined) {
            var headers = {};
            $self.evaluate([], headers, $self.step.headers);
            http.setHeaders(headers);
        }

        if ($self.step.data != undefined) {
            var data = {};
            $self.evaluate([], data, $self.step.data);
            http.setData(data);
        }

        if ($self.step.form != undefined) {
            var form = {};
            $self.evaluate([], form, $self.step.form);
            http.setForm(form);
        }

        http.send();

   };

   //////////

   $private.void.print = function() {

        if ($self.step.print != undefined) {

            if ($self.step.print.indexOf("$") == -1)
                $js.log($self.step.print);
            else
                eval("$js.log(" + $self.step.print.replace("$flow", "$self.flow").replace("$feed", "$self.feed") + ");");

        }

   };
   
   $private.void.print_next = function(_next) {

        if (_next.print != undefined) {

            if (_next.print.indexOf("$") == -1)
                $js.log(_next.print);
            else
                eval("$js.log(" + _next.print.replace("$flow", "$self.flow").replace("$feed", "$self.feed") + ");");

        }

    };

    $private.void.evaluate = function(_prefix, _yield, _schema) {

        for (var key in _schema) {

            if (typeof _schema[key] == "object") {
                _prefix.push(key);
                $self.evaluate(_prefix, _yield, _schema[key]);
                _prefix = [];
            } else {

                var merged = "";

                for (var index in _prefix) {

                    merged += _prefix[index];

                    eval("var check = _yield." + merged + ";");

                    if (check == undefined)
                        eval("_yield." + merged + " = {};");

                    merged += ".";

                }

                merged += key;

                if (_schema[key].toString().indexOf("$") == -1) {
                    eval("_yield." + merged + " = _schema[key];");
                } else {
                    var js = _schema[key].replace("$feed", "$self.feed").replace("$flow", "$self.flow");
                    eval("var value = " + js + ";");
                    eval("_yield." + merged + " = value;");
                }

            }
        }

   };

    $private.void.evaluate_querystring = function(_url) {

        if ($self.step.querystring != undefined) {

            var qs = {};
            $self.evaluate([], qs, $self.step.querystring);

            _url += "?";

            for (var key in qs) {
                _url += key + "=" + qs[key] + "&";
            }

            _url = _url.substring(0, _url.length - 1);

        }

        return _url;

    };

    $private.void.evaluate_params = function(_url) {

        if ($self.step.params != undefined) {

            var params = {};
            $self.evaluate([], params, $self.step.params);

            for (var key in params) {
                _url += "/" + params[key];
            }

        }

        return _url;

    };

    $private.void.keep = function(_json) {

        if ($self.step.keep != undefined) {

            for (var index in $self.step.keep) {
                eval("$self.flow." + $self.step.keep[index].in + " = " + $self.step.keep[index].this.replace("$json", "_json") + ";");
            }

        }

    };

});