"use strict"; // see strict mode

var config = (function () {
    var tiles_provider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
    var api_key = '5eec7c1a3babb6b2abeabb0143c635d2d9aff1c3';
    var stations_base_url = 'https://api.jcdecaux.com/vls/v1/stations?contract=paris&apiKey=';
    var realtime_url = 'https://api.jcdecaux.com/vls/v1/stations/{station_number}?contract=paris&apiKey=';

    return {
        tiles_provider: tiles_provider,
        stations_url: stations_base_url + api_key,
        realtime_url: realtime_url + api_key
    }
})();

// Bind a last method on Array
if (typeof(Array.prototype.last) != 'function') {
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

// Bind a startswith method on String
if (typeof( String.prototype.startsWith) != 'function') {
    String.prototype.startsWith = function( str ) {
      return this.substring( 0, str.length ) === str;
    }
};

/**************
 * Global vars
 **************/

var stations = [];  // Store only the relevant stations

var map = false;  // Handles minimaps
var slides_container = false;  // Global object for the Slides API

/***************
 * Geolocation *
 ***************/

var Geolocation = (function () {
    var coords = null;
    var timer = null;

    var successFunction = function (position) {
        coords = position.coords;
        $('.info--content').html(parseFloat(coords.latitude).toFixed(3)+' - '+parseFloat(coords.longitude).toFixed(3));
    };

    var errorFunction = function (error) {
        switch(error.code) {
            case error.TIMEOUT:
                $('.info--content').addClass('error').html("Timeout.");
                //Restart with a greater timeout
                navigator.geolocation.getCurrentPosition(positionSuccessFunction, positionErrorFunction, {enableHighAccuracy:true,  maximumAge:60000, timeout:5000});
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

    var init = function () {
        if(navigator.geolocation) {
            navigator.geolocation.watchPosition(successFunction, errorFunction, {enableHighAccuracy:true,  maximumAge:10000, timeout:60000, frequency:10000});
        }
        else {
            $('.info--content').addClass('error').html("Votre navigateur ne supporte pas l'API de géolocalisation.");
        }
    };

    // Wait for the position to be obtained
    var waitPosition = function (fun) {
        $('.station-info').html('<p class="center">Attente de la position…</p>');
        if (coords === null) {
            timer = setTimeout(fun, 250);
            return false;
        }
        else {
            return true;
        }
    };

    // Disable wait for the position to be obtained
    var noWaitPosition = function () {
        if (timer !== null) {
            clearTimeout(timer);
        }
    };

    return {
        init: init,
        waitPosition: waitPosition,
        noWaitPosition: noWaitPosition
    };
})();


/***********
 * Stations
 ***********/

var Stations = (function() {
    var full_stations_list = null;
    var timer = null;

    // Get the full stations list
    var getFullList = function () {
        return full_stations_list;
    };

    // Refresh the JSON of the stations at JCDecaux OpenData API and stores it in localStorage.
    var refresh = function () {
        // Reset stations state to null, while loading the ressource
        full_stations_list = null;
        // Update the stations list
        $.getJSON(window.config['stations_url'], function (data, status, jqXHR) {
            localStorage.setItem('last_stations_update', Date.now());
            localStorage.setItem('stations', jqXHR.responseText);
            full_stations_list = data;
        });
    };

    // Init the full stations list, either from localStorage or by refreshing the list
    var init = function () {
        try {
            full_stations_list = JSON.parse(localStorage.getItem('stations'));
        } catch (e) {
            full_stations_list = null;
        }

        // Update stations list once per month
        var last_stations_update = localStorage.getItem('last_stations_update');
        if (last_stations_update === null || last_stations_update < 30*24*3600*1000 || $.isEmptyObject(full_stations_list)) {
            refresh();
        }
    };

    // Wait for the full list to be populated
    var waitList = function (fun) {
        $('.station-info').html('<p class="center">Récupération de la liste des stations…</p>');
        if (full_stations_list === null) {
            timer = setTimeout(fun, 250);
            return false;
        }
        else {
            return true;
        }
    };

    // Disable wait for the full list to be populated
    var noWaitList = function () {
        if (timer !== null) {
            clearTimeout(timer);
        }
    };

    return {
        getFullList: getFullList,
        init: init,
        refresh: refresh,
        waitList: waitList,
        noWaitList: noWaitList
    };
})();


/********
 * Views
 ********/

var Views = (function () {
    var index = function () {
        Geolocation.noWaitPosition();
        Stations.noWaitList();
        $('.station-info').html('<div class="entry bikes"><span>vélos<br/>disponibles</span><img class="entry--logo" alt="" src="img/velib.svg" /></div><div class="entry stands"><span>places<br/>libres</span><img class="entry--logo" alt="" src="img/borne.svg" /></div><div class="entry stared"><span>Favoris</span><img class="entry--logo" alt="" src="img/favori.svg" /></div><div class="entry search"><span>Rechercher</span><img class="entry--logo" alt="" src="img/loupe.svg" /></div>');

        $('.entry.bikes').click(function () { window.location.hash = "/bikes"; });
        $('.entry.stands').click(function () { window.location.hash = "/stands"; });
        $('.entry.stared').click(function () { window.location.hash = "/stared"; });
        $('.entry.search').click(function () { window.location.hash = "/search"; });
    };

    var bikes = function () {
        if (Geolocation.waitPosition(bikes) && Stations.waitList(bikes)) {
            $('.station-info').html('');
        }
    };

    var stands = function () {
        if (Geolocation.waitPosition(stands) && Stations.waitList(stands)) {
            $('.station-info').html('');
        }
    };

    var stared = function () {
        Geolocation.noWaitPosition();
        if (Stations.waitList(stared)) {
            $('.station-info').html('');
        }
    };

    var search = function () {
        Geolocation.noWaitPosition();
        if (Stations.waitList(search)) {
            $('.station-info').html('');
        }
    };

    return {
        index: index,
        bikes: bikes,
        stands: stands,
        stared: stared,
        search: search
    }
})();


/**********
 * Routing
 **********/
var Routing = (function () {
    var route = function () {
        var hash = window.location.hash.substr(1);
        if (hash.startsWith("/bikes")) {
            Views.bikes();
        }
        else if (hash.startsWith("/stands")) {
            Views.stands();
        }
        else if (hash.startsWith("/stared")) {
            Views.stared();
        }
        else if (hash.startsWith("/search")) {
            Views.search();
        }
        else {
            // Index view
            Views.index();
        }
    };

    return {
        route: route
    };
})();


/**********
 * Ready()
 **********/

$(function() {
    Geolocation.init();
    Stations.init();
    Routing.route();
});

$(window).on('hashchange',function() {
    Routing.route();
});
