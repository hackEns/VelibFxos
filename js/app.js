"use strict"; // see strict mode

var Config = (function () {
    var tiles_provider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
    var api_key = '5eec7c1a3babb6b2abeabb0143c635d2d9aff1c3';
    var stations_base_url = 'https://api.jcdecaux.com/vls/v1/stations?contract=paris&apiKey=';
    var realtime_url = 'https://api.jcdecaux.com/vls/v1/stations/{station_number}?contract=paris&apiKey=';

    return {
        tiles_provider: tiles_provider,
        stations_url: stations_base_url + api_key,
        realtime_url: realtime_url + api_key,
        max_starred_stations: 10
    };
})();

// Bind a last method on Array
if (typeof(Array.prototype.last) != 'function') {
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

// Bind a startswith method on String
if (typeof(String.prototype.startsWith) != 'function') {
    String.prototype.startsWith = function(str) {
      return this.substring(0, str.length) === str;
  };
}

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

    // Returns the current position
    var getPosition = function () {
        return coords;
    };

    return {
        init: init,
        waitPosition: waitPosition,
        noWaitPosition: noWaitPosition,
        getPosition: getPosition
    };
})();


/***********
 * Stations
 ***********/

var Stations = (function() {
    var full_stations_list = null;
    var ordered_stations_list = null;
    var starred_stations_list = null;
    var timer = null;

    // Refresh the JSON of the stations at JCDecaux OpenData API and stores it in localStorage.
    var refresh = function () {
        // Reset stations state to null, while loading the ressource
        full_stations_list = null;
        // Update the stations list
        $.getJSON(window.Config['stations_url'], function (data, status, jqXHR) {
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

        try {
            starred_stations_list = JSON.parse(localStorage.getItem('starred_stations'));
        } catch (e) {
            starred_stations_list = [];
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

    // Converts an angle from degrees to rads
    var deg2rad = function (angle) {
        return angle * Math.PI / 180;
    };

    // Computes the distance between two points identified by latitude / longitude
    var distance = function (coords, station) {
        var latitude1 = deg2rad(coords.latitude);
        var longitude1 = deg2rad(coords.longitude);
        var latitude2 = deg2rad(station.position.lat);
        var longitude2 = deg2rad(station.position.lng);
        var a = Math.pow(Math.sin(latitude2 - latitude1)/2, 2) + Math.cos(latitude1) * Math.cos(latitude2)*Math.pow(Math.sin(longitude2 - longitude1)/2, 2);
        var c = 2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var R = 6371000;
        var distance = R*c;
        return distance;
    };

    // Computes distances for each stations
    var computeDistances = function (list, coords) {
        list = full_stations_list.map(function (item) {
            item["distance"] = distance(coords, item);
            return item;
        });
        return list;
    };

    // Returns the stations ordered by distance to the position identified by coords
    var orderByDistance = function (coords) {
        ordered_stations_list = computeDistances(full_stations_list, coords);
        ordered_stations_list.sort(function (a, b) {
            return a.distance - b.distance;
        });
        return ordered_stations_list;
    };

    // Fetch latest infos for the specified stations
    var fetchStations = function (stations) {
        // TODO
    };

    // Returns `limit` closest stations with up to date infos and a matching criterion
    var getClosestStations = function (coords, limit, filter) {
        if (typeof(limit) == 'undefined') {
            limit = -1;
        }
        else if (typeof(limit) == 'function' && typeof(filter) != 'function') {
            filter = limit;
            limit = -1;
        }
        else {
            limit = parseInt(limit, 10);
        }

        if (limit === NaN) {
            limit = -1;
        }
        if (typeof(filter) == "undefined") {
            filter = function (item) { return true; };
        }

        var stations = orderByDistance(coords);
        var out = [];

        if (limit == -1) {
            out = stations.filter(filter);
        }
        else {
            for (var i = 0; i < stations.length; i++) {
                if (out.length > limit) {
                    break;
                }
                if (filter(stations[i])) {
                    out.push(stations[i]);
                }
            }
        }

        return out;

    };

    // Star / Unstar a station
    var toggleStarStation = function (station_id) {
        var index = starred_stations.indexOf(station_id);
        if (index != -1) {
            starred_stations.splice(index, 1);
        }
        else {
            if (starred_stations.length >= window.Config.max_starred_stations) {
                return false;
            }
            starred_stations.push(station_id);
        }
        localStorage.setItem('starred_stations', JSON.stringify(starred_stations));
        return true;
    };

    // Retrieve the up to date list of starred stations
    var getStarredStations = function (coords) {
        var full_starred_stations_list = [];
        for (var i = 0; i < starred_stations.length; i++) {
            full_starred_stations_list.push($.grep(full_stations_list.grep, function (item) { return item.id == station_id; }));
        }
        full_starred_stations_list = computeDistance(full_starred_stations, coords);
        // TODO : Update
        return full_starred_stations_list;
    };

    // Returns the full list of stations, ordered by distance if available
    var getFullList = function () {
        if (ordered_stations_list !== null) {
            return ordered_stations_list;
        }
        else {
            return full_stations_list;
        }
    };

    return {
        init: init,
        refresh: refresh,
        waitList: waitList,
        noWaitList: noWaitList,
        getClosestStations: getClosestStations,
        toggleStarStation: toggleStarStation,
        getStarredStations: getStarredStations,
        getFullList: getFullList
    };
})();

/********
 * Views
 ********/

var Views = (function () {
    var viewStruct = {};

    var header = (function() {
        // update the header from the views
        var update = function (viewStruct) {
            $('#app-bar').removeClass().addClass(viewStruct.view);
            $('#app-logo').addClass('hidden');

            console.log("App", viewStruct.view, "display header");
            $('#app-bar').addClass(viewStruct.view);
            $('.left-part').html('<').click(function () { window.location.hash = "/index"; });
            $('.bar-title').html(viewStruct.title);
            $('.right-part').html('<img class="entry--logo" alt="" src="img/' + viewStruct.img + '.svg" />');
        };

        return {
            update: update
        };

    })();

    var index = function () {
        Geolocation.noWaitPosition();
        Stations.noWaitList();
        $('#app-bar').addClass('hidden');
        $('#app-logo').removeClass('hidden');
        console.log("App", "Index", "display page");

        $('.station-info').html('' +
            '<div class="entry bikes"><span>vélos<br/>disponibles</span><img class="entry--logo" alt="" src="img/velib.svg" /></div>' +
            '<div class="entry stands"><span>places<br/>libres</span><img class="entry--logo" alt="" src="img/borne.svg" /></div>' +
            '<div class="entry starred"><span>Favoris</span><img class="entry--logo" alt="" src="img/favori.svg" /></div>' +
            '<div class="entry search"><span>Rechercher</span><img class="entry--logo" alt="" src="img/loupe.svg" /></div>');

        $('.entry.bikes').click(function () { window.location.hash = "/bikes"; });
        $('.entry.stands').click(function () { window.location.hash = "/stands"; });
        $('.entry.starred').click(function () { window.location.hash = "/starred"; });
        $('.entry.search').click(function () { window.location.hash = "/search"; });
    };

    var bikes = function () {
        viewStruct.view = "bikes";
        viewStruct.title = "Vélos disponibles";
        viewStruct.img = "velib";

        console.log("App", viewStruct.view, "display page");
        header.update(viewStruct);

        if (Geolocation.waitPosition(bikes) && Stations.waitList(bikes)) {
            var stations = Stations.getClosestStations(Geolocation.getPosition(), 10, function (item) { return item.available_bikes > 0; });
            console.log(stations);
            var html = "<ul>";
            for (var i = 0; i < stations.length; i++) {
                html += "<li>" + stations[i].name + "</li>";
            }
            html += "</ul>";
            $('.station-info').html(html);
        }
    };

    var stands = function () {
        viewStruct.view = "stands";
        viewStruct.title = "Places libres";
        viewStruct.img = "borne";

        console.log("App", viewStruct.view, "display page");
        header.update(viewStruct);

        if (Geolocation.waitPosition(stands) && Stations.waitList(stands)) {
            console.log(Stations.getClosestStations(Geolocation.getPosition(), 10, function (item) { return item.available_bike_stands > 0; }));
            $('.station-info').html('');
        }
    };

    var starred = function () {
        viewStruct.view = "starred";
        viewStruct.title = "Favoris";
        viewStruct.img = "favori";

        console.log("App", viewStruct.view, "display page");
        header.update(viewStruct);

        Geolocation.noWaitPosition();
        if (Stations.waitList(starred)) {
            console.log(Stations.getClosestStations(Geolocation.getPosition(), 10, function (item) { return item.starred > 0; }));
            $('.station-info').html('');
        }
    };

    var search = function () {
        viewStruct.view = "search";
        viewStruct.title = "Rechercher";
        viewStruct.img = "loupe";

        console.log("App", viewStruct.view, "display page");
        header.update(viewStruct);

        Geolocation.noWaitPosition();
        if (Stations.waitList(search)) {
            $('.station-info').html('');
        }
    };

    return {
        index: index,
        bikes: bikes,
        stands: stands,
        starred: starred,
        search: search
    };

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
        else if (hash.startsWith("/starred")) {
            Views.starred();
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
