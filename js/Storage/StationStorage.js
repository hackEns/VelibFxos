"use strict";

/******************
 * Station Storage
 ******************/



/**
 * Minimalistic station object handling events
 */
function StationEntry() {
    return window.evt(this);
}


/**
 * Add b fields to a object.
 * @return true if a changed
 */
function mixin(a, b) {
    var update = false;
    for (var key in b) {
        if (a[key] != b[key]) {
            update = true;
            a[key] = b[key];
        }
    }
    return update;
}



/**
 * StationStorage is a basic station storage box.
 * Several boxes inherit from this one and StationStorageAdapter
 * is then used to access all of them depending on their availability.
 */
var StationStorage = function() {
    var api = window.evt(); // Implements Events interface from evt.js

    api.name = 'StationStorage';


    /**
     * List of available provider boxes tu use.
     */
    var providers = [MockStationProvider(), LocalStationProvider(), AuthorityStationProvider()];

    /**
     * List of available saver boxes tu use.
     */
    var savers = [LocalStationSaver()];


    /**
     * Internal private memory
     */
    var stationsPool = {};
    var starredStationsPool = {}; // We use only the keys of this

    /**
     * Internal event handlers
     */
    var onNewStations = function(stations) {
        // Stations to send to StationStorage listeners
        var newEntries = [];

        // For each new station, we add it to the internal hash if it does not
        // exist yet and fire an 'update' event if it has been modified.
        stations.forEach(function(station) {
            var stationEntry = stationsPool[station.number];
            var isNew = stationEntry === undefined;
            stationEntry = stationEntry || new StationEntry();

            // Update station entry
            var isUpdated = mixin(stationEntry, station)

            //TODO: buggy if (isUpdated) stationEntry.emit('update');
            if (isNew) newEntries.push(stationEntry);

            stationsPool[station.number] = stationEntry;
        });

        // Forward new entries only to listeners
        if (newEntries.length > 0) {
            api.emit('stations', newEntries);
        }
    };

    var onNewStarredStationsIds = function(starredStationsIds) {
        var newStations = [];
        var unknownIds = [];

        starredStationsIds.forEach(function(id) {
            // If the corresponding station has not been loaded yet, postpone
            if (stationsPool[id] === undefined) {
                unknownIds.push(id);
                return;
            }

            // If new star, forward to listeners
            if (!starredStationsPool[id]) {
                newStations.push(stationsPool[id]);
            }

            starredStationsPool[id] = true;
        });

        // Forward new entries only to listeners
        if (newStations.length > 0) {
            api.emit('starred-stations', newStations);
        }

        if (unknownIds.length > 0) {
            // Handle remaining stations after new stations have been loaded
            api.once('stations', function(stations) {
                onNewStarredStationsIds(unknownIds);
            });
        }
    };


    /**
     * Attach to all station providers
     */
    api.start = function() {
        // Automatic saving
        api.on('stations', function() {
            api.saveStations();
        });
        api.on('starred-stations', function() {
            api.saveStarredStationsIds();
        });

        // When a new callback is attached, imadiately provide it the result of
        // past events.
        // Avoid firing empty events to avoid flushing `once` listeners.
        api.on('attach-on-stations', function(cb) {
            var stations = api.getStations();
            if (stations != []) cb(stations);
        });
        api.on('attach-on-starred-stations', function(cb) {
            var starredStations = api.getStarredStations();
            if (starredStations != []) cb(starredStations);
        });

        // Listen to raw providers
        providers.forEach(function(provider) {
            provider.on('stations', onNewStations);
            provider.on('starred-stations-ids', onNewStarredStationsIds);
            provider.start();
        });
    };


    /**
     * If possible, avoid using this and listen to the 'stations' events that
     * provides stations as soon as they arrive.
     */
    api.getStations = function() {
        var stations = [];
        for (var key in stationsPool) {
            stations.push(stationsPool[key]);
        }
        return stations;
    };


    /**
     * If possible, avoid using this and listen to the 'starred-stations' events that
     * provides stations as soon as they arrive.
     */
    api.getStarredStationsIds = function() {
        var stations = [];
        for (var key in starredStationsPool) {
            stations.push(key);
        }
        return stations;
    };


    /**
     * If possible, avoid using this and listen to the 'starred-stations' events that
     * provides stations as soon as they arrive.
     */
    api.getStarredStations = function() {
        var stations = [];
        for (var key in starredStationsPool) {
            stations.push(stationsPool[key]);
        }
        return stations;
    };


    /**
     * Get station by its Id
     * @param id Station id
     * @return Promise on station whose number is `id`
     */
    api.getStationById = function(id) {
        return new Promise(function(resolve, reject) {
            var grepStation = function(stations) {
                stations.forEach(function(station) {
                    if (station.number == id) {
                        api.off('stations', grepStation);
                        resolve(station);
                    };
                })
            };

            api.on('stations', grepStation);

            setTimeout(function() {
                api.off('stations', grepStation);
                reject('Search station by ID timed out (timeout: ' + Config.searchStationTimeout + ')');
            }, Config.searchStationTimeout);
        });
    };


    /**
     * Persistentely saves stations to every registered savers
     * @param stations to store (all stations if omitted)
     * @return Promise
     */
    api.saveStations = function(stations) {
        stations = stations || api.getStations();

        return Promise.all(savers.map(function(saver) {
            return saver.saveStations(stations);
        }));
    };


    /**
     * Persistentely saves starred stations to every registered savers
     * @param stations ids to store to starred stations (all stations if omitted)
     * @return Promise
     */
    api.saveStarredStationsIds = function(starredStationsIds) {
        starredStationsIds = starredStationsIds || api.getStarredStationsIds();

        return Promise.all(savers.map(function(saver) {
            return saver.saveStarredStationsIds(starredStationsIds);
        }));
    };


    /**
     * Save all cached values
     * @return Promise
     */
    api.save = function() {
        return Promise.all([
            api.saveStations(),
            api.saveStarredStationsIds()
        ]);
    };


    return api;
};
