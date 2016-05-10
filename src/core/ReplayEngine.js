module.exports = ReplayEngine;

var config = require('../config.js');
var settings = require('../settings.js');
var util = require('../util.js');

var Competition = require('./Competition.js');


function ReplayEngine(compId) {
    var _this = this;

    this.competition = new Competition(compId);
    this.competition.on('ready', function() {
        this.render();
    });
    this.competition.on('finish', function() {
        console.log("Competition has finished animating");
    });

    $(document).on('click', '.' + config.class.FOLLOW_TEAM, function(e) {
        e.preventDefault();
        if($(this).hasClass(config.class.FOLLOWED)) {
            _this.removeFollow($(this).attr('data-id'));
        } else {
            _this.addFollow($(this).attr('data-id'));
        }
    });

    $(document).one('click', '.' + config.class.MATCH_SELECT, function(e) {
        e.preventDefault();
        selectMatch(this);
        $('#start').trigger('click');

        $(document).on('click', '.' + config.class.MATCH_SELECT, function(e) {
            e.preventDefault();
            selectMatch(this);
        });

        function selectMatch(el) {
            if($(el).hasClass(config.class.MATCH_SELECTED)) {
                $(el).removeClass(config.class.MATCH_SELECTED);
                _this.simulateTo = -1;
                return;
            }

            $('.' + config.class.MATCH_SELECTED).removeClass(config.class.MATCH_SELECTED);
            _this.simulateTo = $(el).parent().attr('id');
            $(el).addClass(config.class.MATCH_SELECTED);

            setTimeout(function() {
                $(el).removeClass(config.class.MATCH_SELECTED);
            }, 3000); //TODO move to settings file
        }
    });

    //Set the start buttons interactions
    $('#start').one('click', function() {
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

        _this.processMatch(_this.competition.nextMatch());
        _this.nextEvent();
    });

    this.eventCounter = -1;
    this.events = [];

    this.simulateTo = -1;

    this.currentMatch = null;
    this.$currentMatch = null;

    this.videoIsPlaying = false;

    //jQuery elements
    this.fixtures = $('#fixtures');
    this.structure = $('#structure');
    this.section = this.structure.find('section');
    this.topscorers = $('#topscorers');
}

ReplayEngine.prototype.removeFollow = function(teamId) {
    $('.' + util.teamClass(teamId)).removeClass(config.class.FOLLOWED);
    util.removeVal(settings.FOLLOW_TEAMS, parseInt(teamId));
};

ReplayEngine.prototype.addFollow = function(teamId) {
    $('.' + util.teamClass(teamId)).addClass(config.class.FOLLOWED);
    settings.FOLLOW_TEAMS.push(parseInt(teamId));
};

ReplayEngine.prototype.willFollow = function(match) {
    return (this.simulateTo === -1
            && (util.findOne([match.data.homeTeam.dbid, match.data.awayTeam.dbid], settings.FOLLOW_TEAMS)
            || settings.FOLLOW_TEAMS.length === 0));
};

/**
 * Adds all events for the match into the event queue
 * @param {Match} match
 */
ReplayEngine.prototype.processMatch = function(match) {
    if(util.matchId(match.data.dbid) === this.simulateTo) {
        this.simulateTo = -1;
    }

    this.currentMatch = match;
    this.$currentMatch =  $('#' + util.matchId(this.currentMatch.data.dbid));
    var followMatch = this.willFollow(match);

    if(followMatch) {
        this.addEvent(this.highlightMatch, followMatch);
    }

    this.addEvent(this.initScore, followMatch);

    var goals = match.getGoals();

    for(var i = 0; i < goals.length; i++) {
        this.addEvent(this.goal(goals[i], followMatch), followMatch);
    }

    this.addEvent(this.endMatch, followMatch);
};

/**
 * EVENT
 * Highlights the currently playing match and their teams in the table
 */
ReplayEngine.prototype.highlightMatch = function() {
    var $hometeam = $('#' + this.currentMatch.data.homeTeam.dbid);
    var $awayteam = $('#' + this.currentMatch.data.awayTeam.dbid);

    this.$currentMatch.addClass('highlight');
    $hometeam.addClass('highlight');
    $awayteam.addClass('highlight');

    //Scroll to the next date, if the date changes
    var date = util.formatDate(this.currentMatch.data.start);
    var $dateHeader = $('#' + date.id);

    var offset_t = $dateHeader.position().top + this.fixtures.scrollTop() - $('#header').height();

    if(!this.simulate) {
        this.fixtures.animate({
            scrollTop: offset_t
        }, 2000);
    } else {
        this.fixtures.scrollTop(offset_t);
    }

    this.nextEvent();
};

/**
 * EVENT
 * Inits a match score by setting it to 0-0
 */
ReplayEngine.prototype.initScore = function() {
    var $homegoals = this.$currentMatch.find('.homegoals');
    var $awaygoals = this.$currentMatch.find('.awaygoals');

    $homegoals.html(0);
    $awaygoals.html(0);

    this.nextEvent();
};

/**
 * EVENT
 * Adds a goal and plays the replay, if it exists
 * @param event - Goal event
 * @returns {Function}
 */
ReplayEngine.prototype.goal = function(event, followMatch) {
    var _this = this;
    var $match =  this.$currentMatch;
    var rendered = false;

    return function() {
        var $homegoals = $match.find('.homegoals');
        var $awaygoals = $match.find('.awaygoals');




        if(followMatch) {
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
                        render();
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
                                render();
                                _this.videoIsPlaying = false;
                                _this.nextEvent();
                            })
                            .prop('src', highlight)[0]
                            .play();
                        _this.videoIsPlaying = true;
                    })
                    .on('timeupdate', function() {
                       if(!rendered && this.currentTime / this.duration > 0.5) {
                           console.log("halfway");
                           render();
                           rendered = true;
                       }
                    })
                    .prop('src', highlight)[0]
                    .play();
                _this.videoIsPlaying = true;
            } else {
                render();
                _this.nextEvent();
            }
        } else {
            render();
            _this.nextEvent();
        }

        function render() {
            if(rendered) {
                return;
            }
            //Update the fixturelist
            $homegoals.html(event.homeGoals);
            $awaygoals.html(event.awayGoals);

            //Updates the goal scorers
            if(event.scoringSide === "H") {
                $match.find('.homescorers').append(event.scoringPlayer.name + " (" + event.matchTimeString + (event.ownGoal?' og' : '') + ")<br />");
            } else {
                $match.find('.awayscorers').append(event.scoringPlayer.name  + " (" + event.matchTimeString + (event.ownGoal?' og' : '') + ")<br />");
            }

            //If not an own goal, add scorer to topscorer list
            if(!event.ownGoal) {
                _this.competition.addScorer(event.scoringPlayer);
            }

            //Update the leaguetable with the goal
            _this.competition.update(event, followMatch);
        }
    };
};

/**
 * * EVENT
 * Cleans up highlighting and handles 0-0 draws
 */
ReplayEngine.prototype.endMatch = function() {
    var $hometeam = $('#' + this.currentMatch.data.homeTeam.dbid);
    var $awayteam = $('#' + this.currentMatch.data.awayTeam.dbid);

    this.$currentMatch.removeClass('highlight');
    $hometeam.removeClass('highlight');
    $awayteam.removeClass('highlight');

    //0-0 draws are not processed by the goal event. Take care of them here.
    if(this.currentMatch.data.awayGoals + this.currentMatch.data.homeGoals === 0) {
        this.competition.update(this.currentMatch, this.simulate);
    }

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
ReplayEngine.prototype.addEvent = function(event, followMatch) {
    this.events.push({
        fn: event,
        delay: followMatch ? 2000: 0
    });
};

/**
 * Run the next event in queue
 */
ReplayEngine.prototype.nextEvent = function() {
    this.eventCounter++;
    var _this = this;

    if(this.events[this.eventCounter]) {
        var fn = _this.events[_this.eventCounter].fn;
        var delay = _this.events[_this.eventCounter].delay;

        //Run the first event instantly, and the following events with a delay
        if(this.eventCounter === 0) {
            $.proxy(fn, _this)();
        }
        else
        {
            setTimeout($.proxy(fn, _this), delay);
        }

    } else {
        //All events are processed. Reset the event queue, and process the next match, if any
        this.events = [];
        this.eventCounter = -1;
        var nextMatch = _this.competition.nextMatch();
        if(nextMatch) {
            _this.processMatch(nextMatch);
            _this.nextEvent();
        } else {
            console.log("No more events");
        }
    }
};

