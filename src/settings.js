var config = require('./config.js');

module.exports = {
    DEFAULT_COMP_ID: 0, //ID for the default competition on page load
    DEFAULT_STATS: [config.TOPSCORERS], //Stats shown during the replay
    FOLLOW_TEAMS: [], //Array containing ids for the teams to follow
    PLAYER_HIGHLIGHT_DURATION: 3000, //Time in milliseconds the player is highlighted in stats, when updated
    SCROLL_TO_MATCH_DURATION: 2000, //Time in milliseconds scrolling from one date to the next
    EVENT_DELAY: 1500 //Time between events
};