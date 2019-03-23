$js.compile("$http", Service, function($public, $private, $protected, $self) {

    $public.override.func.begin = function() {

        $self.method = "";
        $self.url = "";
        $self.content_type = "";
        $self.headers = null;
        $self.body = "";
        $self.data = null;
        $self.form = null;
        $self.on_status = {};
        $self.on_json = [];

        return $self;

    };

    $private.field.name = "";
    $public.delegate.setName = function(_name) { $self.name = _name; return $self; };

    $private.field.method = "";
    $public.delegate.setMethod = function(_method) { $self.method = _method; return $self; };

    $private.field.url = "";
    $public.delegate.setUrl = function(_url) { $self.url = _url; return $self; };

    $private.field.content_type = "";
    $public.delegate.setContentType = function(_content_type) { $self.content_type = _content_type; return $self; };

    $private.field.headers = {};
    $public.delegate.addHeader = function(_key, _value) { $self.headers[_key] = _value; return $self; };
    $public.delegate.setHeaders = function(_headers) { $self.headers = _headers; return $self; };

    $private.field.body = "";
    $public.delegate.setBody = function(_body) { $self.body = _body; return $self; }

    $private.field.data = {};
    $public.delegate.setData = function(_data) { $self.data = _data; return $self; }

    $private.field.form = {};
    $public.delegate.setForm = function(_form) { $self.form = _form; return $self; }

    $private.field.on_status = {};
    $public.delegate.onStatus = function(_code, _delegate) { $self.on_status[_code] = _delegate; return $self; };

    $private.field.on_error = {};
    $public.delegate.onError = function(_delegate) { $self.on_error = _delegate; return $self; };

    $private.field.on_json = [];
    $public.delegate.onJson = function(_when, _equals, _match) { $self.on_json.push({ when: _when, equals: _equals, match: _match }); return $self; };

    $private.field.queue = [];
    $public.delegate.setQueue = function(_queue) { $self.queue = _queue; return $self; };
    $public.delegate.addStep = function(_step) { $self.queue.push(_step); return $self; };

    $private.field.feed = {};
    $public.delegate.setFeed = function(_feed) { $self.feed = _feed; return $self; };

    $private.field.on_end = function(_body, _json) {};
    $public.delegate.onEnd = function(_delegate) { $self.on_end = _delegate; return $self; };

    /* Request */

    $private.void.get = function(_options) {

        _options.method = $self.method;
        _options.url = $self.url;

        _options.headers = {};

        for (var key in $self.headers)
            _options[key] = $self.headers[key];

    };

    $private.void.post = function(_options) {

        _options.method = $self.method;
        _options.url = $self.url;

        _options.headers = {};

        if ($self.content_type != "")
            _options.headers["Content-Type"] = $self.content_type;

        for (var key in $self.headers)
            _options.headers[key] = $self.headers[key];

        if ($self.data == null) {
          
            if ($self.form == null)
                _options.body = $self.body;
            else {
                _options.headers["Content-Type"] = "multipart/form-data";
                _options.formData = $self.form;
            }

        } else {
            _options.headers["Content-Type"] = "application/json";
            _options.body = JSON.stringify($self.data);
        }

    };

    $public.void.send = function() {

        var options = {};

        eval("$self." + $self.method.toLowerCase() + "(options);");

        $js.log("REQUEST:");
        $js.depth++;

        for (var key in options) {
            
            if (key == "headers" || key == "formData") {

                if (Object.keys(options[key]).length != 0) {

                    $js.log(key.toUpperCase() + ":");

                    for (var key2 in options[key]) {
                        $js.depth++;
                        $js.log(key2.toUpperCase() + ": " + options[key][key2]);    
                        $js.depth--;
                    }

                }

            } else {
                $js.log(key.toUpperCase() + ": " + options[key]);
            }
            
        }

        $js.depth--;
        $js.depth--;

        $request(options, function($error, $response, $body) {

            var body = $body;
            var json;
            
            if ($response.headers["content-type"].indexOf("application/json") != -1) {
                
                json = JSON.parse($body);

                $js.depth++;
                $js.log("RESPONSE:");
                $js.depth++;

                for (var key in json) {
                    $js.log(key.toUpperCase() + ": " + json[key]);
                }

                $js.depth--;

            } else
                json = {};

            $self.on_end($response.statusCode, body, json);

            for (var key in $self.on_status) {
                if (key == $response.statusCode) {
                    $self.on_status[key](body, json);
                    break;
                }
            }

        });

    };

    /* Queue */

    $private.field.index = 0;
    $private.field.item = {};
    $private.field.flow = {};

    $private.void.on_recurse_end = function() { };
    $private.void.recurse = function() {

        $self.index++;
        $self.item = $self.queue[$self.index];

        if ($self.index == $self.queue.length) {
            $self.on_recurse_end();
        } else {

            var name = $self.item.name;
            var method = $self.item.method;
            var url = $self.item.url;
            var keep = null;
            var _in = null;
            var next = null;
            var _break = null;

            if ($self.item.keep == undefined) {

            } else {
                keep = $self.item.keep;
                _in = $self.item.in;
            }

            if ($self.item.next == undefined) {

            } else {
                next = $self.item.next;
            }

            if ($self.item.break == undefined) {

            } else {
                _break = $self.item.break;
            }

            if ($self.item.querystring == undefined) {

                if ($self.item.params == undefined) {

                    if ($self.item.data == undefined) {

                    } else {
    
                        var data = {};

                        $self.evaluate([], data, $self.item.data);

                        $self.send_with_data(name, url, data, keep, _in, next, _break);
    
                    }

                } else {

                    var params = {};

                    $self.evaluate([], params, $self.item.params);

                    for (var key in params) {
                        url += "/" + params[key];
                    }

                    $self.send_with_params(name, method, url, keep, _in, next, _break);

                }

            } else {
                
                var qs = {};

                $self.evaluate([], qs, $self.item.querystring);

                url += "?";

                for (var key in qs) {
                    url += key + "=" + qs[key] + "&";
                }

                url = url.substring(0, url.length - 1);

                $self.send_with_querystring(name, method, url, keep, _in, next, _break);

            }

        }

   };
   $public.void.start = function() {

        $self.index = -1;
        $self.flow = {};
        $self.on_recurse_end = $self.on_end;
        $self.recurse();

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
                    var f = _schema[key].replace("$feed", "$self.feed").replace("$flow", "$self.flow");
                    eval("var value = " + f + ";");
                    eval("_yield." + merged + " = value;");
                }

            }
        }

   };

   $private.void.send_with_querystring = function(_name, _method, _url, _keep, _in, _next, _break) {

    if (_next == null) {
        
        $http
            .begin()
                .setName(_name)
                .setMethod(_method)
                .setUrl(_url)
                .onStatus(200, function(_body, _json) {

                    if (_keep == null) {

                    } else {

                        eval("$self.flow['" + _in + "'] = _json." + _keep + ";");

                    }

                    $self.recurse();

                })
            .send();

        } else {

            $http
                .begin()
                    .setName(_name)
                    .setMethod(_method)
                    .setUrl(_url)
                    .onJson(_next.when, _next.equals, function(_body, _json) {

                        if (_keep == null) {

                        } else {

                            eval("$self.flow['" + _in + "'] = _json." + _keep + ";");

                        }

                        $self.recurse();

                    })
                    .onJson(_break.when, _break.equals, function(_body, _json) {

                        $self.on_recurse_end();

                    })
                .send();

        }

   };
   $private.void.send_with_params = function(_name, _method, _url, _keep, _in, _next, _break) {

        $http
            .begin()
                .setName(_name)
                .setMethod(_method)
                .setUrl(_url)
                .onStatus(200, function(_body, _json) {

                    if (_keep == null) {

                    } else {

                        eval("$self.flow['" + _in + "'] = _json." + _keep + ";");

                    }

                    $self.recurse();

                })
            .send();

    };
   $private.void.send_with_data = function(_name, _url, _data, _keep, _in, _next, _break) {

        $http
            .begin()
                .setName(_name)
                .setMethod("POST")
                .setUrl(_url)
                .setData(_data)
                .onStatus(200, function(_body, _json) {

                    if (_keep == null) {

                    } else {

                        eval("$self.flow['" + _in + "'] = _json." + _keep + ";");

                    }

                    $self.recurse();

                })
            .send();

   };

});