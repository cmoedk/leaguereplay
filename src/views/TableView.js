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