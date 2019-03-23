$js.compile("$app", Service, function($public, $private, $protected, $self) {

    $private.field.agents = {};
    $private.field.providers = {};
    $private.field.scenarios = {};
    $private.field.queue = [];

    $private.field.paths = [];
    $public.delegate.addAgent = function(_path) { $self.paths.push({ type: "agent", "path": _path }); return $self; };
    $public.delegate.addProvider = function(_path) { $self.paths.push({ type: "provider", "path": _path }); return $self; };
    $public.delegate.addScenario = function(_path) { $self.paths.push({ type: "scenario", "path": _path }); return $self; };

    $private.void.on_load = function() {};
    $public.delegate.onLoad = function(_on_load) { $self.on_load = _on_load; return $self; };

    $private.field.index_load = 0;
    $private.field.on_load_end = function() { };
    $private.void.recursive_load = function() {

        $self.index_load++;

        $fs.readFile($self.paths[$self.index_load].path, function(_error, _data) {

            var type = $self.paths[$self.index_load].type;
            var json = JSON.parse(_data.toString());

            var parts = $self.paths[$self.index_load].path.split("/");
            var key = parts[parts.length - 1].replace(".json", "");

            if (type == "agent")
                $self.agents[key] = $self.evaluate_agent(json);
            else if (type == "provider")
                $self.providers[key] = $self.evaluate_provider(json);
            else if (type == "scenario")
                $self.scenarios[key] = json;

            if ($self.index_load == $self.paths.length - 1)
                $self.on_load_end();
            else 
                $self.recursive_load();

        });

    };
    $public.void.load = function() {

        $self.index_load = -1;

        $self.on_load_end = function() {

            $self.init_queue();

            $self.on_load();

        };
        $self.recursive_load();

    };
    $private.func.evaluate_provider = function(_json) {

        for (var index in _json.steps) {
            _json.steps[index].url = $path.environment + eval(_json.steps[index].url);
        }

        return _json;

    };
    $private.func.evaluate_agent = function(_json) {

        for (var index in _json.steps) {
            _json.steps[index].url = $path.environment + eval(_json.steps[index].url);
        }

        return _json;

    };

    $private.field.index_setup = 0;
    $private.field.on_setup_end = function() { };
    $private.void.recursive_setup = function() {

        $self.index_setup++;

        var scenario = $self.queue[$self.index_proceed]; 
        var provider = scenario.providers[$self.index_setup];

        $js.log("--- REQUIREMENT (" + provider.get_key() + ") ---");
        $js.depth++;

        provider
            .begin()
                .setScenario(scenario)
                .onFinish(function() {

                    $js.depth--;
                    $js.log("--- REQUIREMENT END ---");

                    if ($self.index_setup == scenario.providers.length - 1)
                        $self.on_setup_end();
                    else
                        $self.recursive_setup();

                })
                .onFail(function() {

                    $js.depth--;
                    $js.error("--- REQUIREMENT CRASHED ---");

                })
            .provide();

    };
    $private.void.setup = function() {

        $self.index_setup = -1;

        $self.on_setup_end = function() {

            var scenario = $self.queue[$self.index_proceed]; 
            var initial = scenario.initial;

            $self.execute(initial);

        };
        $self.recursive_setup();

    };

    $private.field.index_proceed = 0;
    $private.field.on_process_end = function() { };
    $private.void.proceed = function() {

        $self.index_proceed++;

        if ($self.index_proceed == $self.queue.length) {
            $self.on_process_end();
        } else {

            var scenario = $self.queue[$self.index_proceed]; 

            $js.prefix = "Scenario " + scenario.key;

            $js.log("--- SCENARIO ---");
            $js.depth++;
            $js.log(scenario.description);

            $self.setup();

        }

    };
    $public.void.start = function() {

        $self.index_proceed = -1;

        $self.on_process_end = function() {
            
        };
        $self.proceed();

    };

    $private.void.execute = function(_step) {

        if (_step == "exit") {

            // Scenario Ended

            $js.depth--;
            $js.log("--- SCENARIO END ---");

            $self.proceed();

        } else if (_step == "break") {

            // Scenario Failed

            $js.error("--- SCENARIO CRASHED ---");

            $self.proceed();

        } else {

            var scenario = $self.queue[$self.index_proceed]; 

            var step;
            for (var index in scenario.steps) {
                if (scenario.steps[index].key == _step) {
                    step = scenario.steps[index];
                    break;
                }
            }

            $js.log("--- STEP (" + _step + ") ---");
            $js.depth++;

            step.agent
                .begin()
                    .setScenario(scenario)
                    .onFinish(function(_exit) {
                        
                        var next = step.agent.get_manifold()[_exit];

                        $js.depth--;
                        $js.log("--- STEP END ---");

                        $self.execute(next);

                    })
                    .onFail(function() {

                        $js.depth--;
                        $js.error("--- AGENT CRASHED ---");
    
                    })
                .perform();

        }

    };

    $private.void.init_queue = function() {

        var item, item_requ, item_step;
        var scenario, provider, step;

        for (var key in $self.scenarios) {

            item = $self.scenarios[key];

            scenario = new Scenario();
            scenario.index = item.index;
            scenario.key = key.replace("_",".").replace("_",".").replace("_",".").replace("_",".");
            scenario.description = item.description;
            scenario.initial = item.initial;
            
            for (var index in item.requirements) {

                item_requ = item.requirements[index];

                var schema = $self.providers[item_requ.type + "_provider"];

                provider = new Provider();
                provider.set_key(item_requ.key);
                provider.set_name(schema.name);
                provider.set_feed(item_requ.feed);
                provider.set_steps(schema.steps);
                provider.set_initial(schema.initial);

                scenario.providers.push(provider);

            }

            for (var index in item.steps) {

                item_step = item.steps[index];

                var schema = $self.agents[item_step.agent];

                step = new Step();
                step.key = item_step.key;
                step.agent = new Agent();
                step.agent.set_name(schema.name);
                step.agent.set_feed(item_step.feed);
                step.agent.set_manifold(item_step.on);
                step.agent.set_steps(schema.steps);
                step.agent.set_initial(schema.initial);

                scenario.steps.push(step);

            }

            $self.queue.push(scenario);

        }

        $self.queue.sort(function(a, b) {

            if (a.index < b.index) return -1;
            if (b.index < a.index) return 1;

        });

        $self.queue.forEach(function($item) { delete $item.index; })

    };

});