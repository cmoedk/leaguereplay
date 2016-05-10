console.time("Init");
var settings = require('./settings.js');
var ReplayEngine = require('./core/ReplayEngine.js');

$(document).on('ready', function() {
    var replay = new ReplayEngine(settings.DEFAULT_COMP_ID);
    console.timeEnd("Init");
});

