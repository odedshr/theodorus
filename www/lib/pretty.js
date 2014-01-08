/*
 * JavaScript Pretty Date
 * Copyright (c) 2011 John Resig (ejohn.org)
 * Licensed under the MIT and GPL licenses.
 */

// Takes an ISO time and returns a string representing how
// long ago the date represents.
function prettyDate(time){
    var date = new Date((time || "")),//.replace(/-/g,"/").replace(/[TZ]/g," ") => this appeared in the original code, it reset timezones...
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);

    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 ) {
        return time;
    }

    return day_diff == 0 && (
            diff < 60 && "just-now" ||
            diff < 120 && "a-minute-ago" ||
            diff < 240 && "two-minutes-ago" ||
            diff < 900 && Math.floor( diff / 60 ) + "-minutes-ago" ||
            diff < 1800 && "quarter-of-an-hour-ago" ||
            diff < 2400 && "half-of-an-hour-ago" ||
            diff < 3600 && Math.floor( diff / 60 ) + "-minutes-ago" ||
            diff < 7200 && "an-hour-ago" ||
            diff < 1440 && "two-hours-ago" ||
            diff < 86400 && Math.floor( diff / 3600 ) + "-hours-ago") ||
        day_diff == 1 && "yesterday" ||
        day_diff == 2 && "two-days-ago" ||
        day_diff < 7 && day_diff + "-days-ago" ||
        day_diff < 14 && "a-week-ago" ||
        day_diff < 21 && "two-weeks-ago" ||
        day_diff < 31 && Math.ceil( day_diff / 7 ) + "-weeks-ago";
}

/*
 @return string based on the pattern dd/mm/yyyy, hh:mm
 */
function normalizeDate(dateString) {
    var d = new Date(dateString);
    return (d.getDate() + "/" + ("0" + (d.getMonth() + 1)).slice(-2) + "/" + d.getFullYear() +", "+ d.getHours()+":"+ d.getMinutes());
}

// If jQuery is included in the page, adds a jQuery plugin to handle it as well
if ( typeof jQuery != "undefined" ) {
    jQuery.fn.prettyDate = function(){
        return this.each(function(){
            var date = prettyDate(this.title);
            if ( date )
                jQuery(this).text( date );
        });
    };
} else if (typeof exports !== "undefined") {
    exports.prettyDate = prettyDate.bind(prettyDate);
    exports.normalizeDate = normalizeDate.bind(normalizeDate);
}