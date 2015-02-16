"use strict";

/***************
 * Geolocation *
 ***************/

var Geolocation = (function() {
    var coords = null;
    var timer = null;

    var successFunction = function(position) {
        coords = position.coords;
        $('.info--content').html(parseFloat(coords.latitude).toFixed(3) + ' - ' + parseFloat(coords.longitude).toFixed(3));
    };

    var errorFunction = function(error) {
        switch (error.code) {
            case error.TIMEOUT:
                $('.info--content').addClass('error').html("Timeout.");
                //Restart with a greater timeout
                navigator.geolocation.getCurrentPosition(positionSuccessFunction, positionErrorFunction, {
                    enableHighAccuracy: true,
                    maximumAge: 60000,
                    timeout: 5000
                });
                break;

            case error.PERMISSION_DENIED:
                $('.info--content').addClass('error').html("Accès refusé.");
                break;

            case error.POSITION_UNAVAILABLE:
            default:
                $('.info--content').addClass('error').html("Position irrécupérable.");
                break;
        }
    };

    var init = function() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(successFunction, errorFunction, {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 60000,
                frequency: 10000
            });
        } else {
            $('.info--content').addClass('error').html("Votre navigateur ne supporte pas l'API de géolocalisation.");
        }
    };

    // Wait for the position to be obtained
    var waitPosition = function(fun) {
        $('.station-info').html('<p class="center">Attente de la position…</p>');
        if (coords === null) {
            timer = setTimeout(fun, 250);
            return false;
        } else {
            return true;
        }
    };

    // Disable wait for the position to be obtained
    var noWaitPosition = function() {
        if (timer !== null) {
            clearTimeout(timer);
        }
    };

    // Returns the current position
    var getPosition = function() {
        return coords;
    };

    return {
        init: init,
        waitPosition: waitPosition,
        noWaitPosition: noWaitPosition,
        getPosition: getPosition
    };
})();
