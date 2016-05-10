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

    this.teamFollowing = "All Teams";

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
        addTeamsToDropdownMenu(match);
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

    //Sort the drop down list and prepend the All Teams option
    $("#selectTeamDropdown").html($("#selectTeamDropdown option").sort(function (a, b) {
        return a.text == b.text ? 0 : a.text < b.text ? -1 : 1
    }));

    $("#selectTeamDropdown").prepend("<option selected>All Teams</option>");

    //Set event handler when drop down list has changes
    $("#selectTeamDropdown").change(function() {
        _this.teamFollowing = $(this).find("option:selected").text();
    });

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

    /**
     * Adds teams to the drop down menu to select to follow a team
     * @param match
     */
    function addTeamsToDropdownMenu(match) {
        var homeTeamId = match.homeTeam.dbid;
        var awayTeamId = match.awayTeam.dbid;

        var dropdownList = document.getElementById('selectTeamDropdown').options;

        var homeTeamExists = false;
        var awayTeamExists = false;

        for (var j = 0; j < dropdownList.length; j++) {
            if (dropdownList[j].value == match.homeTeam.dbid) {
                homeTeamExists = true;
                break;
            }
        }
        
        for (var j = 0; j < dropdownList.length; j++) {
            if (dropdownList[j].value == match.awayTeam.dbid) {
                awayTeamExists = true;
                break;
            }
        }

        if (!homeTeamExists) {
            $("#selectTeamDropdown").append("<option value=\"" + homeTeamId + "\">" + match.homeTeam.name + "</option>");
        }

        if (!awayTeamExists) {
            $("#selectTeamDropdown").append("<option value=\"" + awayTeamId + "\">" + match.awayTeam.name + "</option>");
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

    if (this.teamFollowing != "All Teams" && match.homeTeam.name != this.teamFollowing && match.awayTeam.name != this.teamFollowing) {
        this.updateTable(match, true);
        return;
    }

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

