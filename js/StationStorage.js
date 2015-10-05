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
 * AuthorityStationStorage is a read-only station storage implementation that
 * get information from JCDecaux OpenData API.
 */
var AuthorityStationStorage = function() {
    var api = StationStorage();

    api.name = 'AuthorityStationStorage';

    /**
     * Adapt OpenData API's format to internal station representation.
     * It is important not to be dependant of the API representation in the rest of
     * the code since it can change at any time. Furthermore, it enable an easy
     * adaptation to other systems.
     * It is also a reference to know which fields are available in station object.
     */
    var stationContract = function(raw_station) {
        return {
            address:         raw_station.address,
            availableStands: raw_station.available_bike_stands,
            availableBikes:  raw_station.available_bikes,
            bikeStands:      raw_station.bike_stands,
            banking:         raw_station.banking,
            bonus:           raw_station.bonus,
            contractName:    raw_station.contract_name,
            lastUpdate:      raw_station.last_update,
            name:            raw_station.name,
            number:          raw_station.number,
            position: {
                latitude:    raw_station.position.lat,
                longitude:   raw_station.position.lng
            },
            status:          raw_station.status
        };
    };

    /**
     * Initialize storage by loading stations from OpenData API
     * @retrn promise
     */
    api.load = function() {
        return new Promise(function(resolve, reject) {
            $.getJSON(Config.stationsUrl, function(data, status, jqXHR) {
                // TODO: look at status
                api.stations = data.map(stationContract);
                api.emit('ready');
                api.emit('stations', api.stations);
                resolve(api);
            });
        });
    };

    return api;
};



/**
 * LocalStationStorage uses the browser localStorage to store starred stations and cache station list.
 */
var LocalStationStorage = function() {
    var api = StationStorage();

    api.name = 'LocalStationStorage';

    /**
     * Load station list from local storage
     */
    api.load = function() {
        return Promise.reject('Local storage disabled (See issue #80)')

        return new Promise(function(resolve, reject) {
            if (!localStorage) {
                return reject("Local storage not available");
            }
            var lastUpdate = localStorage.getItem('lastStationsUpdate');
            if (!lastUpdate) {
                return reject("Local storage data has not been initialized");
            }
            if (Date.now() - parseInt(lastUpdate, 10) > Config.localStationStorageTimeout) {
                return reject("Local storage data is considered as obsolated (Config.localStationStorageTimeout = " + Config.localStationStorageTimeout + ")");
            }
            api.stations = JSON.parse(localStorage.getItem('stations'));
            var starredStationsIds = JSON.parse(localStorage.getItem('starredStationsIds'));

            api.starredStations = starredStationsIds.map(function(id) {
                var matches = $.grep(api.stations, function(station) {
                    return station.number == id;
                });
                if (matches.length > 0) {
                    return matches[0];
                } else {
                    reject("Local storage not consistent (Starred Station not found wth id " + id+ ")");
                }
            })

            if (api.starredStations == null) {
                api.starredStations = [];
            }
            api.emit('ready');
            resolve(api);
        });
    };

    /**
     * Serialize station list and save it back to local storage
     */
    api.save = function() {
        // Save only IDs (avoid data replication on persistent storage)
        var starredStationsIds = api.starredStations.map(function(station) {
            return station.number;
        });
        

        localStorage.setItem('stations', JSON.stringify(api.stations));
        localStorage.setItem('starredStationsIds', JSON.stringify(starredStationsIds));
        localStorage.setItem('lastStationsUpdate', Date.now());

        return Promise.resolve();
    };


    return api;
};





/**
 * MockStationStorage is a fake interface for unit tests
 */
var MockStationStorage = function() {
    var api = StationStorage();

    api.name = 'MockStationStorage';

    api.stations = [
        {
            address: "RUE DES CHAMPEAUX (PRES DE LA GARE ROUTIERE) - 93170 BAGNOLET",
            availableStands: 38,
            availableBikes: 11,
            bikeStands: 50,
            banking: true,
            bonus: false,
            contractName: "Paris",
            lastUpdate: 1425980217000,
            name: "31705 - CHAMPEAUX (BAGNOLET)",
            number: 31705,
            position: {
                latitude: 48.8645278209514,
                longitude: 2.416170724425901
            },
            status: "OPEN"
        },
        {
            address: "RUE ERASME",
            availableStands: 23,
            availableBikes: 2,
            bikeStands: 25,
            banking: true,
            bonus: true,
            contractName: "Paris",
            lastUpdate: 1425980217000,
            name: "RUE ERASME",
            number: 101,
            position: {
                latitude: 48.842206,
                longitude: 2.345169
            },
            status: "OPEN"
        }
    ];

    api.starredStations = api.stations;

    api.load = function() {
        return Promise.reject("Mock stations disabled");
    };


    return api;
};




/**
 * StationStorageAdapter is an adapter gathering different sources of information,
 * e.g. JCDecaux OpenData, localStorage and mock test values.
 */
var StationStorageAdapter = function() {
    var api = StationStorage();

    api.name = 'StationStorageAdapter';

    /**
     * List of available storage boxes tu use.
     */
    var substorages = [MockStationStorage(), LocalStationStorage(), AuthorityStationStorage()];

    // Do not access this before ready() resolution
    var currentSubstorage = null;


    /**
     * Reccursively loads storages until one of them is ok
     */
    api.load = function() {
        Log.debug("load", api.name);
        if (api.isLoaded()) {
            return Promise.resolve();
        }

        // Forward events before loading not to miss them
        // To be cleaned up
        substorages.forEach(function(storage) {
            storage.on('stations', function(ev) {
                api.emit('stations', ev);
            });
        });

        // The "-1st" substrorage fails to load cause it doesn't exist
        var loading = Promise.reject(Error("No substorage registered"));

        substorages.forEach(function(storage, i) {
            // If previous substorage failed to load
            loading = loading.catch(function(err){
                if (i > 0) Log.warning("Could not load storage #" + (i - 1) + ": " + err);
                return storage.load();
            });
        });

        loading = loading.then(function(storage) {
            currentSubstorage = storage;
            Log.info("Use storage " + currentSubstorage.name);

            api.emit('ready');

            api.save();
        });

        return loading;
    };


    /**
     * Storage is loaded if there is some available substorage and that this substorage is ready
     */
    api.isLoaded = function() {
        Log.debug("isLoaded", api.name, currentSubstorage);
        return currentSubstorage !== null && currentSubstorage.isLoaded();
    };


    /**
     * Save to each substorage
     */
    api.save = function() {
        var savings = substorages.map(function(storage) {
            storage.stations = currentSubstorage.stations;
            storage.starredStations = currentSubstorage.starredStations;
            storage.save();
        });

        return Promise.all(savings);
    };

    api.getStations = function() {
        Log.debug("getStations");
        return api.ready()
        .then(function() {
            return currentSubstorage.getStations();
        })
    };

    api.getStarredStations = function() {
        return api.ready()
        .then(function() {
            return currentSubstorage.getStarredStations();
        });
    };

    api.getStationById = function(id) {
        return api.ready()
        .then(function() {
            return currentSubstorage.getStationById(id);
        });
    };

    return api;
};
