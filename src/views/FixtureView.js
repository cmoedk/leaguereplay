module.exports = FixtureView;

var TableView = require('./TableView.js');
var config = require('../config.js');

function FixtureView(options) {
    TableView.call(this, options);
    this.parent = config.id.fixtures;
    this.render();
}

FixtureView.prototype = Object.create(TableView.prototype);
