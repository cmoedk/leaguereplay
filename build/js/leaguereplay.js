(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = {
    "id": {
        fixtures: "fixtures",
        container: "container",
        structure: "structure",
        centerDiv: "centerdiv",
        stats: "stats"
    },
    "class" : {

    },
    "type" : {
        league: "league"
    }
};
},{}],2:[function(require,module,exports){
module.exports = ReplayEngine;



function ReplayEngine(databaseUrl) {
    var _this = this;
    this.databaseUrl = databaseUrl;
    this.matchCounter = -1;

    this.goalscorers = {};

    this.eventCounter = -1;
    this.events = [];

    this.match = {};
    this.$match = {};
    this.lastHighlight = '';

    this.videoIsPlaying = false;
    this.paused = false;

    this.resumeEvent = null;

    /**
     * Sorts league table by pts, goal difference, goals for and name
     * Used by tablesorter plugin
     * @type {Array}
     */
    this.sortOrder = [[8,1],[7,1], [5,1],[0,0]];

    //jQuery elements
    this.fixtures = $('#fixtures');
    this.fixtureTable = this.fixtures.find('table');
    this.structure = $('#structure');
    this.leagueTable = this.structure.find('table');
    this.leagueTableBody = this.structure.find('tbody');
    this.section = this.structure.find('section');
    this.topscorers = $('#topscorers');
    this.topscorersBody = this.topscorers.find('table').find('tbody');
    this.topscorerTable = $('#topscorertable');



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
            _this.init();
        }
    });

}

/**
 * Draws up tables from the data.
 * Sets up interactive components.
 */
ReplayEngine.prototype.init = function() {
    var _this = this;
    var matchRequest = window.location.hash.substr(1);

    //Draw all fixtures and the league table from the given data
    for (var i = 0, len = this.data.length; i < len; i++) {
        var match = this.data[i];
        drawFixture(match);
        addTeamsToLeagueTable(match);
    }

    //If the user request a specific match, simulate the table up to that match
    if(matchRequest !== '') {
        var matchId = parseInt(matchRequest);

        for (i = 0, len = this.data.length; i < len; i++) {
            match = this.data[i];

            if(match.dbid !== matchId) {
                this.match = match;
                this.updateTable(match, true);
                this.matchCounter++;
            } else {
                break;
            }
        }
    }

    //Sort the table before starting
    this.sortLeagueTable();

    //Set the start buttons interactions
    $('#start').one('click', function() {
        _this.start();
        $(this).html('Pause');
        $(this).addClass('playing');

        //Toggle pause/resume on further clicks
        $(this).on('click', function() {
            if($(this).html() === 'Pause') {
                if(_this.pause()) {
                    $(this).html('Resume');
                    $(this).removeClass('playing');
                }

            } else {
                if(_this.resume()) {
                    $(this).html('Pause');
                    $(this).addClass('playing');
                }

            }
        });
    });

    /**
     * Draws a date header, if applicable
     * Draws a single fixture to the #fixtures table
     * @param match
     */
    function drawFixture(match) {
        var date = _this.formatDate(match.start);
        var fixture = $('<tr id="' + match.dbid + '" title="' + match.dbid + '"></tr>');

        if(_this.fixtureTable.find('#' + date.id).length === 0) {
            _this.fixtureTable.append('<tr><td id="' + date.id + '" class="date" colspan = 3>' + date.text + '</td></tr>')
        }

        fixture.append(
            '<td class="hometeam">' + match.homeTeam.name + '<p class="homescorers"></p></td>',
            '<td><span class="homegoals">&nbsp;</span> - <span class="awaygoals">&nbsp;</span></td>',
            '<td class="awayteam">' + match.awayTeam.name + '<p class="awayscorers"></p></td>'
        );



        _this.fixtureTable.append(fixture);
    }

    /**
     * Draws a single club entry in the league table
     * @param match
     */
    function addTeamsToLeagueTable(match) {
        var homeTeamId = match.homeTeam.dbid;
        var awayTeamId = match.awayTeam.dbid;

        if(_this.leagueTableBody.find('#' + homeTeamId).length === 0) {
            _this.leagueTableBody.append('<tr id="' + homeTeamId + '"><td>' + match.homeTeam.name + '</td><td class="gp">0</td><td class="w">0</td><td class="d">0</td>' +
                '<td class="l">0</td><td class="gf">0</td><td class="ga">0</td><td class="gd">0</td><td class="pts">0</td></tr>');
        }

        if(_this.leagueTableBody.find('#' + awayTeamId).length === 0) {
            _this.leagueTableBody.append('<tr id="' + awayTeamId + '"><td>' + match.awayTeam.name + '</td><td class="gp">0</td><td class="w">0</td><td class="d">0</td>' +
                '<td class="l">0</td><td class="gf">0</td><td class="ga">0</td><td class="gd">0</td><td class="pts">0</td></tr>');
        }
    }
};

/**
 * Sorts the league table by pts, goal difference, goals for and name
 */
ReplayEngine.prototype.sortLeagueTable = function() {
    var _this = this;

    //When updating the table dynamically, this method works best in sorting correctly
    this.leagueTable.remove().appendTo(this.section).tablesorter( {
        sortList: _this.sortOrder
    } );
};

/**
 * Sorts the topscorer table by goals and name
 */
ReplayEngine.prototype.sortTopScorers = function() {
    this.topscorerTable.remove().appendTo(this.topscorers).tablesorter( {
        sortList: [[1,1],[0,0]]
    } );
};

/**
 * Formats a date from unix timestamp
 * @param timestamp - Unix timestamp in milliseconds
 */
ReplayEngine.prototype.formatDate = function(timestamp) {
    var monthNames = [
        "January", "February", "March",
        "April", "May", "June", "July",
        "August", "September", "October",
        "November", "December"
    ];

    var date = new Date(timestamp);

    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();

    var text = day + ' ' + monthNames[monthIndex] + ' ' + year;
    var id = day + monthNames[monthIndex] + year;

    return {
        'text' : text,
        'id' : id
    }
};

/**
 * Starts the league simulation and video player
 */
ReplayEngine.prototype.start = function() {
    //Push match events to event queue, and start event processing
    this.processMatch(this.data[++this.matchCounter]);
    this.nextEvent();
};

/**
 * Pauses the video player and thereby the event queue
 * @returns {boolean} - Whether the video player paused succesfully
 */
ReplayEngine.prototype.pause = function() {
    //Only pause if the video is playing
    if(this.videoIsPlaying) {
        $('video')[0].pause();
        return true;
    } else {
        return false;
    }
};

/**
 * Resumes the video player and thereby the event queue
 * @returns {boolean} - Whether the video can be resumed
 */
ReplayEngine.prototype.resume = function() {
    //Only resume if there is a video
    if(this.videoIsPlaying) {
        $('video')[0].play();
        return true;
    } else {
        return false;
    }
};

/**
 * Adds an event to the event queue
 * @param event
 */
ReplayEngine.prototype.addEvent = function(event) {
    this.events.push(event);
};

/**
 * EVENT
 * Highlights the currently playing match and their teams in the table
 */
ReplayEngine.prototype.highlightMatch = function() {
    var $hometeam = $('#' + this.match.homeTeam.dbid);
    var $awayteam = $('#' + this.match.awayTeam.dbid);

    this.$match.addClass('highlight');
    $hometeam.addClass('highlight');
    $awayteam.addClass('highlight');

    //Scroll to the next date, if the date changes
    var date = this.formatDate(this.match.start);
    var $dateHeader = $('#' + date.id);

    var offset_t = $dateHeader.position().top + this.fixtures.scrollTop() - $('#header').height();

    this.fixtures.animate({
        scrollTop: offset_t
    }, 2000);

    this.nextEvent();
};

/**
 * * EVENT
 * Cleans up highlighting and handles 0-0 draws
 */
ReplayEngine.prototype.endMatch = function() {
    var $hometeam = $('#' + this.match.homeTeam.dbid);
    var $awayteam = $('#' + this.match.awayTeam.dbid);

    this.$match.removeClass('highlight');
    $hometeam.removeClass('highlight');
    $awayteam.removeClass('highlight');

    //0-0 draws are not processed by the goal event. Take care of them here.
    if(this.match.awayGoals + this.match.homeGoals === 0) {
        this.updateTable(this.match);
    }

    this.nextEvent();
};

/**
 * EVENT
 * Inits a match score by setting it to 0-0
 */
ReplayEngine.prototype.initScore = function() {
    var $homegoals = this.$match.find('.homegoals');
    var $awaygoals = this.$match.find('.awaygoals');

    $homegoals.html(0);
    $awaygoals.html(0);

    this.nextEvent();
};

/**
 * Adds a player to the topscorer list, or appends to his total goals.
 * Sorts the topscorer list
 * @param player
 */
ReplayEngine.prototype.addScorer = function(player) {
    //Create a new scorer entry, if it doesn't exist
    if(!this.goalscorers[player.dbid]) {
        this.goalscorers[player.dbid] = player;
        this.goalscorers[player.dbid].totalGoals = 1;

        this.topscorersBody.append('<tr id="' + player.dbid +'"><td>' + player.name + '</td><td class="total">'
            + this.goalscorers[player.dbid].totalGoals  + '</td></tr>');

    } else {
        this.goalscorers[player.dbid].totalGoals++;
        var prow = $('#' + player.dbid);
        prow.find('.total').html(this.goalscorers[player.dbid].totalGoals);
    }

    var playerRow = prow ? prow : $('#' + player.dbid);

    this.sortTopScorers();

    playerRow.addClass('highlight');

    setTimeout(function() {
        playerRow.removeClass('highlight');
    }, 3000)

};

/**
 * EVENT
 * Uses the event or match for updating the table
 * @param event - Event or match with homeGoals and awayGoals
 * @param noEvent - Don't process as event. Used when fast simulating table
 */
ReplayEngine.prototype.updateTable = function(event, noEvent) {
    var $hometeam = $('#' + this.match.homeTeam.dbid);
    var $awayteam = $('#' + this.match.awayTeam.dbid);

    //Create a base from which the event goals are calculated from,
    //so the table can be updated "live"
    //This is done after the first goal
    if(event.homeGoals + event.awayGoals === 1) {
        this.match._oldstats = {
            home: $hometeam.clone(),
            away: $awayteam.clone()
        };
    }

    //Reset state for the new event, unless it's a noEvent type
    if(!noEvent && event.homeGoals + event.awayGoals !== 0) {
        $hometeam.html(this.match._oldstats.home.html());
        $awayteam.html(this.match._oldstats.away.html());
    }

    //Set values based on the goals in the match

    //Set games played
    s('gp');

    //Sets won/loss/draw/pts
    if(event.homeGoals > event.awayGoals) {
        s('pts', $hometeam, 3);
        s('w', $hometeam);
        s('l', $awayteam);
    } else if(event.homeGoals < event.awayGoals) {
        s('pts', $awayteam, 3);
        s('w', $awayteam);
        s('l', $hometeam);
    } else {
        s('pts');
        s('d', $hometeam);
        s('d', $awayteam);
    }

    //Sets goals for/agains
    s('gf', $hometeam, event.homeGoals);
    s('ga', $hometeam, event.awayGoals);

    s('gf', $awayteam, event.awayGoals);
    s('ga', $awayteam, event.homeGoals);

    //Sets new goal difference
    var homegd = parseInt($hometeam.find('.gf').html()) - parseInt($hometeam.find('.ga').html());
    var awaygd = parseInt($awayteam.find('.gf').html()) - parseInt($awayteam.find('.ga').html());

    $hometeam.find('.gd').html(homegd);
    $awayteam.find('.gd').html(awaygd);

    this.sortLeagueTable();

    /**
     * Sets a parameter in the leaguetable
     * @param ele - Parameter to change
     * @param team - Team to change it from (or both)
     * @param val - Value to add
     */
    function s(ele, team, val) {
        var teams = team? [team] : [$hometeam, $awayteam];
        val = typeof val !== 'undefined' ? val : 1;

        for(var i = 0; i < teams.length; i++) {
            var value = parseInt(teams[i].find('.' + ele).html());
            teams[i].find('.' + ele).html(value + val);
        }
    }
};

/**
 * EVENT
 * Adds a goal and plays the replay, if it exists
 * @param event - Goal event
 * @returns {Function}
 */
ReplayEngine.prototype.goal = function(event) {
    var _this = this;
    return function() {
        var $homegoals = _this.$match.find('.homegoals');
        var $awaygoals = _this.$match.find('.awaygoals');

        //Update the fixturelist
        $homegoals.html(event.homeGoals);
        $awaygoals.html(event.awayGoals);

        //Updates the goal scorers
        if(event.scoringSide === "H") {
            _this.$match.find('.homescorers').append(event.scoringPlayer.name + " (" + event.matchTimeString + (event.ownGoal?' og' : '') + ")<br />");
        } else {
            _this.$match.find('.awayscorers').append(event.scoringPlayer.name  + " (" + event.matchTimeString + (event.ownGoal?' og' : '') + ")<br />");
        }

        //If not an own goal, add scorer to topscorer list
        if(!event.ownGoal) {
            _this.addScorer(event.scoringPlayer);
        }

        //Update the leaguetable with the goal
        _this.updateTable(event);

        //Handle goal highlights
        var index = 0;
        var highlight = event.highlights[index];

        //Check if this highlight has been shown before, to avoid duplicate highlights
        while(highlight === _this.lastHighlight) {
            index++;
            if(!event.highlights[index]) {
                break;
            }

            highlight = event.highlights[index];
        }

        _this.lastHighlight = highlight;

        if(event.highlights.length > 0) {
            $('video')
                .one('ended', function() {
                    $(this).off('error');
                    $(this).prop('src', '');
                    _this.videoIsPlaying = false;
                    _this.nextEvent();
                })
                .off('error')
                .one('error', function() {
                    //Try a different url if the first is not working
                    console.log("error loading " + $(this).prop('src') + '. Trying fat.');
                    highlight = $(this).prop('src').replace('giant.', 'fat.');
                    $('video')
                        .off('error')
                        .one('error', function() {
                            console.log("error loading " + highlight);
                            _this.videoIsPlaying = false;
                            _this.nextEvent();
                        })
                        .prop('src', highlight)[0]
                        .play();
                    _this.videoIsPlaying = true;
                })
                .prop('src', highlight)[0]
                .play();
            _this.videoIsPlaying = true;
        } else {
            _this.nextEvent();
        }
    };
};


/**
 * Adds all events for the match into the event queue
 * @param match
 */
ReplayEngine.prototype.processMatch = function(match) {
    this.match = match;
    this.$match =  $('#' + this.match.dbid);

    this.addEvent(this.highlightMatch);
    this.addEvent(this.initScore);

    //Process match events
    var goalNum = 0;
    var matchEvents = this.match.matchevents;

    //Sort the matchevents by time
    matchEvents.sort(function(a,b) {
        if (a.happenedAt < b.happenedAt) {
            return -1;
        }
        if (a.happenedAt > b.happenedAt) {
            return 1;
        }
        // a must be equal to b
        return 0;
    });

    //Only pick out goal events
    for(var i = 0; i < matchEvents.length; i++) {
        var event = matchEvents[i];

        if(event.type === 'goal') {
            this.addEvent(this.goal(event, goalNum));
            goalNum++;
        }
    }

    this.addEvent(this.endMatch);
};

/**
 * Run the next event in queue
 */
ReplayEngine.prototype.nextEvent = function() {
    this.eventCounter++;
    var _this = this;

    if(this.events[this.eventCounter]) {
        var fn = _this.events[_this.eventCounter];

        //Run the first event instantly, and the following events with a delay
        if(this.eventCounter === 0) {
            $.proxy(fn, _this)();
        }
        else
        {
            setTimeout($.proxy(fn, _this), 2000);
        }

    } else {
        //All events are processed. Reset the event queue, and process the next match, if any
        this.events = [];
        this.eventCounter = -1;

        this.matchCounter++;

        if(this.data[this.matchCounter]) {
            this.processMatch(this.data[this.matchCounter]);
            this.nextEvent();
        } else {
            console.log("No more events");
        }
    }
};


},{}],3:[function(require,module,exports){
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
},{"./config.js":1,"./core/ReplayEngine.js":2,"./views/FixtureView.js":4,"./views/LeagueView.js":5,"./views/TableView.js":6,"./views/VideoView.js":7}],4:[function(require,module,exports){
module.exports = FixtureView;

var TableView = require('./TableView.js');
var config = require('../config.js');

function FixtureView(options) {
    TableView.call(this, options);
    this.parent = config.id.fixtures;
    this.render();
}

FixtureView.prototype = Object.create(TableView.prototype);

},{"../config.js":1,"./TableView.js":6}],5:[function(require,module,exports){
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

    this.render();
}

LeagueView.prototype = Object.create(TableView.prototype);

},{"../config.js":1,"./TableView.js":6}],6:[function(require,module,exports){
module.exports = TableView;

function TableView(options) {
    this.id = options.id || '';
    this.title = options.title || '';
    this.parent = options.parent || '';
    this.html = {};

    if(this.title) {
        this.html['h1[class="title"]'] = this.title;
    }

    this.html.table ={
        'thead' : [],
        'tbody' : []
    };
}

TableView.prototype.addHeader = function addHeader(trow) {
    this.html.table['thead'].push(trow);
};

TableView.prototype.render = function() {
    var absurd = Absurd();
    var _this = this;

    var setup = {};

    if(this.id) {
        var sectionTag = 'section[id="' + this.id + '"]';
        setup.html = {};
        setup.html[sectionTag]  = this.html;

    } else {
        setup.html = this.html;
    }

    setup.constructor = function() {
        this.populate();
        $('#' + _this.parent).append(this.el);
    };

    absurd.component("TableView", setup)();
};
},{}],7:[function(require,module,exports){

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIkM6L1VzZXJzL0NocmlzdGlhbi9BcHBEYXRhL1JvYW1pbmcvbnBtL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29uZmlnLmpzIiwic3JjL2NvcmUvUmVwbGF5RW5naW5lLmpzIiwic3JjL2luZGV4LmpzIiwic3JjL3ZpZXdzL0ZpeHR1cmVWaWV3LmpzIiwic3JjL3ZpZXdzL0xlYWd1ZVZpZXcuanMiLCJzcmMvdmlld3MvVGFibGVWaWV3LmpzIiwic3JjL3ZpZXdzL1ZpZGVvVmlldy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZrQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIFwiaWRcIjoge1xyXG4gICAgICAgIGZpeHR1cmVzOiBcImZpeHR1cmVzXCIsXHJcbiAgICAgICAgY29udGFpbmVyOiBcImNvbnRhaW5lclwiLFxyXG4gICAgICAgIHN0cnVjdHVyZTogXCJzdHJ1Y3R1cmVcIixcclxuICAgICAgICBjZW50ZXJEaXY6IFwiY2VudGVyZGl2XCIsXHJcbiAgICAgICAgc3RhdHM6IFwic3RhdHNcIlxyXG4gICAgfSxcclxuICAgIFwiY2xhc3NcIiA6IHtcclxuXHJcbiAgICB9LFxyXG4gICAgXCJ0eXBlXCIgOiB7XHJcbiAgICAgICAgbGVhZ3VlOiBcImxlYWd1ZVwiXHJcbiAgICB9XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBSZXBsYXlFbmdpbmU7XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIFJlcGxheUVuZ2luZShkYXRhYmFzZVVybCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuZGF0YWJhc2VVcmwgPSBkYXRhYmFzZVVybDtcclxuICAgIHRoaXMubWF0Y2hDb3VudGVyID0gLTE7XHJcblxyXG4gICAgdGhpcy5nb2Fsc2NvcmVycyA9IHt9O1xyXG5cclxuICAgIHRoaXMuZXZlbnRDb3VudGVyID0gLTE7XHJcbiAgICB0aGlzLmV2ZW50cyA9IFtdO1xyXG5cclxuICAgIHRoaXMubWF0Y2ggPSB7fTtcclxuICAgIHRoaXMuJG1hdGNoID0ge307XHJcbiAgICB0aGlzLmxhc3RIaWdobGlnaHQgPSAnJztcclxuXHJcbiAgICB0aGlzLnZpZGVvSXNQbGF5aW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMucmVzdW1lRXZlbnQgPSBudWxsO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU29ydHMgbGVhZ3VlIHRhYmxlIGJ5IHB0cywgZ29hbCBkaWZmZXJlbmNlLCBnb2FscyBmb3IgYW5kIG5hbWVcclxuICAgICAqIFVzZWQgYnkgdGFibGVzb3J0ZXIgcGx1Z2luXHJcbiAgICAgKiBAdHlwZSB7QXJyYXl9XHJcbiAgICAgKi9cclxuICAgIHRoaXMuc29ydE9yZGVyID0gW1s4LDFdLFs3LDFdLCBbNSwxXSxbMCwwXV07XHJcblxyXG4gICAgLy9qUXVlcnkgZWxlbWVudHNcclxuICAgIHRoaXMuZml4dHVyZXMgPSAkKCcjZml4dHVyZXMnKTtcclxuICAgIHRoaXMuZml4dHVyZVRhYmxlID0gdGhpcy5maXh0dXJlcy5maW5kKCd0YWJsZScpO1xyXG4gICAgdGhpcy5zdHJ1Y3R1cmUgPSAkKCcjc3RydWN0dXJlJyk7XHJcbiAgICB0aGlzLmxlYWd1ZVRhYmxlID0gdGhpcy5zdHJ1Y3R1cmUuZmluZCgndGFibGUnKTtcclxuICAgIHRoaXMubGVhZ3VlVGFibGVCb2R5ID0gdGhpcy5zdHJ1Y3R1cmUuZmluZCgndGJvZHknKTtcclxuICAgIHRoaXMuc2VjdGlvbiA9IHRoaXMuc3RydWN0dXJlLmZpbmQoJ3NlY3Rpb24nKTtcclxuICAgIHRoaXMudG9wc2NvcmVycyA9ICQoJyN0b3BzY29yZXJzJyk7XHJcbiAgICB0aGlzLnRvcHNjb3JlcnNCb2R5ID0gdGhpcy50b3BzY29yZXJzLmZpbmQoJ3RhYmxlJykuZmluZCgndGJvZHknKTtcclxuICAgIHRoaXMudG9wc2NvcmVyVGFibGUgPSAkKCcjdG9wc2NvcmVydGFibGUnKTtcclxuXHJcblxyXG5cclxuICAgICQuYWpheCh7XHJcbiAgICAgICAgdHlwZTogJ0dFVCcsXHJcbiAgICAgICAgdXJsOiAgdGhpcy5kYXRhYmFzZVVybCxcclxuICAgICAgICBkYXRhVHlwZTogXCJ0ZXh0XCIsXHJcbiAgICAgICAgYXN5bmM6IHRydWUsXHJcbiAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIklzc3VlOiBcIlxyXG4gICAgICAgICAgICAgICAgKyB0ZXh0U3RhdHVzICsgXCIgXCJcclxuICAgICAgICAgICAgICAgICsgZXJyb3JUaHJvd24gKyBcIiAhXCIpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc3VjY2VzczogZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICAgICAgICBfdGhpcy5kYXRhID0gJC5wYXJzZUpTT04oZGF0YSk7XHJcbiAgICAgICAgICAgIF90aGlzLmluaXQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEcmF3cyB1cCB0YWJsZXMgZnJvbSB0aGUgZGF0YS5cclxuICogU2V0cyB1cCBpbnRlcmFjdGl2ZSBjb21wb25lbnRzLlxyXG4gKi9cclxuUmVwbGF5RW5naW5lLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdmFyIG1hdGNoUmVxdWVzdCA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLnN1YnN0cigxKTtcclxuXHJcbiAgICAvL0RyYXcgYWxsIGZpeHR1cmVzIGFuZCB0aGUgbGVhZ3VlIHRhYmxlIGZyb20gdGhlIGdpdmVuIGRhdGFcclxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSB0aGlzLmRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICB2YXIgbWF0Y2ggPSB0aGlzLmRhdGFbaV07XHJcbiAgICAgICAgZHJhd0ZpeHR1cmUobWF0Y2gpO1xyXG4gICAgICAgIGFkZFRlYW1zVG9MZWFndWVUYWJsZShtYXRjaCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9JZiB0aGUgdXNlciByZXF1ZXN0IGEgc3BlY2lmaWMgbWF0Y2gsIHNpbXVsYXRlIHRoZSB0YWJsZSB1cCB0byB0aGF0IG1hdGNoXHJcbiAgICBpZihtYXRjaFJlcXVlc3QgIT09ICcnKSB7XHJcbiAgICAgICAgdmFyIG1hdGNoSWQgPSBwYXJzZUludChtYXRjaFJlcXVlc3QpO1xyXG5cclxuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSB0aGlzLmRhdGEubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgbWF0Y2ggPSB0aGlzLmRhdGFbaV07XHJcblxyXG4gICAgICAgICAgICBpZihtYXRjaC5kYmlkICE9PSBtYXRjaElkKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLm1hdGNoID0gbWF0Y2g7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZVRhYmxlKG1hdGNoLCB0cnVlKTtcclxuICAgICAgICAgICAgICAgIHRoaXMubWF0Y2hDb3VudGVyKys7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvL1NvcnQgdGhlIHRhYmxlIGJlZm9yZSBzdGFydGluZ1xyXG4gICAgdGhpcy5zb3J0TGVhZ3VlVGFibGUoKTtcclxuXHJcbiAgICAvL1NldCB0aGUgc3RhcnQgYnV0dG9ucyBpbnRlcmFjdGlvbnNcclxuICAgICQoJyNzdGFydCcpLm9uZSgnY2xpY2snLCBmdW5jdGlvbigpIHtcclxuICAgICAgICBfdGhpcy5zdGFydCgpO1xyXG4gICAgICAgICQodGhpcykuaHRtbCgnUGF1c2UnKTtcclxuICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdwbGF5aW5nJyk7XHJcblxyXG4gICAgICAgIC8vVG9nZ2xlIHBhdXNlL3Jlc3VtZSBvbiBmdXJ0aGVyIGNsaWNrc1xyXG4gICAgICAgICQodGhpcykub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgIGlmKCQodGhpcykuaHRtbCgpID09PSAnUGF1c2UnKSB7XHJcbiAgICAgICAgICAgICAgICBpZihfdGhpcy5wYXVzZSgpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5odG1sKCdSZXN1bWUnKTtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdwbGF5aW5nJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgaWYoX3RoaXMucmVzdW1lKCkpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmh0bWwoJ1BhdXNlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygncGxheWluZycpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEcmF3cyBhIGRhdGUgaGVhZGVyLCBpZiBhcHBsaWNhYmxlXHJcbiAgICAgKiBEcmF3cyBhIHNpbmdsZSBmaXh0dXJlIHRvIHRoZSAjZml4dHVyZXMgdGFibGVcclxuICAgICAqIEBwYXJhbSBtYXRjaFxyXG4gICAgICovXHJcbiAgICBmdW5jdGlvbiBkcmF3Rml4dHVyZShtYXRjaCkge1xyXG4gICAgICAgIHZhciBkYXRlID0gX3RoaXMuZm9ybWF0RGF0ZShtYXRjaC5zdGFydCk7XHJcbiAgICAgICAgdmFyIGZpeHR1cmUgPSAkKCc8dHIgaWQ9XCInICsgbWF0Y2guZGJpZCArICdcIiB0aXRsZT1cIicgKyBtYXRjaC5kYmlkICsgJ1wiPjwvdHI+Jyk7XHJcblxyXG4gICAgICAgIGlmKF90aGlzLmZpeHR1cmVUYWJsZS5maW5kKCcjJyArIGRhdGUuaWQpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBfdGhpcy5maXh0dXJlVGFibGUuYXBwZW5kKCc8dHI+PHRkIGlkPVwiJyArIGRhdGUuaWQgKyAnXCIgY2xhc3M9XCJkYXRlXCIgY29sc3BhbiA9IDM+JyArIGRhdGUudGV4dCArICc8L3RkPjwvdHI+JylcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGZpeHR1cmUuYXBwZW5kKFxyXG4gICAgICAgICAgICAnPHRkIGNsYXNzPVwiaG9tZXRlYW1cIj4nICsgbWF0Y2guaG9tZVRlYW0ubmFtZSArICc8cCBjbGFzcz1cImhvbWVzY29yZXJzXCI+PC9wPjwvdGQ+JyxcclxuICAgICAgICAgICAgJzx0ZD48c3BhbiBjbGFzcz1cImhvbWVnb2Fsc1wiPiZuYnNwOzwvc3Bhbj4gLSA8c3BhbiBjbGFzcz1cImF3YXlnb2Fsc1wiPiZuYnNwOzwvc3Bhbj48L3RkPicsXHJcbiAgICAgICAgICAgICc8dGQgY2xhc3M9XCJhd2F5dGVhbVwiPicgKyBtYXRjaC5hd2F5VGVhbS5uYW1lICsgJzxwIGNsYXNzPVwiYXdheXNjb3JlcnNcIj48L3A+PC90ZD4nXHJcbiAgICAgICAgKTtcclxuXHJcblxyXG5cclxuICAgICAgICBfdGhpcy5maXh0dXJlVGFibGUuYXBwZW5kKGZpeHR1cmUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRHJhd3MgYSBzaW5nbGUgY2x1YiBlbnRyeSBpbiB0aGUgbGVhZ3VlIHRhYmxlXHJcbiAgICAgKiBAcGFyYW0gbWF0Y2hcclxuICAgICAqL1xyXG4gICAgZnVuY3Rpb24gYWRkVGVhbXNUb0xlYWd1ZVRhYmxlKG1hdGNoKSB7XHJcbiAgICAgICAgdmFyIGhvbWVUZWFtSWQgPSBtYXRjaC5ob21lVGVhbS5kYmlkO1xyXG4gICAgICAgIHZhciBhd2F5VGVhbUlkID0gbWF0Y2guYXdheVRlYW0uZGJpZDtcclxuXHJcbiAgICAgICAgaWYoX3RoaXMubGVhZ3VlVGFibGVCb2R5LmZpbmQoJyMnICsgaG9tZVRlYW1JZCkubGVuZ3RoID09PSAwKSB7XHJcbiAgICAgICAgICAgIF90aGlzLmxlYWd1ZVRhYmxlQm9keS5hcHBlbmQoJzx0ciBpZD1cIicgKyBob21lVGVhbUlkICsgJ1wiPjx0ZD4nICsgbWF0Y2guaG9tZVRlYW0ubmFtZSArICc8L3RkPjx0ZCBjbGFzcz1cImdwXCI+MDwvdGQ+PHRkIGNsYXNzPVwid1wiPjA8L3RkPjx0ZCBjbGFzcz1cImRcIj4wPC90ZD4nICtcclxuICAgICAgICAgICAgICAgICc8dGQgY2xhc3M9XCJsXCI+MDwvdGQ+PHRkIGNsYXNzPVwiZ2ZcIj4wPC90ZD48dGQgY2xhc3M9XCJnYVwiPjA8L3RkPjx0ZCBjbGFzcz1cImdkXCI+MDwvdGQ+PHRkIGNsYXNzPVwicHRzXCI+MDwvdGQ+PC90cj4nKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKF90aGlzLmxlYWd1ZVRhYmxlQm9keS5maW5kKCcjJyArIGF3YXlUZWFtSWQpLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICAgICAgICBfdGhpcy5sZWFndWVUYWJsZUJvZHkuYXBwZW5kKCc8dHIgaWQ9XCInICsgYXdheVRlYW1JZCArICdcIj48dGQ+JyArIG1hdGNoLmF3YXlUZWFtLm5hbWUgKyAnPC90ZD48dGQgY2xhc3M9XCJncFwiPjA8L3RkPjx0ZCBjbGFzcz1cIndcIj4wPC90ZD48dGQgY2xhc3M9XCJkXCI+MDwvdGQ+JyArXHJcbiAgICAgICAgICAgICAgICAnPHRkIGNsYXNzPVwibFwiPjA8L3RkPjx0ZCBjbGFzcz1cImdmXCI+MDwvdGQ+PHRkIGNsYXNzPVwiZ2FcIj4wPC90ZD48dGQgY2xhc3M9XCJnZFwiPjA8L3RkPjx0ZCBjbGFzcz1cInB0c1wiPjA8L3RkPjwvdHI+Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNvcnRzIHRoZSBsZWFndWUgdGFibGUgYnkgcHRzLCBnb2FsIGRpZmZlcmVuY2UsIGdvYWxzIGZvciBhbmQgbmFtZVxyXG4gKi9cclxuUmVwbGF5RW5naW5lLnByb3RvdHlwZS5zb3J0TGVhZ3VlVGFibGUgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgLy9XaGVuIHVwZGF0aW5nIHRoZSB0YWJsZSBkeW5hbWljYWxseSwgdGhpcyBtZXRob2Qgd29ya3MgYmVzdCBpbiBzb3J0aW5nIGNvcnJlY3RseVxyXG4gICAgdGhpcy5sZWFndWVUYWJsZS5yZW1vdmUoKS5hcHBlbmRUbyh0aGlzLnNlY3Rpb24pLnRhYmxlc29ydGVyKCB7XHJcbiAgICAgICAgc29ydExpc3Q6IF90aGlzLnNvcnRPcmRlclxyXG4gICAgfSApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNvcnRzIHRoZSB0b3BzY29yZXIgdGFibGUgYnkgZ29hbHMgYW5kIG5hbWVcclxuICovXHJcblJlcGxheUVuZ2luZS5wcm90b3R5cGUuc29ydFRvcFNjb3JlcnMgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMudG9wc2NvcmVyVGFibGUucmVtb3ZlKCkuYXBwZW5kVG8odGhpcy50b3BzY29yZXJzKS50YWJsZXNvcnRlcigge1xyXG4gICAgICAgIHNvcnRMaXN0OiBbWzEsMV0sWzAsMF1dXHJcbiAgICB9ICk7XHJcbn07XHJcblxyXG4vKipcclxuICogRm9ybWF0cyBhIGRhdGUgZnJvbSB1bml4IHRpbWVzdGFtcFxyXG4gKiBAcGFyYW0gdGltZXN0YW1wIC0gVW5peCB0aW1lc3RhbXAgaW4gbWlsbGlzZWNvbmRzXHJcbiAqL1xyXG5SZXBsYXlFbmdpbmUucHJvdG90eXBlLmZvcm1hdERhdGUgPSBmdW5jdGlvbih0aW1lc3RhbXApIHtcclxuICAgIHZhciBtb250aE5hbWVzID0gW1xyXG4gICAgICAgIFwiSmFudWFyeVwiLCBcIkZlYnJ1YXJ5XCIsIFwiTWFyY2hcIixcclxuICAgICAgICBcIkFwcmlsXCIsIFwiTWF5XCIsIFwiSnVuZVwiLCBcIkp1bHlcIixcclxuICAgICAgICBcIkF1Z3VzdFwiLCBcIlNlcHRlbWJlclwiLCBcIk9jdG9iZXJcIixcclxuICAgICAgICBcIk5vdmVtYmVyXCIsIFwiRGVjZW1iZXJcIlxyXG4gICAgXTtcclxuXHJcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHRpbWVzdGFtcCk7XHJcblxyXG4gICAgdmFyIGRheSA9IGRhdGUuZ2V0RGF0ZSgpO1xyXG4gICAgdmFyIG1vbnRoSW5kZXggPSBkYXRlLmdldE1vbnRoKCk7XHJcbiAgICB2YXIgeWVhciA9IGRhdGUuZ2V0RnVsbFllYXIoKTtcclxuXHJcbiAgICB2YXIgdGV4dCA9IGRheSArICcgJyArIG1vbnRoTmFtZXNbbW9udGhJbmRleF0gKyAnICcgKyB5ZWFyO1xyXG4gICAgdmFyIGlkID0gZGF5ICsgbW9udGhOYW1lc1ttb250aEluZGV4XSArIHllYXI7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICAndGV4dCcgOiB0ZXh0LFxyXG4gICAgICAgICdpZCcgOiBpZFxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyB0aGUgbGVhZ3VlIHNpbXVsYXRpb24gYW5kIHZpZGVvIHBsYXllclxyXG4gKi9cclxuUmVwbGF5RW5naW5lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9QdXNoIG1hdGNoIGV2ZW50cyB0byBldmVudCBxdWV1ZSwgYW5kIHN0YXJ0IGV2ZW50IHByb2Nlc3NpbmdcclxuICAgIHRoaXMucHJvY2Vzc01hdGNoKHRoaXMuZGF0YVsrK3RoaXMubWF0Y2hDb3VudGVyXSk7XHJcbiAgICB0aGlzLm5leHRFdmVudCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFBhdXNlcyB0aGUgdmlkZW8gcGxheWVyIGFuZCB0aGVyZWJ5IHRoZSBldmVudCBxdWV1ZVxyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gLSBXaGV0aGVyIHRoZSB2aWRlbyBwbGF5ZXIgcGF1c2VkIHN1Y2Nlc2Z1bGx5XHJcbiAqL1xyXG5SZXBsYXlFbmdpbmUucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XHJcbiAgICAvL09ubHkgcGF1c2UgaWYgdGhlIHZpZGVvIGlzIHBsYXlpbmdcclxuICAgIGlmKHRoaXMudmlkZW9Jc1BsYXlpbmcpIHtcclxuICAgICAgICAkKCd2aWRlbycpWzBdLnBhdXNlKCk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXN1bWVzIHRoZSB2aWRlbyBwbGF5ZXIgYW5kIHRoZXJlYnkgdGhlIGV2ZW50IHF1ZXVlXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSAtIFdoZXRoZXIgdGhlIHZpZGVvIGNhbiBiZSByZXN1bWVkXHJcbiAqL1xyXG5SZXBsYXlFbmdpbmUucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgLy9Pbmx5IHJlc3VtZSBpZiB0aGVyZSBpcyBhIHZpZGVvXHJcbiAgICBpZih0aGlzLnZpZGVvSXNQbGF5aW5nKSB7XHJcbiAgICAgICAgJCgndmlkZW8nKVswXS5wbGF5KCk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIGV2ZW50IHRvIHRoZSBldmVudCBxdWV1ZVxyXG4gKiBAcGFyYW0gZXZlbnRcclxuICovXHJcblJlcGxheUVuZ2luZS5wcm90b3R5cGUuYWRkRXZlbnQgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgdGhpcy5ldmVudHMucHVzaChldmVudCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRVZFTlRcclxuICogSGlnaGxpZ2h0cyB0aGUgY3VycmVudGx5IHBsYXlpbmcgbWF0Y2ggYW5kIHRoZWlyIHRlYW1zIGluIHRoZSB0YWJsZVxyXG4gKi9cclxuUmVwbGF5RW5naW5lLnByb3RvdHlwZS5oaWdobGlnaHRNYXRjaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyICRob21ldGVhbSA9ICQoJyMnICsgdGhpcy5tYXRjaC5ob21lVGVhbS5kYmlkKTtcclxuICAgIHZhciAkYXdheXRlYW0gPSAkKCcjJyArIHRoaXMubWF0Y2guYXdheVRlYW0uZGJpZCk7XHJcblxyXG4gICAgdGhpcy4kbWF0Y2guYWRkQ2xhc3MoJ2hpZ2hsaWdodCcpO1xyXG4gICAgJGhvbWV0ZWFtLmFkZENsYXNzKCdoaWdobGlnaHQnKTtcclxuICAgICRhd2F5dGVhbS5hZGRDbGFzcygnaGlnaGxpZ2h0Jyk7XHJcblxyXG4gICAgLy9TY3JvbGwgdG8gdGhlIG5leHQgZGF0ZSwgaWYgdGhlIGRhdGUgY2hhbmdlc1xyXG4gICAgdmFyIGRhdGUgPSB0aGlzLmZvcm1hdERhdGUodGhpcy5tYXRjaC5zdGFydCk7XHJcbiAgICB2YXIgJGRhdGVIZWFkZXIgPSAkKCcjJyArIGRhdGUuaWQpO1xyXG5cclxuICAgIHZhciBvZmZzZXRfdCA9ICRkYXRlSGVhZGVyLnBvc2l0aW9uKCkudG9wICsgdGhpcy5maXh0dXJlcy5zY3JvbGxUb3AoKSAtICQoJyNoZWFkZXInKS5oZWlnaHQoKTtcclxuXHJcbiAgICB0aGlzLmZpeHR1cmVzLmFuaW1hdGUoe1xyXG4gICAgICAgIHNjcm9sbFRvcDogb2Zmc2V0X3RcclxuICAgIH0sIDIwMDApO1xyXG5cclxuICAgIHRoaXMubmV4dEV2ZW50KCk7XHJcbn07XHJcblxyXG4vKipcclxuICogKiBFVkVOVFxyXG4gKiBDbGVhbnMgdXAgaGlnaGxpZ2h0aW5nIGFuZCBoYW5kbGVzIDAtMCBkcmF3c1xyXG4gKi9cclxuUmVwbGF5RW5naW5lLnByb3RvdHlwZS5lbmRNYXRjaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyICRob21ldGVhbSA9ICQoJyMnICsgdGhpcy5tYXRjaC5ob21lVGVhbS5kYmlkKTtcclxuICAgIHZhciAkYXdheXRlYW0gPSAkKCcjJyArIHRoaXMubWF0Y2guYXdheVRlYW0uZGJpZCk7XHJcblxyXG4gICAgdGhpcy4kbWF0Y2gucmVtb3ZlQ2xhc3MoJ2hpZ2hsaWdodCcpO1xyXG4gICAgJGhvbWV0ZWFtLnJlbW92ZUNsYXNzKCdoaWdobGlnaHQnKTtcclxuICAgICRhd2F5dGVhbS5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XHJcblxyXG4gICAgLy8wLTAgZHJhd3MgYXJlIG5vdCBwcm9jZXNzZWQgYnkgdGhlIGdvYWwgZXZlbnQuIFRha2UgY2FyZSBvZiB0aGVtIGhlcmUuXHJcbiAgICBpZih0aGlzLm1hdGNoLmF3YXlHb2FscyArIHRoaXMubWF0Y2guaG9tZUdvYWxzID09PSAwKSB7XHJcbiAgICAgICAgdGhpcy51cGRhdGVUYWJsZSh0aGlzLm1hdGNoKTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLm5leHRFdmVudCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVWRU5UXHJcbiAqIEluaXRzIGEgbWF0Y2ggc2NvcmUgYnkgc2V0dGluZyBpdCB0byAwLTBcclxuICovXHJcblJlcGxheUVuZ2luZS5wcm90b3R5cGUuaW5pdFNjb3JlID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgJGhvbWVnb2FscyA9IHRoaXMuJG1hdGNoLmZpbmQoJy5ob21lZ29hbHMnKTtcclxuICAgIHZhciAkYXdheWdvYWxzID0gdGhpcy4kbWF0Y2guZmluZCgnLmF3YXlnb2FscycpO1xyXG5cclxuICAgICRob21lZ29hbHMuaHRtbCgwKTtcclxuICAgICRhd2F5Z29hbHMuaHRtbCgwKTtcclxuXHJcbiAgICB0aGlzLm5leHRFdmVudCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgYSBwbGF5ZXIgdG8gdGhlIHRvcHNjb3JlciBsaXN0LCBvciBhcHBlbmRzIHRvIGhpcyB0b3RhbCBnb2Fscy5cclxuICogU29ydHMgdGhlIHRvcHNjb3JlciBsaXN0XHJcbiAqIEBwYXJhbSBwbGF5ZXJcclxuICovXHJcblJlcGxheUVuZ2luZS5wcm90b3R5cGUuYWRkU2NvcmVyID0gZnVuY3Rpb24ocGxheWVyKSB7XHJcbiAgICAvL0NyZWF0ZSBhIG5ldyBzY29yZXIgZW50cnksIGlmIGl0IGRvZXNuJ3QgZXhpc3RcclxuICAgIGlmKCF0aGlzLmdvYWxzY29yZXJzW3BsYXllci5kYmlkXSkge1xyXG4gICAgICAgIHRoaXMuZ29hbHNjb3JlcnNbcGxheWVyLmRiaWRdID0gcGxheWVyO1xyXG4gICAgICAgIHRoaXMuZ29hbHNjb3JlcnNbcGxheWVyLmRiaWRdLnRvdGFsR29hbHMgPSAxO1xyXG5cclxuICAgICAgICB0aGlzLnRvcHNjb3JlcnNCb2R5LmFwcGVuZCgnPHRyIGlkPVwiJyArIHBsYXllci5kYmlkICsnXCI+PHRkPicgKyBwbGF5ZXIubmFtZSArICc8L3RkPjx0ZCBjbGFzcz1cInRvdGFsXCI+J1xyXG4gICAgICAgICAgICArIHRoaXMuZ29hbHNjb3JlcnNbcGxheWVyLmRiaWRdLnRvdGFsR29hbHMgICsgJzwvdGQ+PC90cj4nKTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuZ29hbHNjb3JlcnNbcGxheWVyLmRiaWRdLnRvdGFsR29hbHMrKztcclxuICAgICAgICB2YXIgcHJvdyA9ICQoJyMnICsgcGxheWVyLmRiaWQpO1xyXG4gICAgICAgIHByb3cuZmluZCgnLnRvdGFsJykuaHRtbCh0aGlzLmdvYWxzY29yZXJzW3BsYXllci5kYmlkXS50b3RhbEdvYWxzKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgcGxheWVyUm93ID0gcHJvdyA/IHByb3cgOiAkKCcjJyArIHBsYXllci5kYmlkKTtcclxuXHJcbiAgICB0aGlzLnNvcnRUb3BTY29yZXJzKCk7XHJcblxyXG4gICAgcGxheWVyUm93LmFkZENsYXNzKCdoaWdobGlnaHQnKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHBsYXllclJvdy5yZW1vdmVDbGFzcygnaGlnaGxpZ2h0Jyk7XHJcbiAgICB9LCAzMDAwKVxyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBFVkVOVFxyXG4gKiBVc2VzIHRoZSBldmVudCBvciBtYXRjaCBmb3IgdXBkYXRpbmcgdGhlIHRhYmxlXHJcbiAqIEBwYXJhbSBldmVudCAtIEV2ZW50IG9yIG1hdGNoIHdpdGggaG9tZUdvYWxzIGFuZCBhd2F5R29hbHNcclxuICogQHBhcmFtIG5vRXZlbnQgLSBEb24ndCBwcm9jZXNzIGFzIGV2ZW50LiBVc2VkIHdoZW4gZmFzdCBzaW11bGF0aW5nIHRhYmxlXHJcbiAqL1xyXG5SZXBsYXlFbmdpbmUucHJvdG90eXBlLnVwZGF0ZVRhYmxlID0gZnVuY3Rpb24oZXZlbnQsIG5vRXZlbnQpIHtcclxuICAgIHZhciAkaG9tZXRlYW0gPSAkKCcjJyArIHRoaXMubWF0Y2guaG9tZVRlYW0uZGJpZCk7XHJcbiAgICB2YXIgJGF3YXl0ZWFtID0gJCgnIycgKyB0aGlzLm1hdGNoLmF3YXlUZWFtLmRiaWQpO1xyXG5cclxuICAgIC8vQ3JlYXRlIGEgYmFzZSBmcm9tIHdoaWNoIHRoZSBldmVudCBnb2FscyBhcmUgY2FsY3VsYXRlZCBmcm9tLFxyXG4gICAgLy9zbyB0aGUgdGFibGUgY2FuIGJlIHVwZGF0ZWQgXCJsaXZlXCJcclxuICAgIC8vVGhpcyBpcyBkb25lIGFmdGVyIHRoZSBmaXJzdCBnb2FsXHJcbiAgICBpZihldmVudC5ob21lR29hbHMgKyBldmVudC5hd2F5R29hbHMgPT09IDEpIHtcclxuICAgICAgICB0aGlzLm1hdGNoLl9vbGRzdGF0cyA9IHtcclxuICAgICAgICAgICAgaG9tZTogJGhvbWV0ZWFtLmNsb25lKCksXHJcbiAgICAgICAgICAgIGF3YXk6ICRhd2F5dGVhbS5jbG9uZSgpXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvL1Jlc2V0IHN0YXRlIGZvciB0aGUgbmV3IGV2ZW50LCB1bmxlc3MgaXQncyBhIG5vRXZlbnQgdHlwZVxyXG4gICAgaWYoIW5vRXZlbnQgJiYgZXZlbnQuaG9tZUdvYWxzICsgZXZlbnQuYXdheUdvYWxzICE9PSAwKSB7XHJcbiAgICAgICAgJGhvbWV0ZWFtLmh0bWwodGhpcy5tYXRjaC5fb2xkc3RhdHMuaG9tZS5odG1sKCkpO1xyXG4gICAgICAgICRhd2F5dGVhbS5odG1sKHRoaXMubWF0Y2guX29sZHN0YXRzLmF3YXkuaHRtbCgpKTtcclxuICAgIH1cclxuXHJcbiAgICAvL1NldCB2YWx1ZXMgYmFzZWQgb24gdGhlIGdvYWxzIGluIHRoZSBtYXRjaFxyXG5cclxuICAgIC8vU2V0IGdhbWVzIHBsYXllZFxyXG4gICAgcygnZ3AnKTtcclxuXHJcbiAgICAvL1NldHMgd29uL2xvc3MvZHJhdy9wdHNcclxuICAgIGlmKGV2ZW50LmhvbWVHb2FscyA+IGV2ZW50LmF3YXlHb2Fscykge1xyXG4gICAgICAgIHMoJ3B0cycsICRob21ldGVhbSwgMyk7XHJcbiAgICAgICAgcygndycsICRob21ldGVhbSk7XHJcbiAgICAgICAgcygnbCcsICRhd2F5dGVhbSk7XHJcbiAgICB9IGVsc2UgaWYoZXZlbnQuaG9tZUdvYWxzIDwgZXZlbnQuYXdheUdvYWxzKSB7XHJcbiAgICAgICAgcygncHRzJywgJGF3YXl0ZWFtLCAzKTtcclxuICAgICAgICBzKCd3JywgJGF3YXl0ZWFtKTtcclxuICAgICAgICBzKCdsJywgJGhvbWV0ZWFtKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgcygncHRzJyk7XHJcbiAgICAgICAgcygnZCcsICRob21ldGVhbSk7XHJcbiAgICAgICAgcygnZCcsICRhd2F5dGVhbSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9TZXRzIGdvYWxzIGZvci9hZ2FpbnNcclxuICAgIHMoJ2dmJywgJGhvbWV0ZWFtLCBldmVudC5ob21lR29hbHMpO1xyXG4gICAgcygnZ2EnLCAkaG9tZXRlYW0sIGV2ZW50LmF3YXlHb2Fscyk7XHJcblxyXG4gICAgcygnZ2YnLCAkYXdheXRlYW0sIGV2ZW50LmF3YXlHb2Fscyk7XHJcbiAgICBzKCdnYScsICRhd2F5dGVhbSwgZXZlbnQuaG9tZUdvYWxzKTtcclxuXHJcbiAgICAvL1NldHMgbmV3IGdvYWwgZGlmZmVyZW5jZVxyXG4gICAgdmFyIGhvbWVnZCA9IHBhcnNlSW50KCRob21ldGVhbS5maW5kKCcuZ2YnKS5odG1sKCkpIC0gcGFyc2VJbnQoJGhvbWV0ZWFtLmZpbmQoJy5nYScpLmh0bWwoKSk7XHJcbiAgICB2YXIgYXdheWdkID0gcGFyc2VJbnQoJGF3YXl0ZWFtLmZpbmQoJy5nZicpLmh0bWwoKSkgLSBwYXJzZUludCgkYXdheXRlYW0uZmluZCgnLmdhJykuaHRtbCgpKTtcclxuXHJcbiAgICAkaG9tZXRlYW0uZmluZCgnLmdkJykuaHRtbChob21lZ2QpO1xyXG4gICAgJGF3YXl0ZWFtLmZpbmQoJy5nZCcpLmh0bWwoYXdheWdkKTtcclxuXHJcbiAgICB0aGlzLnNvcnRMZWFndWVUYWJsZSgpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyBhIHBhcmFtZXRlciBpbiB0aGUgbGVhZ3VldGFibGVcclxuICAgICAqIEBwYXJhbSBlbGUgLSBQYXJhbWV0ZXIgdG8gY2hhbmdlXHJcbiAgICAgKiBAcGFyYW0gdGVhbSAtIFRlYW0gdG8gY2hhbmdlIGl0IGZyb20gKG9yIGJvdGgpXHJcbiAgICAgKiBAcGFyYW0gdmFsIC0gVmFsdWUgdG8gYWRkXHJcbiAgICAgKi9cclxuICAgIGZ1bmN0aW9uIHMoZWxlLCB0ZWFtLCB2YWwpIHtcclxuICAgICAgICB2YXIgdGVhbXMgPSB0ZWFtPyBbdGVhbV0gOiBbJGhvbWV0ZWFtLCAkYXdheXRlYW1dO1xyXG4gICAgICAgIHZhbCA9IHR5cGVvZiB2YWwgIT09ICd1bmRlZmluZWQnID8gdmFsIDogMTtcclxuXHJcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRlYW1zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50KHRlYW1zW2ldLmZpbmQoJy4nICsgZWxlKS5odG1sKCkpO1xyXG4gICAgICAgICAgICB0ZWFtc1tpXS5maW5kKCcuJyArIGVsZSkuaHRtbCh2YWx1ZSArIHZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVWRU5UXHJcbiAqIEFkZHMgYSBnb2FsIGFuZCBwbGF5cyB0aGUgcmVwbGF5LCBpZiBpdCBleGlzdHNcclxuICogQHBhcmFtIGV2ZW50IC0gR29hbCBldmVudFxyXG4gKiBAcmV0dXJucyB7RnVuY3Rpb259XHJcbiAqL1xyXG5SZXBsYXlFbmdpbmUucHJvdG90eXBlLmdvYWwgPSBmdW5jdGlvbihldmVudCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHJldHVybiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgJGhvbWVnb2FscyA9IF90aGlzLiRtYXRjaC5maW5kKCcuaG9tZWdvYWxzJyk7XHJcbiAgICAgICAgdmFyICRhd2F5Z29hbHMgPSBfdGhpcy4kbWF0Y2guZmluZCgnLmF3YXlnb2FscycpO1xyXG5cclxuICAgICAgICAvL1VwZGF0ZSB0aGUgZml4dHVyZWxpc3RcclxuICAgICAgICAkaG9tZWdvYWxzLmh0bWwoZXZlbnQuaG9tZUdvYWxzKTtcclxuICAgICAgICAkYXdheWdvYWxzLmh0bWwoZXZlbnQuYXdheUdvYWxzKTtcclxuXHJcbiAgICAgICAgLy9VcGRhdGVzIHRoZSBnb2FsIHNjb3JlcnNcclxuICAgICAgICBpZihldmVudC5zY29yaW5nU2lkZSA9PT0gXCJIXCIpIHtcclxuICAgICAgICAgICAgX3RoaXMuJG1hdGNoLmZpbmQoJy5ob21lc2NvcmVycycpLmFwcGVuZChldmVudC5zY29yaW5nUGxheWVyLm5hbWUgKyBcIiAoXCIgKyBldmVudC5tYXRjaFRpbWVTdHJpbmcgKyAoZXZlbnQub3duR29hbD8nIG9nJyA6ICcnKSArIFwiKTxiciAvPlwiKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBfdGhpcy4kbWF0Y2guZmluZCgnLmF3YXlzY29yZXJzJykuYXBwZW5kKGV2ZW50LnNjb3JpbmdQbGF5ZXIubmFtZSAgKyBcIiAoXCIgKyBldmVudC5tYXRjaFRpbWVTdHJpbmcgKyAoZXZlbnQub3duR29hbD8nIG9nJyA6ICcnKSArIFwiKTxiciAvPlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vSWYgbm90IGFuIG93biBnb2FsLCBhZGQgc2NvcmVyIHRvIHRvcHNjb3JlciBsaXN0XHJcbiAgICAgICAgaWYoIWV2ZW50Lm93bkdvYWwpIHtcclxuICAgICAgICAgICAgX3RoaXMuYWRkU2NvcmVyKGV2ZW50LnNjb3JpbmdQbGF5ZXIpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9VcGRhdGUgdGhlIGxlYWd1ZXRhYmxlIHdpdGggdGhlIGdvYWxcclxuICAgICAgICBfdGhpcy51cGRhdGVUYWJsZShldmVudCk7XHJcblxyXG4gICAgICAgIC8vSGFuZGxlIGdvYWwgaGlnaGxpZ2h0c1xyXG4gICAgICAgIHZhciBpbmRleCA9IDA7XHJcbiAgICAgICAgdmFyIGhpZ2hsaWdodCA9IGV2ZW50LmhpZ2hsaWdodHNbaW5kZXhdO1xyXG5cclxuICAgICAgICAvL0NoZWNrIGlmIHRoaXMgaGlnaGxpZ2h0IGhhcyBiZWVuIHNob3duIGJlZm9yZSwgdG8gYXZvaWQgZHVwbGljYXRlIGhpZ2hsaWdodHNcclxuICAgICAgICB3aGlsZShoaWdobGlnaHQgPT09IF90aGlzLmxhc3RIaWdobGlnaHQpIHtcclxuICAgICAgICAgICAgaW5kZXgrKztcclxuICAgICAgICAgICAgaWYoIWV2ZW50LmhpZ2hsaWdodHNbaW5kZXhdKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaGlnaGxpZ2h0ID0gZXZlbnQuaGlnaGxpZ2h0c1tpbmRleF07XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfdGhpcy5sYXN0SGlnaGxpZ2h0ID0gaGlnaGxpZ2h0O1xyXG5cclxuICAgICAgICBpZihldmVudC5oaWdobGlnaHRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgJCgndmlkZW8nKVxyXG4gICAgICAgICAgICAgICAgLm9uZSgnZW5kZWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLm9mZignZXJyb3InKTtcclxuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnByb3AoJ3NyYycsICcnKTtcclxuICAgICAgICAgICAgICAgICAgICBfdGhpcy52aWRlb0lzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLm5leHRFdmVudCgpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5vZmYoJ2Vycm9yJylcclxuICAgICAgICAgICAgICAgIC5vbmUoJ2Vycm9yJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy9UcnkgYSBkaWZmZXJlbnQgdXJsIGlmIHRoZSBmaXJzdCBpcyBub3Qgd29ya2luZ1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgbG9hZGluZyBcIiArICQodGhpcykucHJvcCgnc3JjJykgKyAnLiBUcnlpbmcgZmF0LicpO1xyXG4gICAgICAgICAgICAgICAgICAgIGhpZ2hsaWdodCA9ICQodGhpcykucHJvcCgnc3JjJykucmVwbGFjZSgnZ2lhbnQuJywgJ2ZhdC4nKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCd2aWRlbycpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5vZmYoJ2Vycm9yJylcclxuICAgICAgICAgICAgICAgICAgICAgICAgLm9uZSgnZXJyb3InLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZXJyb3IgbG9hZGluZyBcIiArIGhpZ2hsaWdodCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy52aWRlb0lzUGxheWluZyA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMubmV4dEV2ZW50KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wcm9wKCdzcmMnLCBoaWdobGlnaHQpWzBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC5wbGF5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMudmlkZW9Jc1BsYXlpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgICAgIC5wcm9wKCdzcmMnLCBoaWdobGlnaHQpWzBdXHJcbiAgICAgICAgICAgICAgICAucGxheSgpO1xyXG4gICAgICAgICAgICBfdGhpcy52aWRlb0lzUGxheWluZyA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgX3RoaXMubmV4dEV2ZW50KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxufTtcclxuXHJcblxyXG4vKipcclxuICogQWRkcyBhbGwgZXZlbnRzIGZvciB0aGUgbWF0Y2ggaW50byB0aGUgZXZlbnQgcXVldWVcclxuICogQHBhcmFtIG1hdGNoXHJcbiAqL1xyXG5SZXBsYXlFbmdpbmUucHJvdG90eXBlLnByb2Nlc3NNYXRjaCA9IGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICB0aGlzLm1hdGNoID0gbWF0Y2g7XHJcbiAgICB0aGlzLiRtYXRjaCA9ICAkKCcjJyArIHRoaXMubWF0Y2guZGJpZCk7XHJcblxyXG4gICAgdGhpcy5hZGRFdmVudCh0aGlzLmhpZ2hsaWdodE1hdGNoKTtcclxuICAgIHRoaXMuYWRkRXZlbnQodGhpcy5pbml0U2NvcmUpO1xyXG5cclxuICAgIC8vUHJvY2VzcyBtYXRjaCBldmVudHNcclxuICAgIHZhciBnb2FsTnVtID0gMDtcclxuICAgIHZhciBtYXRjaEV2ZW50cyA9IHRoaXMubWF0Y2gubWF0Y2hldmVudHM7XHJcblxyXG4gICAgLy9Tb3J0IHRoZSBtYXRjaGV2ZW50cyBieSB0aW1lXHJcbiAgICBtYXRjaEV2ZW50cy5zb3J0KGZ1bmN0aW9uKGEsYikge1xyXG4gICAgICAgIGlmIChhLmhhcHBlbmVkQXQgPCBiLmhhcHBlbmVkQXQpIHtcclxuICAgICAgICAgICAgcmV0dXJuIC0xO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoYS5oYXBwZW5lZEF0ID4gYi5oYXBwZW5lZEF0KSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBhIG11c3QgYmUgZXF1YWwgdG8gYlxyXG4gICAgICAgIHJldHVybiAwO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy9Pbmx5IHBpY2sgb3V0IGdvYWwgZXZlbnRzXHJcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgbWF0Y2hFdmVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICB2YXIgZXZlbnQgPSBtYXRjaEV2ZW50c1tpXTtcclxuXHJcbiAgICAgICAgaWYoZXZlbnQudHlwZSA9PT0gJ2dvYWwnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRXZlbnQodGhpcy5nb2FsKGV2ZW50LCBnb2FsTnVtKSk7XHJcbiAgICAgICAgICAgIGdvYWxOdW0rKztcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5hZGRFdmVudCh0aGlzLmVuZE1hdGNoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSdW4gdGhlIG5leHQgZXZlbnQgaW4gcXVldWVcclxuICovXHJcblJlcGxheUVuZ2luZS5wcm90b3R5cGUubmV4dEV2ZW50ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmV2ZW50Q291bnRlcisrO1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICBpZih0aGlzLmV2ZW50c1t0aGlzLmV2ZW50Q291bnRlcl0pIHtcclxuICAgICAgICB2YXIgZm4gPSBfdGhpcy5ldmVudHNbX3RoaXMuZXZlbnRDb3VudGVyXTtcclxuXHJcbiAgICAgICAgLy9SdW4gdGhlIGZpcnN0IGV2ZW50IGluc3RhbnRseSwgYW5kIHRoZSBmb2xsb3dpbmcgZXZlbnRzIHdpdGggYSBkZWxheVxyXG4gICAgICAgIGlmKHRoaXMuZXZlbnRDb3VudGVyID09PSAwKSB7XHJcbiAgICAgICAgICAgICQucHJveHkoZm4sIF90aGlzKSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkoZm4sIF90aGlzKSwgMjAwMCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgLy9BbGwgZXZlbnRzIGFyZSBwcm9jZXNzZWQuIFJlc2V0IHRoZSBldmVudCBxdWV1ZSwgYW5kIHByb2Nlc3MgdGhlIG5leHQgbWF0Y2gsIGlmIGFueVxyXG4gICAgICAgIHRoaXMuZXZlbnRzID0gW107XHJcbiAgICAgICAgdGhpcy5ldmVudENvdW50ZXIgPSAtMTtcclxuXHJcbiAgICAgICAgdGhpcy5tYXRjaENvdW50ZXIrKztcclxuXHJcbiAgICAgICAgaWYodGhpcy5kYXRhW3RoaXMubWF0Y2hDb3VudGVyXSkge1xyXG4gICAgICAgICAgICB0aGlzLnByb2Nlc3NNYXRjaCh0aGlzLmRhdGFbdGhpcy5tYXRjaENvdW50ZXJdKTtcclxuICAgICAgICAgICAgdGhpcy5uZXh0RXZlbnQoKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5vIG1vcmUgZXZlbnRzXCIpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbiIsInZhciBjb25maWcgPSByZXF1aXJlKCcuL2NvbmZpZy5qcycpO1xyXG5cclxudmFyIFJlcGxheUVuZ2luZSA9IHJlcXVpcmUoJy4vY29yZS9SZXBsYXlFbmdpbmUuanMnKTtcclxuXHJcbnZhciBMZWFndWVWaWV3ID0gcmVxdWlyZSgnLi92aWV3cy9MZWFndWVWaWV3LmpzJyk7XHJcbnZhciBGaXh0dXJlVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvRml4dHVyZVZpZXcuanMnKTtcclxudmFyIFZpZGVvVmlldyA9IHJlcXVpcmUoJy4vdmlld3MvVmlkZW9WaWV3LmpzJyk7XHJcbnZhciBUYWJsZVZpZXcgPSByZXF1aXJlKCcuL3ZpZXdzL1RhYmxlVmlldy5qcycpO1xyXG5cclxuXHJcblxyXG5cclxuJChkb2N1bWVudCkub24oJ3JlYWR5JywgZnVuY3Rpb24oKSB7XHJcbiAgICBuZXcgTGVhZ3VlVmlldyh7XHJcbiAgICAgICAgdGl0bGU6IFwiUHJlbWllciBMZWFndWUgMjAxNS8yMDE2XCIsXHJcbiAgICAgICAgaWQ6IFwibGVhZ3VlVGFibGVcIlxyXG4gICAgfSk7XHJcblxyXG4gICAgbmV3IEZpeHR1cmVWaWV3KHtcclxuICAgICAgICB0aXRsZTogXCJGaXh0dXJlc1wiXHJcbiAgICB9KTtcclxuXHJcbiAgICB2YXIgdG9wc2NvcmVycyA9IG5ldyBUYWJsZVZpZXcoe1xyXG4gICAgICAgIGlkOiBcInRvcFNjb3JlcnNcIixcclxuICAgICAgICB0aXRsZTogXCJUb3AgU2NvcmVyc1wiLFxyXG4gICAgICAgIHBhcmVudDogY29uZmlnLmlkLnN0YXRzXHJcbiAgICB9KTtcclxuXHJcbiAgICB0b3BzY29yZXJzLmFkZEhlYWRlcih7XHJcbiAgICAgICAgJ3RyJyA6IFtcclxuICAgICAgICAgICAgeyd0aCcgOiBcIk5hbWVcIn0sXHJcbiAgICAgICAgICAgIHsndGgnIDogXCJHb2Fsc1wifVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG5cclxuICAgIHRvcHNjb3JlcnMucmVuZGVyKCk7XHJcblxyXG4gICAgdmFyIHJlcGxheSA9IG5ldyBSZXBsYXlFbmdpbmUoJy4vbWF0Y2hlcy5qc29uJyk7XHJcblxyXG5cclxufSk7XHJcblxyXG5cclxuLyoqXHJcbiAqIDxkaXYgaWQ9XCJ0b3BzY29yZXJzXCI+XHJcbiA8aDE+VG9wIEdvYWwgU2NvcmVyczwvaDE+XHJcbiA8dGFibGUgaWQ9XCJ0b3BzY29yZXJ0YWJsZVwiIGNsYXNzPVwidGFibGVzb3J0ZXJcIj5cclxuIDx0aGVhZD5cclxuIDx0cj5cclxuIDx0aD5OYW1lPC90aD5cclxuIDx0aD5Hb2FsczwvdGg+XHJcbiA8L3RyPlxyXG4gPC90aGVhZD5cclxuIDx0Ym9keT48L3Rib2R5PlxyXG4gPC90YWJsZT5cclxuIDwvZGl2PlxyXG4gKiovIiwibW9kdWxlLmV4cG9ydHMgPSBGaXh0dXJlVmlldztcclxuXHJcbnZhciBUYWJsZVZpZXcgPSByZXF1aXJlKCcuL1RhYmxlVmlldy5qcycpO1xyXG52YXIgY29uZmlnID0gcmVxdWlyZSgnLi4vY29uZmlnLmpzJyk7XHJcblxyXG5mdW5jdGlvbiBGaXh0dXJlVmlldyhvcHRpb25zKSB7XHJcbiAgICBUYWJsZVZpZXcuY2FsbCh0aGlzLCBvcHRpb25zKTtcclxuICAgIHRoaXMucGFyZW50ID0gY29uZmlnLmlkLmZpeHR1cmVzO1xyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxufVxyXG5cclxuRml4dHVyZVZpZXcucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShUYWJsZVZpZXcucHJvdG90eXBlKTtcclxuIiwibW9kdWxlLmV4cG9ydHMgPSBMZWFndWVWaWV3O1xyXG5cclxudmFyIGNvbmZpZyA9IHJlcXVpcmUoJy4uL2NvbmZpZy5qcycpO1xyXG52YXIgVGFibGVWaWV3ID0gcmVxdWlyZSgnLi9UYWJsZVZpZXcuanMnKTtcclxuXHJcbmZ1bmN0aW9uIExlYWd1ZVZpZXcob3B0aW9ucykge1xyXG4gICAgVGFibGVWaWV3LmNhbGwodGhpcywgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5wYXJlbnQgPSBjb25maWcuaWQuc3RydWN0dXJlO1xyXG5cclxuICAgIHRoaXMuYWRkSGVhZGVyKHtcclxuICAgICAgICAndHInIDogW1xyXG4gICAgICAgICAgICB7J3RoJyA6IFwiQ2x1YlwifSxcclxuICAgICAgICAgICAgeyd0aCcgOiBcIkdQXCJ9LFxyXG4gICAgICAgICAgICB7J3RoJyA6IFwiV1wifSxcclxuICAgICAgICAgICAgeyd0aCcgOiBcIkRcIn0sXHJcbiAgICAgICAgICAgIHsndGgnIDogXCJMXCJ9LFxyXG4gICAgICAgICAgICB7J3RoJyA6IFwiR0ZcIn0sXHJcbiAgICAgICAgICAgIHsndGgnIDogXCJHQVwifSxcclxuICAgICAgICAgICAgeyd0aCcgOiBcIkdEXCJ9LFxyXG4gICAgICAgICAgICB7J3RoJyA6IFwiUFRTXCJ9XHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5yZW5kZXIoKTtcclxufVxyXG5cclxuTGVhZ3VlVmlldy5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFRhYmxlVmlldy5wcm90b3R5cGUpO1xyXG4iLCJtb2R1bGUuZXhwb3J0cyA9IFRhYmxlVmlldztcclxuXHJcbmZ1bmN0aW9uIFRhYmxlVmlldyhvcHRpb25zKSB7XHJcbiAgICB0aGlzLmlkID0gb3B0aW9ucy5pZCB8fCAnJztcclxuICAgIHRoaXMudGl0bGUgPSBvcHRpb25zLnRpdGxlIHx8ICcnO1xyXG4gICAgdGhpcy5wYXJlbnQgPSBvcHRpb25zLnBhcmVudCB8fCAnJztcclxuICAgIHRoaXMuaHRtbCA9IHt9O1xyXG5cclxuICAgIGlmKHRoaXMudGl0bGUpIHtcclxuICAgICAgICB0aGlzLmh0bWxbJ2gxW2NsYXNzPVwidGl0bGVcIl0nXSA9IHRoaXMudGl0bGU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5odG1sLnRhYmxlID17XHJcbiAgICAgICAgJ3RoZWFkJyA6IFtdLFxyXG4gICAgICAgICd0Ym9keScgOiBbXVxyXG4gICAgfTtcclxufVxyXG5cclxuVGFibGVWaWV3LnByb3RvdHlwZS5hZGRIZWFkZXIgPSBmdW5jdGlvbiBhZGRIZWFkZXIodHJvdykge1xyXG4gICAgdGhpcy5odG1sLnRhYmxlWyd0aGVhZCddLnB1c2godHJvdyk7XHJcbn07XHJcblxyXG5UYWJsZVZpZXcucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGFic3VyZCA9IEFic3VyZCgpO1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICB2YXIgc2V0dXAgPSB7fTtcclxuXHJcbiAgICBpZih0aGlzLmlkKSB7XHJcbiAgICAgICAgdmFyIHNlY3Rpb25UYWcgPSAnc2VjdGlvbltpZD1cIicgKyB0aGlzLmlkICsgJ1wiXSc7XHJcbiAgICAgICAgc2V0dXAuaHRtbCA9IHt9O1xyXG4gICAgICAgIHNldHVwLmh0bWxbc2VjdGlvblRhZ10gID0gdGhpcy5odG1sO1xyXG5cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0dXAuaHRtbCA9IHRoaXMuaHRtbDtcclxuICAgIH1cclxuXHJcbiAgICBzZXR1cC5jb25zdHJ1Y3RvciA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMucG9wdWxhdGUoKTtcclxuICAgICAgICAkKCcjJyArIF90aGlzLnBhcmVudCkuYXBwZW5kKHRoaXMuZWwpO1xyXG4gICAgfTtcclxuXHJcbiAgICBhYnN1cmQuY29tcG9uZW50KFwiVGFibGVWaWV3XCIsIHNldHVwKSgpO1xyXG59OyIsIiJdfQ==
