var fontFamilies = '"Lato", "Open Sans", "Roboto", Arial, "Lucida Grande", sans-serif';

var colors = {
    darkText: '#33333f',
    lightText: '#fff',
    mediumText: '88888f',
    container: '#f5f5f9',
    border: '#e5e5ef',
    header: '#262934',
    tableBorder: '#eeeef2',
    oddTableRow: '#f8f8fc',
    highlight: '#dfdb40',
    button: {
        normal: '#35c06e',
        hover: '#39ca74',
        playing: '#e74c3c'
    }
};

module.exports = function(api) {
    api.add({
        "*" : {
            boxSizing: "border-box"
        },
        html: {
            height : "100%",
            width : "100%"
        },
        body: {
            height : "100%",
            width : "100%",
            fontFamily: fontFamilies,
            color: colors.darkText
        },
        button: {
            width: "95%",
            backgroundColor: colors.button.normal,
            minHeight: "50px",
            color: colors.lightText,
            fontFamily: fontFamilies,
            border: 0,
            fontWeight: "bold",
            fontSize: "0.9vw",
            marginBottom: "10px",
            display: "inline-block",
            verticalAlign: "middle",
            transition: "background 0.2s ease-in-out",
            ":hover" : {
                backgroundColor: colors.button.hover,
                color : colors.lightText,
                cursor: "pointer"
            },
            ".playing" : {
                backgroundColor: colors.button.playing
            }
        },
        table : {
            width: "100%",
            tr: {
                transition: "all 0.5s",
                '*': {
                    transition: "all 0.5s"
                }
            },
            th: {
                fontWeight: "bold",
                border: "none",
                padding: "15px 0 12px",
                borderBottom: "1px solid " + colors.tableBorder,
                fontSize: "0.7vw"

            },
            td : {
                border: 0,
                textAlign: "center",
                verticalAlign: "middle",
                minWidth: "20px",
                padding: "10px 0",
                fontSize: "0.7vw"
            }
        },
        video :{
            width: "100%",
            height: "auto"
        },
        '#header' : {
            backgroundColor: colors.header,
            height: "5vw",
            '>*' : {
                display: 'inline-block',
                float: "left"
            },
            h2 : {
                width: "25vw",
                color: colors.lightText,
                fontSize: "1.6vw",
                fontWeight: "bold",
                height: "100%",
                lineHeight: "5vw",
                paddingLeft: "20px",
                span: {
                    color: colors.button.normal
                }

            },
            '#content': {
                width: "50vw",
                '#controls' : {
                    paddingTop: "0.75vw",
                    width: "9vw",
                    height: "2vw",
                    float: "right"
                }
            }

        },

        '#container' : {
            width: "100vw",
            height: "56.25vw",
            paddingTop: "30px",
            backgroundColor: colors.container,
            '>div': {
                float: "left",
                overflow: "hidden",
                'h1' : {
                    fontWeight: "bold",
                    fontSize: "0.8vw",
                    width: "100%",
                    padding: "0 10px 13px",
                    borderBottom: "1px solid " + colors.border,
                    textAlign: "left"
                }
            }
        },

        '#stats' : {
            section: {
                width: "24.9vw",
                height: "22vw",
                float: "left",
                border: 0,
                overflow: "hidden",
                padding: "0 30px",
                overflowY: "scroll",
                'th':{
                    fontWeight: 900,
                    ':first-child' : {
                        textAlign: "left",
                        paddingLeft: "10px"
                    }
                },
                tbody : {
                  tr : {
                      ':nth-of-type(odd)' : {
                          background: colors.oddTableRow
                      }
                  }
                },
                td : {
                    ':first-child' : {
                        textAlign: 'left',
                        paddingLeft: "10px"
                    }
                }
            }
        },

        "#player" :{
            height: "28.12vw",
            width: "50vw",
            backgroundColor: "#000",
            margin: "30px 0"
        },
        "#structure":{
            height: "56.25vw",
            width: "25vw",
            padding: "0 30px"

        },
        "#centerdiv" : {
            float: "left",
            width: "50vw"
        },
        "#fixtures": {
            height: "54vw",
            width: "25vw",
            float: "right",
            overflowY: "scroll !important",
            padding: "0 30px"
        },
        ".highlight" : {
            backgroundColor: "#dfdb40",
            fontWeight: "bold",
            color: "#333333"
        }
    });

    //LEAGUE STYLE
    api.add({
        "#structure": {
            table : {
                tr : {
                    ':last-of-type' : {
                        td: {
                            borderBottom: "1px solid " + colors.tableBorder
                        }
                    }
                },
                th : {
                    fontWeight: 900,
                    ':first-child' : {
                        textAlign: "left",
                        paddingLeft: "10px"
                    },
                    ':nth-of-type(odd)' : {
                        background: colors.oddTableRow
                    }
                },
                td : {
                    ":first-child" : {
                        borderLeft: "none",
                        textAlign: "left",
                        paddingLeft: "10px"
                    }
                }
            }
        }
    });

    //FIXTURES STYLE
    api.add({
        "#fixtures": {
            table: {
                tbody: {
                    tr: {
                        ':first-child' : {
                            '.date' : {
                                borderTop: 0
                            }
                        }
                    }
                },
                tr: {
                    ':nth-of-type(odd)' : {
                        background: colors.oddTableRow
                    }
                },
                td: {
                    verticalAlign: "top",
                    paddingBottom: 0,
                    ':nth-of-type(2)' : {
                        fontWeight: "bold",
                        width: "10%"
                    }
                },
                '.date': {
                    fontWeight: "bold",
                    background: colors.container,
                    padding: "15px 0 12px",
                    borderBottom: "1px solid " + colors.tableBorder,
                    borderTop: "1px solid " + colors.tableBorder
                }
            },
            '.hometeam' : {
                paddingLeft: "38px",
                width: "45%",
                textAlign: "left"
            },
            '.awayteam' : {
                paddingRight: "38px",
                width: "45%",
                textAlign: "right"
            },
            ".homescorers": {
                color: colors.mediumText,
                fontSize: "0.5vw",
                fontWeight: "normal",
                textAlign: "left",
                paddingRight: "8px",
                marginTop: "5px",
                marginBottom: "10px",
                lineHeight: "1.3"
            },
            ".awayscorers": {
                color: colors.mediumText,
                fontSize: "0.5vw",
                fontWeight: "normal",
                textAlign: "right",
                paddingLeft: "8px",
                marginTop: "5px",
                marginBottom: "10px",
                lineHeight: "1.3"
            },
            ".highlight": {
                td : {
                    backgroundColor: colors.highlight,
                    fontWeight: "bold",
                    color: colors.darkText,
                    background: '#f6d070' //TODO Check what this does
                },
                ".homescorers": {
                    color: "#5f5e5e"
                },
                ".awayscorers": {
                    color: "#5f5e5e"
                }
            }

        }
    })
};



