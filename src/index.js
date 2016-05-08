var config = require('./config.js');

var ReplayEngine = require('./core/ReplayEngine.js');

var LeagueView = require('./views/LeagueView.js');
var FixtureView = require('./views/FixtureView.js');
var VideoView = require('./views/VideoView.js');
var TableView = require('./views/TableView.js');




$(document).on('ready', function() {
    new LeagueView({
        title: "Premier League 2015/2016",
        id: "leagueTable"
    });

    new FixtureView({
        title: "Fixtures"
    });

    var topscorers = new TableView({
        id: "topScorers",
        title: "Top Scorers",
        parent: config.id.stats
    });

    topscorers.addHeader({
        'tr' : [
            {'th' : "Name"},
            {'th' : "Goals"}
        ]
    });

    topscorers.render();

    var replay = new ReplayEngine('./matches.json');


});


/**
 * <div id="topscorers">
 <h1>Top Goal Scorers</h1>
 <table id="topscorertable" class="tablesorter">
 <thead>
 <tr>
 <th>Name</th>
 <th>Goals</th>
 </tr>
 </thead>
 <tbody></tbody>
 </table>
 </div>
 **/