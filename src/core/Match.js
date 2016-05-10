module.exports = Match;

var config = require('../config.js');
var util = require('../util.js');

/**
 * A match holds a single fixture between two teams
 * @param {object} matchData - Raw data from the json database
 * @constructor
 */
function Match(matchData) {
    /**
     * Match data from the json database
     * @type {Object}
     */
    this.data = matchData;

    //Sort the matchevents by time
    this.data.matchevents.sort(function(a,b) {
        if (a.happenedAt < b.happenedAt) {
            return -1;
        }
        if (a.happenedAt > b.happenedAt) {
            return 1;
        }
        // a must be equal to b
        return 0;
    });
}

/**
 * Get all goals from the match in chronological order
 * @returns {Array.<object>} - An array of all match events with goals
 * //TODO generalize for any available stat
 */
Match.prototype.getGoals = function() {
    var goals = [];

    for(var i = 0; i < this.data.matchevents.length; i++) {
        if(this.data.matchevents[i].type === "goal") {
            goals.push(this.data.matchevents[i]);
        }
    }

    return goals;
};
