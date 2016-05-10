module.exports = {
    /**
     * Formats a date from unix timestamp
     * @param timestamp - Unix timestamp in milliseconds
     */
    formatDate: function(timestamp){
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

        var date = new Date(timestamp);

        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();

        var text = day + ' ' + monthNames[monthIndex] + ' ' + year;
        var id = day + monthNames[monthIndex] + year;

        return {
            'text' : text,
            'id' : id
        }
    },

    teamClass: function(teamId) {
        return 'team' + teamId;
    },
    matchId: function(matchId) {
        return 'match' + matchId;
    },
    sortTable : function(table, sortOrder) {
        var parent = table.parent();

        //When updating the table dynamically, this method works best in sorting correctly
        table.remove().appendTo(parent).tablesorter( {
            sortList: sortOrder
        });
    },
    removeVal: function (arr) {
        var what, a = arguments, L = a.length, ax;
        while (L > 1 && arr.length) {
            what = a[--L];
            while ((ax= arr.indexOf(what)) !== -1) {
                arr.splice(ax, 1);
            }
        }
        return arr;
    },
    findOne: function (haystack, arr) {
        return arr.some(function (v) {
            return haystack.indexOf(v) >= 0;
        });
    }
};