module.exports = Competition;

require('../mixins/jQuery.EventEmitter.js');

var Round = require('./Round.js');
var config = require('../config.js');

function Competition(compId) {
    var _this = this;
    this.rounds = [];
    this.currentRound = 0;

    this.databaseUrl = './matches.json'; //TODO load from database with compId
    this.data = {};

    $.ajax({
        type: 'GET',
        url:  this.databaseUrl,
        dataType: "text",
        async: true,
        error: function(jqXHR, textStatus, errorThrown) {
            console.log("Issue: "
                + textStatus + " "
                + errorThrown + " !");
        },
        success: function(data) {
            _this.data = $.parseJSON(data);

            for(var i=0; i < _this.data.length; i++) {
                _this.rounds.push(new Round(_this.data[i]));
            }
            _this.emit('ready');
        }
    });
}

Competition.prototype.render = function() {
    for(var i = 0; i<this.rounds.length; i++) {
        this.rounds[i].render();
    }
};

Competition.prototype.nextMatch = function() {
    var nextMatch = this.rounds[this.currentRound].nextMatch();

    if(nextMatch) {
        return nextMatch;
    } else {
        this.currentRound++;
        if(!this.rounds[this.currentRound]) {
            return false;
        } else {
            return this.rounds[this.currentRound].nextMatch();
        }
    }
};


Competition.prototype.update = function(event, followMatch) {
    this.rounds[this.currentRound].update(event, followMatch);
};

Competition.prototype.addScorer = function(player) {
    this.rounds[this.currentRound].addScorer(player);
};

Competition.prototype.getFixtures = function() {
    return   this.rounds[this.currentRound].matches;
};

jQuery.extend(Competition.prototype, jQuery.eventEmitter);