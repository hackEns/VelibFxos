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
    var api = {};

    api.stations = null;
    api.starredStations = [];

    /**
     * Initialy loads stations (to be overwritten)
     * @param onsuccess callback Called without argument on success
     * @param onerror Callback called with an error message if loading failed
     */
    api.load = function(onsuccess, onerror) {
        onsuccess();
    };

    /**
     * @returns bool whether the storage has correctly been loaded
     */
    api.isLoaded = function() {
        return api.stations !== null;
    };

    /**
     * Persistentely saves stations (to be overwritten)
     * @param callback Called without argument
     */
    api.save = function(callback) {
        callback();
    };

    /**
     * @param onsuccess callback provided with station list if the query succeeded
     * @param onerror callback provided with on error message if the query failed
     */
    api.getStations = function(onsuccess, onerror) {
        if (!api.isLoaded()) {
            return api.load(
            function() { // on success
                api.getStations(onsuccess, onerror);
            }, onerror);
        }

        return onsuccess(api.stations);
    };

    /**
     * @param onsuccess callback provided with starred station list if the query succeeded
     * @param onerror callback provided with on error message if the query failed
     */
    api.getStarredStations = function(onsuccess, onerror) {
        if (!api.isLoaded()) {
            return api.load(
            function() { // on success
                api.getStarredStations(onsuccess, onerror);
            }, onerror);
        }

        return onsuccess(api.starredStations);
    };

    /**
     * Get station by its Id
     * @param id Station id
     * @param onsuccess callback provided with a full station object if the query succeeded
     * @param onerror callback provided with on error message if the query failed
     */
    api.getStationById = function(id, onsuccess, onerror) {
        if (!api.isLoaded()) {
            return api.load(
            function() { // on success
                api.getStationById(onsuccess, onerror);
            }, onerror);
        }

        var station = $.grep(api.getStations(), function(station) {
            return station.number == id;
        });
        if (station.length != 0) {
            onsuccess(station);
        } else {
            onerror("Station not found wth id " + id);
        }
    };


    return api;
};



/**
 * AutorityStationStorage is a read-only station storage implementation that
 * get information from JCDecaux OpenData API.
 */
var AutorityStationStorage = function() {
    var api = StationStorage();

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
     */
    api.load = function(onsuccess, onerror) {
        $.getJSON(Config.stationsUrl, function(data, status, jqXHR) {
            // TODO: look at status
            api.stations = data.map(stationContract);
            onsuccess();
        });
    };

    return api;
};



/**
 * LocalStationStorage uses the browser localStorage to store starred stations and cache station list.
 */
var LocalStationStorage = function() {
    var api = StationStorage();

    /**
     * Load station list from local storage
     */
    api.load = function(onsuccess, onerror) {
        if (!localStorage) {
            // Local storage not available, fall back to other methods (Autority API)
            return;
        }
        if (Date.now() - parseInt(localStorage.getItem('lastStationsUpdate'),10) > Config.localStationStorageTimeout) {
            onerror("Local storage data is considered as obsolated (Config.localStationStorageTimeout = " + Config.localStationStorageTimeout + ")");
            return;
        }
        api.stations = JSON.parse(localStorage.getItem('stations'));
        api.starredStations = JSON.parse(localStorage.getItem('starredStations'));
        if (api.starredStations == null) {
            api.starredStations = [];
        }
        onsuccess();
    };

    /**
     * Serialize station list and save it back to local storage
     */
    api.save = function(callback) {
        localStorage.setItem('stations', JSON.stringify(api.stations));
        localStorage.setItem('starredStations', JSON.stringify(api.starredStations));
        localStorage.setItem('lastStationsUpdate', Date.now());
        callback();
    };


    return api;
};





/**
 * MockStationStorage is a fake interface for unit tests
 */
var MockStationStorage = function() {
    var api = StationStorage();

    api.stations = [
        {
            address: "RUE DES CHAMPEAUX (PRES DE LA GARE ROUTIERE) - 93170 BAGNOLET",
            availableStands: 38,
            availableBikes: 11,
            bikeStands: 50,
            banking: true,
            bonus: true,
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
                latitude: 48.8643278209514,
                longitude: 2.416170724425901
            },
            status: "OPEN"
        }
    ];

    api.starredStations = api.stations;

    //api.stations = null; // Disables mock storage

    return api;
};




/**
 * StationStorageAdapter is an adapter gathering different sources of information,
 * e.g. JCDecaux OpenData, localStorage and mock test values.
 */
var StationStorageAdapter = function() {
    var api = StationStorage();

    /**
     * List of available storage boxes tu use.
     */
    var substorages = [MockStationStorage(), LocalStationStorage(), AutorityStationStorage()];
    var currentSubstorage = null;



    /**
     * Reccursively loads storages until one of them is ok
     */
    api.load = function(onsuccess, onerror) {
        var recLoadSubstorage = function(i) {
            if (!substorages[i]) {
                onerror("No storage available");
                return;
            }
            substorages[i].load(
                function() {
                    // If successfully loaded, return
                    currentSubstorage = substorages[i];
                    onsuccess();
                }, function(err) {
                    Log.warning("Could not load storage #" + i + ": " + err);
                    // Else, try the next substorage
                    recLoadSubstorage(i + 1);
                }
            );
        };
        recLoadSubstorage(0);
    };


    /**
     * Storage is loaded if there is some available substorage and that this substorage is ready
     */
    api.isLoaded = function() {
        return currentSubstorage !== null && currentSubstorage.isLoaded();
    };


    /**
     * Save to each substorage
     */
    api.save = function(callback) {
        var recSaveSubstorage = function(i) {
            if (!substorages[i]) {
                callback();
                return;
            }
            substorages[i].stations = currentSubstorage.stations;
            substorages[i].starredStations = currentSubstorage.starredStations;
            substorages[i].save(function() {
                recSaveSubstorage(i + 1);
            });
        };
        recSaveSubstorage(0);
    };

    api.getStations = function(onsuccess, onerror) {
        currentSubstorage.getStations(onsuccess, onerror);
    };

    api.getStarredStations = function(onsuccess, onerror) {
        currentSubstorage.getStarredStations(onsuccess, onerror);
    };

    return api;
};
