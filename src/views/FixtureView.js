module.exports = FixtureView;

var TableView = require('./TableView.js');
var config = require('../config.js');

function FixtureView(options) {
    options.parent = config.id.FIXTURES;
    TableView.call(this, options);
}

FixtureView.prototype = Object.create(TableView.prototype);
