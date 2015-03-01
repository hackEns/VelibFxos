"use strict";

// Bind a last method on Array
if (typeof(Array.prototype.last) != 'function') {
    Array.prototype.last = function() {
        return this[this.length - 1];
    };
}

// Bind a startswith method on String
if (typeof(String.prototype.startsWith) != 'function') {
    String.prototype.startsWith = function(str) {
        return this.substring(0, str.length) === str;
    };
}

// Returns difference between today and an another date
function dateDiff(date1){
    var diff = {}
    var today = new Date().getTime();
    var tmp = today - date1;

    tmp = Math.floor(tmp/1000);
    diff.sec = tmp % 60;

    tmp = Math.floor((tmp-diff.sec)/60);
    diff.min = tmp % 60;

    tmp = Math.floor((tmp-diff.min)/60);
    diff.hour = tmp % 24;

    tmp = Math.floor((tmp-diff.hour)/24);
    diff.day = tmp;

    console.log('utils.js', 'dateDiff', diff);
    return diff;
}
