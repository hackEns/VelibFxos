"use strict";

/***********
 * Stations
 ***********/

/**
 * Utility functions handling stations
 */
var Stations = (function() {
    var api = {};

    /**
     * Decorate stations with their distance to a position
     * @param stations Station list
     * @param coords Position from which seeing stations
     */
    var computeDistances = function(stations, coords) {
        return stations.map(function(station) {
            station.distance = distance(coords, station.position);
            return station;
        });
    };

    /**
     * Returns the stations ordered by distance to the position identified by coords
     * @param stations Station list
     * @param coords Current position
     */
    var sortByDistance = function(stations, coords) {
        var orderedStations = computeDistances(stations, coords);
        orderedStations.sort(function(a, b) {
            return a.distance - b.distance;
        });
        return orderedStations;
    };

    /**
     * Returns formatted station informations object
     * @param station Station to format
     * @param coords Current position (can be omitted or replace by station's `distance` field)
     */
    api.format = function(station, coords) {
        var formatted = {};

        // Unchanged fields
        formatted.address = station.address;
        formatted.number = station.number;
        formatted.bonus = station.bonus;

        // Availables bikes & stands
        formatted.availableBikes = station.availableBikes;
        formatted.availableStands = station.availableStands;

        // Last update
        if(station.lastUpdate != null) {
            var diff = dateDiff(station.lastUpdate);
            formatted.lastUpdate = formatTime(diff);
        }
        // distance
        if (station.distance || coords) {
            var dist = station.distance || distance(coords, station.position);
            formatted.distance = formatDistance(dist);
        } else {
            formatted.distance = "Chargement...";
        }

        // latitude - longitude
        formatted.position = station.position.latitude.toFixed(2) + ' - ' + station.position.longitude.toFixed(2);

        return formatted;
    };


    /**
     * Sort and filter station list until a given limit.
     * @param stations Station list
     * @param coords Current position
     * @param limit Max amount of stations to return (optionnal)
     * @param filter Filtering function (optionnal)
     * @return sorted filtered sliced station list
     */
    api.filterClosestStations = function(stations, coords, limit, filter) {
        stations = sortByDistance(stations, coords);

        if (filter !== undefined) {
            stations = stations.filter(filter);
        }

        if (limit !== undefined) {
            return stations.slice(0, limit);
        } else {
            return stations;
        }
    };

    return api;
})();
