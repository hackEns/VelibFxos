"use strict"; // see strict mode

var tiles_provider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
var stations_url = 'https://api.jcdecaux.com/vls/v1/stations?contract=paris&apiKey=5eec7c1a3babb6b2abeabb0143c635d2d9aff1c3';
var realtime_url = 'https://api.jcdecaux.com/vls/v1/stations/{station_number}?contract=paris&apiKey=5eec7c1a3babb6b2abeabb0143c635d2d9aff1c3'

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

var full_stations_list = null;  // Store the full list of stations
var stations = [];  // Store only the relevant stations

var coords = null;  // Store the position of the user
var map = false;  // Handles minimaps
var slides_container = false;  // Global object for the Slides API

/***************
 * Geolocation *
 ***************/

/**
 * Called on successful geopositionning, sets the coords and build new home page.
 */
function positionSuccessFunction(position) {
    window.coords = position.coords;

    $('.info--content').html(parseFloat(window.coords.latitude).toFixed(3)+' - '+parseFloat(window.coords.longitude).toFixed(3));
}


/**
 * Called on error during geopositionning, displays the error on the home page.
 */
function positionErrorFunction(error) {
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
}

/**
 * Tries to get the current position.
 */
function getPosition() {
    if(navigator.geolocation) {
        navigator.geolocation.watchPosition(positionSuccessFunction, positionErrorFunction, {enableHighAccuracy:true,  maximumAge:10000, timeout:60000, frequency:10000});
    }
    else {
        $('.info--content').addClass('error').html("Votre navigateur ne supporte pas l'API de géolocalisation.");
    }
}


/************
 * API calls
 ************/

/**
 * Retrieve the JSON of the stations at JCDecaux OpenData API and stores it in localStorage.
 */
function retrieveStations() {
    // Reset stations state to null, while loading the ressource
    window.full_stations_list = null;
    // Update the stations list
    $.getJSON(window.stations_url, function (data, status, jqXHR) {
        localStorage.setItem('last_stations_update', Date.now());
        localStorage.setItem('stations', jqXHR.responseText);
        window.full_stations_list = data;
    });
}


/********
 * Views
 ********/

function index() {
    $('.station-info').html('<div class="entry bikes"><span>vélos<br/>disponibles</span><img class="entry--logo" alt="" src="img/velib.svg" /></div><div class="entry stands"><span>places<br/>libres</span><img class="entry--logo" alt="" src="img/borne.svg" /></div><div class="entry stared"><span>Favoris</span><img class="entry--logo" alt="" src="img/favori.svg" /></div><div class="entry search"><span>Rechercher</span><img class="entry--logo" alt="" src="img/loupe.svg" /></div>');

    $('.entry.bikes').click(function () { window.location.hash = "/bikes"; });
    $('.entry.stands').click(function () { window.location.hash = "/stands"; });
    $('.entry.stared').click(function () { window.location.hash = "/stared"; });
    $('.entry.search').click(function () { window.location.hash = "/search"; });
}


/**
 * Wait until the stations list and / or the position could be retrieved.
 */
function requirePositionStations(fun, require_position, require_station) {
    if (require_position && window.coords === null) {
        $('.station-info').html('<p class="center">Attente de la position…</p>');

        setTimeout(fun, 250);
        return false;
    }
    else if (require_station && window.full_stations_list === null) {
        $('.station-info').html('<p class="center">Actualisation de la liste des stations…</p>');

        setTimeout(fun, 250);
        return false;
    }
    else {
        return true;
    }
}


function bikes() {
    if (requirePositionStations(bikes, true, true)) {
        $('.station-info').html('');
    }
}

function stands() {
    if (requirePositionStations(stands, true, true)) {
        $('.station-info').html('');
    }
}

function stared() {
    if (requirePositionStations(stared, false, true)) {
        $('.station-info').html('');
    }
}

function search() {
    if (requirePositionStations(search, false, true)) {
        $('.station-info').html('');
    }
}



/**********
 * Routing
 **********/
function routing() {
    var hash = window.location.hash.substr(1);
    if (hash.startsWith("/bikes")) {
        bikes();
    }
    else if (hash.startsWith("/stands")) {
        stands();
    }
    else if (hash.startsWith("/stared")) {
        stared();
    }
    else if (hash.startsWith("/search")) {
        search();
    }
    else {
        // Index view
        index();
    }
}

$(window).on('hashchange',function() {
    routing();
});


/**********
 * Ready()
 **********/

$(function() {
    // Get the current position
    getPosition();

    // Try to recover the stations list from localStorage
    try {
        window.full_stations_list = JSON.parse(localStorage.getItem('stations'));
    } catch (e) {
        window.full_stations_list = null;
    }

    // Update stations list once per month
    var last_stations_update = localStorage.getItem('last_stations_update');
    if (last_stations_update === null || last_stations_update < 30*24*3600*1000 || $.isEmptyObject(window.full_stations_list)) {
        retrieveStations();
    }

    // Route to correct view
    routing();
});
