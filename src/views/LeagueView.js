module.exports = LeagueView;

var config = require('../config.js');
var TableView = require('./TableView.js');

function LeagueView(options) {
    TableView.call(this, options);

    this.parent = config.id.structure;

    this.addHeader({
        'tr' : [
            {'th' : "Club"},
            {'th' : "GP"},
            {'th' : "W"},
            {'th' : "D"},
            {'th' : "L"},
            {'th' : "GF"},
            {'th' : "GA"},
            {'th' : "GD"},
            {'th' : "PTS"}
        ]
    });
}

LeagueView.prototype = Object.create(TableView.prototype);
