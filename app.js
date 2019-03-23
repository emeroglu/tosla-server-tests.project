function init() {

    globalize();
    
    load_init_js();

    load_core();

    load_libs();

    load_services();
    init_services();

    load_init_path(function() {

        load_schemas();

        start();

    });

}

function globalize() {

    global.$global = global;

    $global.$load = require;

}

function load_init_js() {
    
    $load('./scripts/js.js');
    
    $global.$js = new $js();

}

function load_core() {

    $load("./scripts/abstract/core/Agent.js");
    $load("./scripts/abstract/core/Provider.js");
    $load("./scripts/abstract/core/Service.js");

}

function load_libs() {

    $global.$fs = $load("fs");
    $global.$readline = $load("readline");
    $global.$request = $load("request");

}

function load_services() {

    $load('./scripts/services/app.js');
    $load('./scripts/services/data.js');
    $load('./scripts/services/http.js');
    $load('./scripts/services/path.js');

}

function init_services() {

    $global.$app = new $app();
    $global.$data = new $data();
    $global.$http = new $http();
    $global.$path = new $path();

}

function load_init_path(on_load) {

    $fs.readFile("data/path.json", function(_error, _data) {

        $path = JSON.parse(_data);

        on_load();

    });

}

function load_schemas() {

    $load("./scripts/abstract/schemas/Requirement.js");
    $load("./scripts/abstract/schemas/Scenario.js");
    $load("./scripts/abstract/schemas/Step.js");

}

function start() {

    process.stdout.write("\033c\033[3J");

    $app
        .begin()
            .addProvider("data/providers/user_provider.json")
            .addAgent("data/agents/balance_setter.json")
            .addAgent("data/agents/money_requester.json")
            .addScenario("data/scenarios/1_a_B_1.json")
            .onLoad(function() {
                
                $app.start();

            })
        .load();

}

init();