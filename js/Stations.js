"use strict";

/***********
 * Stations
 ***********/

var Stations = (function() {
    var full_stations_list = null;
    var starred_stations = new Array();
    var ordered_stations_list = null;
    var starred_stations_list = null;
    var timer = null;

    // Refresh the JSON of the stations at JCDecaux OpenData API and stores it in localStorage.
    var refresh = function() {
        // Reset stations state to null, while loading the ressource
        full_stations_list = null;
        // Update the stations list
        $.getJSON(window.Config['stations_url'], function(data, status, jqXHR) {
            localStorage.setItem('last_stations_update', Date.now());
            localStorage.setItem('stations', jqXHR.responseText);
            full_stations_list = data;
        });
    };

    // Init the full stations list, either from localStorage or by refreshing the list
    var init = function() {
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
        if (last_stations_update === null || last_stations_update < 30 * 24 * 3600 * 1000 || $.isEmptyObject(full_stations_list)) {
            refresh();
        }
    };

    // Wait for the full list to be populated
    var waitList = function(fun) {
        $('.station-info').html('<p class="center">Récupération de la liste des stations…</p>');
        if (full_stations_list === null) {
            timer = setTimeout(fun, 250);
            return false;
        } else {
            return true;
        }
    };

    // Disable wait for the full list to be populated
    var noWaitList = function() {
        if (timer !== null) {
            clearTimeout(timer);
        }
    };

    // Converts an angle from degrees to rads
    var deg2rad = function(angle) {
        return angle * Math.PI / 180;
    };

    // Computes the distance between two points identified by latitude / longitude
    var distance = function(coords, station) {
        var latitude1 = deg2rad(coords.latitude);
        var longitude1 = deg2rad(coords.longitude);
        var latitude2 = deg2rad(station.position.lat);
        var longitude2 = deg2rad(station.position.lng);
        var a = Math.pow(Math.sin(latitude2 - latitude1) / 2, 2) + Math.cos(latitude1) * Math.cos(latitude2) * Math.pow(Math.sin(longitude2 - longitude1) / 2, 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var R = 6371000;
        var distance = R * c;
        return distance;
    };

    // Computes distances for each stations
    var computeDistances = function(list, coords) {
        list = list.map(function(item) {
            item["distance"] = distance(coords, item);
            return item;
        });
        return list;
    };

    // Returns the stations ordered by distance to the position identified by coords
    var orderByDistance = function(coords) {
        ordered_stations_list = computeDistances(full_stations_list, coords);
        ordered_stations_list.sort(function(a, b) {
            return a.distance - b.distance;
        });
        return ordered_stations_list;
    };

    // Fetch latest infos for the specified stations
    var fetchStations = function(stations) {
        // TODO
    };

    // Returns details from a specific station
    var getStationDetails = function(id) {
        var elements = getFullList();
        var element = $.grep(elements, function(v) {
            return v.number == id;
        });

        console.log('Stations', 'getStationDetails', element);
        return element;
    };

    // Returns formatted station informations object
    var getFormattedStation = function(station) {
        var formatted = {};

        console.log('Station.js', 'getFormattedStation In', station);

        // Station address and number
        formatted.address = station.address;
        formatted.number = station.number;

        // Availables bikes & stands
        formatted.available_bikes = station.available_bikes;
        formatted.available_bike_stands = station.available_bike_stands;

        // Last update
        if(station.last_update != null) {
            var diff = dateDiff(station.last_update);
            var text = "";

            if (diff.day > 1)
                text = diff.day + ' jours';
            else if (diff.day == 1)
                text = diff.day + ' jour';
            else if (diff.hour > 1)
                text = diff.day + ' heures';
            else if (diff.hour == 1)
                text = diff.day + ' heure';
            else if (diff.min > 1)
                text = diff.day + ' minutes';
            else if (diff.min == 1)
                text = diff.day + ' minute';
            else if (diff.sec > 1)
                text = diff.day + ' secondes';
            else if (diff.sec == 1)
                text = diff.day + ' seconde';
            else
                text = 'un instant';
            formatted.last_update = text;
        }
        // distance
        formatted.distance = (parseFloat(station.distance)/1000).toFixed(2) + " km";

        // lat - lng
        formatted.position = station.position.lat.toFixed(2) + ' - ' + station.position.lng.toFixed(2);

        console.log('Station.js', 'getFormattedStation Out', formatted);

        return formatted;
    };

    // Returns `limit` closest stations with up to date infos and a matching criterion
    var getClosestStations = function(coords, limit, filter) {
        if (typeof(limit) == 'undefined') {
            limit = -1;
        } else if (typeof(limit) == 'function' && typeof(filter) != 'function') {
            filter = limit;
            limit = -1;
        } else {
            limit = parseInt(limit, 10);
        }

        if (limit === NaN) {
            limit = -1;
        }
        if (typeof(filter) == "undefined") {
            filter = function(item) {
                return true;
            };
        }

        var stations = orderByDistance(coords);
        var out = [];

        if (limit == -1) {
            out = stations.filter(filter);
        } else {
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
    var toggleStarStation = function(station_id) {
        var index = starred_stations.indexOf(station_id);
        if (index != -1) {
            starred_stations.splice(index, 1);
        } else {
            if (starred_stations.length >= window.Config.max_starred_stations) {
                return false;
            }
            starred_stations.push(parseInt(station_id));
        }
        localStorage.setItem('starred_stations', JSON.stringify(starred_stations));
        console.log("Stations", "toggleStarStation", localStorage.getItem('starred_stations'));
        return true;
    };

    // Retrieve the up to date list of starred stations
    var getStarredStations = function(coords) {
        var full_starred_stations_list = [];
        starred_stations = (localStorage.getItem('starred_stations') != '' && localStorage.getItem('starred_stations') != null)  ? JSON.parse(localStorage.getItem('starred_stations')) : new Array();

        full_starred_stations_list = $.grep(full_stations_list, function(item) {
            return starred_stations.indexOf(item.number) != -1;
        });

        full_starred_stations_list = computeDistances(full_starred_stations_list, coords);
        // TODO : Update
        
        return full_starred_stations_list;
    };

    // Returns the full list of stations, ordered by distance if available
    var getFullList = function() {
        if (ordered_stations_list !== null) {
            return ordered_stations_list;
        } else {
            return full_stations_list;
        }
    };

    return {
        init: init,
        refresh: refresh,
        waitList: waitList,
        noWaitList: noWaitList,
        getStationDetails: getStationDetails,
        getFormattedStation: getFormattedStation,
        getClosestStations: getClosestStations,
        toggleStarStation: toggleStarStation,
        getStarredStations: getStarredStations,
        getStationDetails: getStationDetails,
        getFullList: getFullList
    };
})();
