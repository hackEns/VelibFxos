"use strict";

/******************
 * Station Storage
 ******************/


/**
 * StationStorage is a basic station storage box.
 * Several boxes inherit from this one and StationStorageAdapter
 * is then used to access all of them depending on their availability.
 */
var StationStorage = function() {
    var api = window.evt(); // Implements Events interface from evt.js

    api.name = 'StationStorage';

    api.stations = null;
    api.starredStations = [];

    /**
     * Initially loads stations (to be overwritten)
     * MUST NOT be called more than once
     * @return Promise on the loaded storage
     */
    api.load = function() {
        Log.debug("load", api.name);
        if (api.stations !== null) {
            api.emit('ready');
            return Promise.resolve(api);
        } else {
            return Promise.reject('No station found');
        }
    };

    /**
     * Ensure that the storage has been loaded
     * @return Promise
     */
    api.ready = function() {
        Log.debug("ready", api.name);
        if (api.isLoaded()) {
            return Promise.resolve();
        } else {
            return new Promise(function(resolve, reject) {
                api.once('ready', function() {
                    resolve(api)
                });
            });
        }
    }

    /**
     * @returns bool whether the storage has correctly been loaded
     */
    api.isLoaded = function() {
        Log.debug("isLoaded", api.name);
        return api.stations !== null;
    };

    /**
     * Persistentely saves stations (to be overwritten)
     * @return Promise
     */
    api.save = function() {
        return Promise.resolve();
    };

    /**
     * @return Promise on full stations list
     */
    api.getStations = function() {
    return api.ready()
        .then(function() {
            return api.stations;
        });
    };

    /**
     * @return Promise on starred stations list
     */
    api.getStarredStations = function() {
        return api.ready()
        .then(function() {
            return api.starredStations;
        });
    };

    /**
     * Get station by its Id
     * @param id Station id
     * @return Promise on station whose number is `id`
     */
    api.getStationById = function(id) {
    return api.ready()
        .then(function() {
            return api.getStations()
        })
        .then(function(allStations) {
            var stations = $.grep(allStations, function(station) {
                return station.number == id;
            });
            if (stations.length > 0) {
                return Promise.resolve(stations[0]);
            } else {
                return Promise.reject("Station not found wth id " + id);
            }
        });
    };


    return api;
};


/**
 * Minimalistic station object handling events
 */
function StationEntry() {
    return window.evt(this);
}


/**
 * StationStorageAdapter is an adapter gathering different sources of information,
 * e.g. JCDecaux OpenData, localStorage and mock test values.
 */
var StationStorageAdapter = function() {
    var api = StationStorage();

    api.name = 'StationStorageAdapter';

    var stationsDict = {};
    var addToDict = function(stations) {
        console.log(stations);
        // Stations to send to StationStorage listeners
        var newEntries = [];

        stations.forEach(function(station) {
            var isUpdated = false;
            var stationEntry = stationsDict[station.number];
            var isNew = stationEntry === undefined;


            stationEntry = stationEntry || new StationEntry();

            for (var key in station) {
                if (stationEntry[key] != station[key]) {
                    isUpdated = true;
                    stationEntry[key] = station[key];
                }
            }

            stationsDict[station.number] = stationEntry;
            if (isUpdated) stationEntry.emit('update');
            if (isNew) newEntries.push(stationEntry);
        });

        if (newEntries.length > 0) {
            api.emit('stations', newEntries);
        }
    }

    /**
     * List of available storage boxes tu use.
     */
    var providers = [MockStationProvider(), LocalStationProvider(), AuthorityStationProvider()];

    /**
     * Reccursively loads storages until one of them is ok
     */
    api.load = function() {
        Log.debug("load", api.name);
        if (api.isLoaded()) {
            return Promise.resolve();
        }

        // Forward events before loading not to miss them
        providers.forEach(function(provider) {
            provider.on('stations', function(stations) {
                addToDict(stations);
            });

            provider.on('starredStationsIds', function(starredStationsIds) {
                api.emit('starredStationsIds', starredStationsIds);
            });

            provider.start();
        });
    };

    // Debug function!
    api.emitAllStation = function() {
        var stations = [];
        for (var key in stationsDict) {
            stations.push(stationsDict[key]);
        }
        api.emit('stations', stations);
    }

    return api;
};
