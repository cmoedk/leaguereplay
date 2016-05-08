var cwd = __dirname;

module.exports = function(api) {
    api.import([
        cwd + '/reset.js',
        cwd + '/main.js'
    ]);
};