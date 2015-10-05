"use strict";

/***************
 * Geolocation *
 ***************/

var Geolocation = (function() {
    var api = window.evt(); // Implements Events interface from evt.js

    var coords = null;
    var timer = null;

    /**
     * Called whenever the position has succesfully changed
     */
    var successFunction = function(position) {
        coords = position.coords;

        // TODO: Move that DOM effect into the View code
        $('.info--content').html(parseFloat(coords.latitude).toFixed(3) + ' - ' + parseFloat(coords.longitude).toFixed(3));

        api.emit('position', coords);// Call waiting and watching functions
    };

    /**
     * Called whenever the position watcher failed
     */
    var errorFunction = function(error) {
        // TODO: Move that DOM effect into the View code
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
            // TODO: Move that DOM effect into the View code
            $('.info--content').addClass('error').html("Votre navigateur ne supporte pas l'API de géolocalisation.");
        }
    };

    /**
     * Wait for the position to be obtained.
     * @param callback Callback called as soon as the position is available
     * and takes the current coordinates as first argument.
     */
    api.waitPosition = function(callback) {
        // TODO: Move that DOM effect into the View code
        $('.station-info').html('<p class="center">Attente de la position…</p>');
        if (coords === null) {
            api.once('position', callback);
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
        api.on('position', callback);
        if (coords !== null) {
            callback(coords);
        }
    };

    /**
     * Returns the last recorded position
     */
    api.getPosition = function() {
        return coords;
    };

    return api;
})();
