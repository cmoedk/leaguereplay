module.exports = Competition;

require('../mixins/jQuery.EventEmitter.js');

var Round = require('./Round.js');
var config = require('../config.js');

/**
 * A competition holds one or more rounds for a season
 * @param {number} compId - Id of the competition to load
 * @constructor
 */
function Competition(compId) {
    var _this = this;
    /**
     * Contains all rounds of the competition in chronological order
     * @type {Array.<Round>}
     */
    this.rounds = [];
    /**
     * Index of the round currently being processed
     * @type {number}
     */
    this.currentRound = 0;
    /**
     * Relative link to the json database for this competition
     * @type {string}
     */
    this.databaseUrl = './matches.json'; //TODO load from database with compId
    /**
     * Contains all loaded data parsed from the json database file
     * @type {object}
     */
    this.data = {};

    //Load the json database
    $.ajax({
        type: 'GET',
        url:  this.databaseUrl,
        dataType: "text",
        async: true,
        error: function(jqXHR, textStatus, errorThrown) {
            //TODO create some error reporting for the user to see
            console.log("Issue: "
                + textStatus + " "
                + errorThrown + " !");
        },
        success: function(data) {
            _this.data = $.parseJSON(data);

            //Create new rounds from the data
            for(var i=0; i < _this.data.length; i++) {
                _this.rounds.push(new Round(_this.data[i]));
            }
            _this.emit('ready');
        }
    });
}

jQuery.extend(Competition.prototype, jQuery.eventEmitter);

/**
 * Renders the competition HTML to the DOM
 */
Competition.prototype.render = function() {
    for(var i = 0; i<this.rounds.length; i++) {
        this.rounds[i].render();
    }
};

/**
 * Fetch the next match in the round. If no more matches exist, initiate the next round, or return false
 * //TODO more elegant way to end competition simulation
 * @returns {Match | boolean} - The next match or false
 */
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

/**
 * Updates all tables with a new event
 * @param {Match | object} event - Either a match or a match event
 * @param {boolean} followMatch - If the user wants to see the update animated
 * //TODO keep a local score for the competition as a whole, if more than one round is present
 */
Competition.prototype.update = function(event, followMatch) {
    this.rounds[this.currentRound].update(event, followMatch);
};

/**
 * Adds a scorer to the topscorer list
 * @param {object} player - Player object
 * //TODO a more generalized function for adding custom stats
 */
Competition.prototype.addScorer = function(player) {
    this.rounds[this.currentRound].addScorer(player);
};


