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
    api.debug  = function(msg) {};

    function argumentsToArray(args) {
        return Array.prototype.slice.call(args);
    }

    if (VERBOSE_LEVEL > 0) {
        api.error = function() {
            var args = argumentsToArray(arguments);
            args.unshift("  ERROR: ");
            console.log.apply(console, args);
        };
        console.log("Log: error messages enabled");
    }

    if (VERBOSE_LEVEL > 1) {
        api.warning = function() {
            var args = argumentsToArray(arguments);
            args.unshift("WARNING: ");
            console.log.apply(console, args);
        }
        console.log("Log: warning messages enabled");
    }

    if (VERBOSE_LEVEL > 2) {
        api.info = function() {
            var args = argumentsToArray(arguments);
            args.unshift("   INFO: ");
            console.log.apply(console, args);
        }
        console.log("Log: info messages enabled");
    }

    if (VERBOSE_LEVEL > 3) {
        api.debug = function() {
            var args = argumentsToArray(arguments);
            args.unshift("  DEBUG: ");
            console.log.apply(console, args);
        }
        console.log("Log: debug messages enabled");
    }

    return api;
})();
