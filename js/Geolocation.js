"use strict";

/***************
 * Geolocation *
 ***************/

var Geolocation = (function() {
    var api = {};

    var coords = null;
    var timer = null;

    /**
     * List of callbacks waiting for a position information.
     */
    var waitPositionCallbacks = [];

    /**
     * List of callbacks watching for a position information.
     * The difference with waiting callbacks is that they are called at each position change
     */
    var watchPositionCallbacks = [];

    /**
     * Called whenever the position has succesfully changed
     */
    var successFunction = function(position) {
        coords = position.coords;
        $('.info--content').html(parseFloat(coords.latitude).toFixed(3) + ' - ' + parseFloat(coords.longitude).toFixed(3));

        // Call waiting functions
        var oldWaitPositionCallbacks = waitPositionCallbacks; // avoid loops if callbacks call waitPosition again
        waitPositionCallbacks = [];
        oldWaitPositionCallbacks.forEach(function(callback) {
            callback(coords);
        });

        // Call watching functions
        watchPositionCallbacks.forEach(function(callback) {
            callback(coords);
        });
    };

    /**
     * Called whenever the position watcher failed
     */
    var errorFunction = function(error) {
        coords = null;
        switch (error.code) {
            case error.PERMISSION_DENIED:
                $('.info--content').addClass('error').html("Accès refusé.");
                break;

            case error.POSITION_UNAVAILABLE:
            default:
                $('.info--content').addClass('error').html("Position irrécupérable.");
                break;
        }
    };

    api.init = function() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(successFunction, errorFunction, Config.geolocation);
        } else {
            $('.info--content').addClass('error').html("Votre navigateur ne supporte pas l'API de géolocalisation.");
        }
    };

    /**
     * Wait for the position to be obtained.
     * @param callback Callback called as soon as the position is available
     * and takes the current coordinates as first argument.
     */
    api.waitPosition = function(callback) {
        $('.station-info').html('<p class="center">Attente de la position…</p>');
        if (coords === null) {
            waitPositionCallbacks.push(callback);
        } else {
            callback(coords);
        }
    };

    /**
     * Watch for the position to be obtained.
     * @param callback Callback called as soon as the position is changed
     * and takes the current coordinates as first argument.
     */
    api.watchPosition = function(callback) {
        if (coords === null) {
            watchPositionCallbacks.push(callback);
        } else {
            callback(coords);
        }
    };

    /**
     * Clear the list functions watching for position
     */
    api.noWatchPosition = function() {
        watchPositionCallbacks = [];
    };

    /**
     * Clear the list functions waiting for position
     */
    api.noWaitPosition = function() {
        waitPositionCallbacks = [];
    };

    /**
     * Returns the last recorded position
     */
    api.getPosition = function() {
        return coords;
    };

    return api;
})();
