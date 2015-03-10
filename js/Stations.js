"use strict";

/***********
 * Stations
 ***********/

var Stations = (function() {
    var fullStationList = null;
    var orderedStationList = null;
    var starredStations = new Array();
    var starredStationList = null;
    var timer = null;

    // Refresh the JSON of the stations at JCDecaux OpenData API and stores it in localStorage.
    var refresh = function() {
        // Reset stations state to null, while loading the ressource
        fullStationList = null;
        // Update the stations list
        $.getJSON(window.Config['stations_url'], function(data, status, jqXHR) {
            localStorage.setItem('lastStationsUpdate', Date.now());
            localStorage.setItem('stations', jqXHR.responseText);
            fullStationList = data;
        });
    };

    // Init the full stations list, either from localStorage or by refreshing the list
    var init = function() {
        try {
            fullStationList = JSON.parse(localStorage.getItem('stations'));
        } catch (e) {
            fullStationList = [];
        }

        try {
            starredStationList = JSON.parse(localStorage.getItem('starredStations'));
        } catch (e) {
            starredStationList = [];
        }

        // Update stations list once per month
        var lastStationsUpdate = localStorage.getItem('lastStationsUpdate');
        if (lastStationsUpdate === null || lastStationsUpdate < 30 * 24 * 3600 * 1000 || $.isEmptyObject(fullStationList)) {
            refresh();
        }
    };

    // Wait for the full list to be populated
    var waitList = function(fun) {
        $('.station-info').html('<p class="center">Récupération de la liste des stations…</p>');
        if (fullStationList === null) {
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
        orderedStationList = computeDistances(fullStationList, coords);
        orderedStationList.sort(function(a, b) {
            return a.distance - b.distance;
        });
        return orderedStationList;
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
        formatted.availableBikes = station.availableBikes;
        formatted.availableStands = station.availableStands;

        // Last update
        if(station.lastUpdate != null) {
            var diff = dateDiff(station.lastUpdate);
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
            formatted.lastUpdate = text;
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
    var toggleStarStation = function(stationId) {
        console.log('toggleStarStation', 'starredStations before', starredStations);
        var index = starredStations.indexOf(parseInt(stationId));

        // Star a new station
        if (index != -1) {
            alert('ANIMATION : station retirée');
            starredStations = starredStations.slice(index+1);
        }
        // Unstar a station from favourites
        else {
            if (starredStations.length > window.Config.maxStarredStations) {
                console.log('Stations.js', 'toggleStarStation', 'too much stations are starred');
                return false;
            } else if (starredStations.length <= window.Config.maxStarredStations) {
                alert('ANIMATION : station ajoutée');
                starredStations.push(parseInt(stationId));
            }
        }
        localStorage.setItem('starredStations', JSON.stringify(starredStations));
        console.log('toggleStarStation', 'starredStations after', starredStations);

        return true;
    };

    // Retrieve the up to date list of starred stations
    var getStarredStations = function(coords) {
        var fullStarredStationList = [];
        starredStations = localStorage.getItem('starredStations');

        console.log("Stations", "getStarredStations", "fullStationList", fullStationList);
        console.log("Stations", "getStarredStations", "starredStationList", starredStations);

        fullStarredStationList = $.grep(fullStationList, function(item) {
            return starredStations.indexOf(item.number) != -1;
        });

        console.log("Stations", "getStarredStations", "fullStarredStationList", fullStarredStationList);

        fullStarredStationList = computeDistances(fullStarredStationList, coords);

        console.log("Stations", "getStarredStations", "fullStarredStationList_v2", fullStarredStationList);
        return fullStarredStationList;
    };

    // Returns the full list of stations, ordered by distance if available
    var getFullList = function() {
        if (orderedStationList !== null) {
            return orderedStationList;
        } else {
            return fullStationList;
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
        getFullList: getFullList
    };
})();
