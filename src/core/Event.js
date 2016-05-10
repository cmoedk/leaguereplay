module.exports = Event;

var config = require('../config.js');
/**
 *
 * @param options
 * @constructor
 */
function Event(options) {
    this.fn = options.fn;
    this.delay = options.delay || 0;
    this.canSimulate = !!options.canSimulate;
    this.refreshTable = !!options.refreshTable;
}


