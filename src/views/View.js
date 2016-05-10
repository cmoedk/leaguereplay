module.exports = View;

function View(viewList) {
    this.viewList = viewList;
}

View.prototype.render = function() {
    for (var i = 0; i < this.viewList.length; i++) {
        this.viewList[i].render();
    }
};