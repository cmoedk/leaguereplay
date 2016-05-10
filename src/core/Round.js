module.exports = Round;

require('../mixins/jQuery.EventEmitter.js');

var config = require('../config.js');
var util = require('../util.js');

var View = require('../views/View.js');
var LeagueView = require('../views/LeagueView.js');
var FixtureView = require('../views/FixtureView.js');
var VideoView = require('../views/VideoView.js');
var TableView = require('../views/TableView.js');

var Match = require('./Match.js');
var Event = require('./Event.js');

function Round(round) {
    this.data = round;
    this.matches = [];
    this.currentMatch = -1;
    this.addedTeams = [];
    this.addedDates = [];

    this.goalscorers = {};

    this.oldStats = {
        home: 0,
        away:0
    };

    this.structureId =  this.data.type + this.data.dbid;

    //TODO switch with config values
    this.$fixtures = $('#fixtures');
    this.$structure = $('#structure');

    //Sort the fixtures by start date
    this.data.fixtures.sort(function(a,b) {
        if (a.start < b.start) {
            return -1;
        }
        if (a.start > b.start) {
            return 1;
        }
        // a must be equal to b
        return 0;
    });

    for(var i = 0; i < this.data.fixtures.length; i++) {
        this.matches.push(new Match(this.data.fixtures[i]))
    }
}

jQuery.extend(Round.prototype, jQuery.eventEmitter);


Round.prototype.render = function() {
    var view = null;
    var fixtures = '';
    var structure = '';

    switch(this.data.type) {
        case config.type.LEAGUE :
            view = new View([
                new LeagueView({
                    title: this.data.title,
                    id: this.structureId
                }),
                new FixtureView({
                    title: "Fixtures",
                    id: this.structureId + config.FIXTURES
                }),
                //TODO create templates for various stats
                new TableView({
                    id: "topScorers",
                    title: "Top Scorers",
                    parent: config.id.stats,
                    header: {
                        'tr' : [
                            {'th' : "Name"},
                            {'th' : "Goals"}
                        ]
                    }
                })

            ]);

            for (var i = 0, len = this.data.fixtures.length; i < len; i++) {
                var match = this.data.fixtures[i];
                fixtures += this.fixtureHTML(match);
                structure += this.leagueHTML(match);
            }
    }

    if(view !== null) {
        view.render();
        this.$fixtures.find('tbody').append(fixtures);
        this.$structure.find('#' + this.structureId).find('tbody').append(structure);

        util.sortTable($('#' + this.structureId).find('table'), config.LEAGUE_SORTORDER);

    } else {
        console.log("Error: no views");
    }
};

/**
 * Creates a date header, if applicable
 * Returns a single fixture table row, optionally with a date row
 * @param {object} match
 * @return {string} Html for the fixture
 */
Round.prototype.fixtureHTML = function(match) {
    var date = util.formatDate(match.start);
    var fixture = '<tr id="' + util.matchId(match.dbid) + '">' +
        '<td class="hometeam">' +
        '<a href="#" class="' + config.class.FOLLOW_TEAM + ' ' + util.teamClass(match.homeTeam.dbid) + '" data-id="' + match.homeTeam.dbid + '"> ' +
        match.homeTeam.name + '</a><p class="homescorers"></p></td>' +
        '<td class="' + config.class.MATCH_SELECT + '"><span class="homegoals">&nbsp;</span> - <span class="awaygoals">&nbsp;</span></td>' +
        '<td class="awayteam">' +
        '<a href="#" class="' + config.class.FOLLOW_TEAM + ' ' + util.teamClass(match.awayTeam.dbid) + '" data-id="' + match.homeTeam.dbid + '"> ' +
        match.awayTeam.name + '<p class="awayscorers"></p></td></tr>';


    //Create a date row, if none exist
    if($.inArray(date.id, this.addedDates) === -1) {
        fixture = '<tr><td id="' + date.id + '" class="' + config.class.DATE + '" colspan = 3>' + date.text + '</td></tr>' + fixture;
        this.addedDates.push(date.id);
    }
    return fixture;
};

/**
 * Returns a single club row for the league table
 * @param match
 * @return {string} HTML for the row
 */
Round.prototype.leagueHTML = function(match) {
    var row = '';

    if($.inArray(match.homeTeam.dbid, this.addedTeams) === -1) {
        row += tableRow(match.homeTeam);
        this.addedTeams.push(match.homeTeam.dbid);
    }

    if($.inArray(match.awayTeam.dbid, this.addedTeams) === -1) {
        row += tableRow(match.awayTeam);
        this.addedTeams.push(match.awayTeam.dbid);
    }

    return row;

    function tableRow(team) {
        return '<tr id="' + team.dbid + '"><td>' +
            '<a href="#" class="' + config.class.FOLLOW_TEAM + ' ' + util.teamClass(team.dbid) + '" data-id="' + team.dbid + '"> ' + team.name + '</a>' +
            '</td><td class="gp">0</td><td class="w">0</td><td class="d">0</td>' +
            '<td class="l">0</td><td class="gf">0</td><td class="ga">0</td><td class="gd">0</td><td class="pts">0</td></tr>';
    }
};

Round.prototype.nextMatch = function() {
    this.currentMatch++;

    if(!this.matches[this.currentMatch]) {
        return false;
    } else {
        return this.matches[this.currentMatch];
    }
};

/**
 * Uses the event or match for updating the table
 * @param event - Event or match with homeGoals and awayGoals
  */
Round.prototype.update = function(event, followMatch) {
    if(event.data) {
        event = event.data;
    }


    var $hometeam = $('#' + event.homeTeam.dbid);
    var $awayteam = $('#' + event.awayTeam.dbid);

    //Create a base from which the event goals are calculated from,
    //so the table can be updated "live"
    //This is done after the first goal
    if(event.homeGoals + event.awayGoals === 1) {
        this.oldStats = {
            home: $hometeam.clone(),
            away: $awayteam.clone()
        };
    }

    //Reset state for the new event
    if(event.homeGoals + event.awayGoals !== 0) {
        $hometeam.html(this.oldStats.home.html());
        $awayteam.html(this.oldStats.away.html());
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

    util.sortTable($('#' + this.structureId).find('table'), config.LEAGUE_SORTORDER);

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
 * Adds a player to the topscorer list, or appends to his total goals.
 * Sorts the topscorer list
 * @param player
 */
Round.prototype.addScorer = function(player) {
    var $topscorers = $('#topScorers');

    //Create a new scorer entry, if it doesn't exist
    if(!this.goalscorers[player.dbid]) {
        this.goalscorers[player.dbid] = player;
        this.goalscorers[player.dbid].totalGoals = 1;

        $topscorers.find('tbody').append('<tr id="' + player.dbid +'"><td>' + player.name + '</td><td class="total">'
            + this.goalscorers[player.dbid].totalGoals  + '</td></tr>');

    } else {
        this.goalscorers[player.dbid].totalGoals++;
        var prow = $('#' + player.dbid);
        prow.find('.total').html(this.goalscorers[player.dbid].totalGoals);
    }

    var playerRow = prow ? prow : $('#' + player.dbid);

    util.sortTable($topscorers.find('table'), [[1,1],[0,0]]);

    playerRow.addClass('highlight');

    setTimeout(function() {
        playerRow.removeClass('highlight');
    }, 3000)

};


