"use strict";

/****************
 * Log system
 ****************/

var VERBOSE_LEVEL = 4;

var Log = (function() {
    var api = {};

    // By default, log nothing
    api.error   = function(msg) {};
    api.warning = function(msg) {};
    api.info    = function(msg) {};
    api.detail  = function(msg) {};

    if (VERBOSE_LEVEL > 0) {
        api.error = function(msg) {
            console.log("  ERROR: " + msg);
        };
        console.log("Log: error messages enabled");
    }

    if (VERBOSE_LEVEL > 1) {
        api.warning = function(msg) {
            console.log("WARNING: " + msg);
        }
        console.log("Log: warning messages enabled");
    }

    if (VERBOSE_LEVEL > 2) {
        api.info = function(msg) {
            console.log("   INFO: " + msg);
        }
        console.log("Log: info messages enabled");
    }

    if (VERBOSE_LEVEL > 3) {
        api.detail = function(msg) {
            console.log(" DETAIL: " + msg);
        }
        console.log("Log: detail messages enabled");
    }

    return api;
})();
