"use strict";

/******************
 * Local Stations
 ******************/

/**
 * LocalStationProvider uses the browser localStorage to get starred station and cache station list.
 */
var LocalStationProvider = function() {
    var api = StationProvider();

    api.name = 'LocalStationProvider';

    /**
     * Load station list from local storage
     * Emit event only once
     */
    api.start = function() {
        if (!localStorage) {
            return 'Local storage not available';
        }

        var lastUpdate = localStorage.getItem('lastStationsUpdate');

        if (!lastUpdate) {
            return 'Local storage data has not been initialized';
        }

        if (Date.now() - parseInt(lastUpdate, 10) > Config.localStationStorageTimeout) {
            return 'Local storage data is considered as obsolated (Config.localStationStorageTimeout = ' + Config.localStationStorageTimeout + ')';
        }

        var stations = JSON.parse(localStorage.getItem('stations'));

        stations.forEach(function(station) {
            station.availableBikes = '?';
            station.availableStands = '?';
        });

        api.emit('stations', stations);

        var starredStationsIds = JSON.parse(localStorage.getItem('starredStationsIds')) || [];
        api.emit('starred-stations-ids', starredStationsIds);
    };

    return api;
};


/**
 * LocalStationSaver stores stations to localStorage for starred stations and faster access.
 */
var LocalStationSaver = function() {
    var api = {};

    api.saveStations = function(stations) {
        localStorage.setItem('stations', JSON.stringify(stations));
        localStorage.setItem('lastStationsUpdate', Date.now());
    };

    api.saveStarredStationsIds = function(starredStationsIds) {
        localStorage.setItem('starredStationsIds', JSON.stringify(starredStationsIds));
    };

    return api;
};
