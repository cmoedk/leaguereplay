/* http://meyerweb.com/eric/tools/css/reset/
 v2.0 | 20110126
 License: none (public domain)
 Modified to AbsurdJS by Christian Moe 20160426
 */

var reset = {};

var tags = ["html", "body", "div", "span", "applet", "object", "iframe",
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote", "pre",
    "a", "abbr", "acronym", "address", "big", "cite", "code",
    "del", "dfn", "em", "img", "ins", "kbd", "%%q", "s", "samp",
    "small", "strike", "strong", "sub", "sup", "%%tt", "var",
    "b", "u", "i", "center", "dl", "dt", "dd", "ol", "ul", "li",
    "fieldset", "form", "label", "legend",
    "table", "caption", "tbody", "tfoot", "thead", "tr", "th", "td",
    "article", "aside", "canvas", "details", "embed",
    "figure", "figcaption", "footer", "header", "hgroup",
    "menu", "nav", "output", "ruby", "section", "summary",
    "time", "mark", "audio", "video"];


for(var i = 0; i < tags.length; i++) {
    reset[tags[i]] = {
        margin: 0,
        padding: 0,
        border: 0,
        fontSize: "100%",
        font: "inherit",
        verticalAlign: "baseline"
    };
}

/* HTML5 display-role reset for older browsers */
reset.article.display = reset.aside.display = reset.details.display =
reset.figcaption.display = reset.figure.display = reset.footer.display =
reset.header.display = reset.hgroup.display = reset.menu.display =
reset.nav.display = reset.section.display = "block";

reset.body.lineHeight = 1;


reset.ol.listStyle = "none";
reset.ul.listStyle = "none";

reset.blockquote.quotes = "none";
reset['%%q'].quotes = "none";

var quoteTags = ["blockquote", "%%q"];

for(i = 0; i < quoteTags.length; i++) {
    reset[quoteTags[i]][":before"] = {
        content: '',
        "%%content": "none"
    };
    reset[quoteTags[i]][":after"] = {
        content: '',
        "%%content": "none"
    }

}

reset.table.borderCollapse = "collapse";
reset.table.borderSpacing = 0;

module.exports = function(api) {
    api.add(reset);
};
