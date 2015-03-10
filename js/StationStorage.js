"use strict";

/******************
 * Station Storage
 ******************/


/**
 * StationStorage is a basic station storage box
 */
var StationStorage = function() {
    var api = {};

    api.stations = null;
    api.starredStations = [];

    /**
     * Initialy loads stations (to be overwritten)
     * @param callback Called without argument
     */
    api.load = function(callback) {
        callback();
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
     * @return station list
     */
    api.getStations = function() {
        return api.stations;
    };

    /**
     * @return starred station list
     */
    api.getStarredStations = function() {
        return api.starredStations;
    };

    /**
     * Get station by its Id
     * @param id Station id
     * @return full station object
     */
    api.getStationById = function(id) {
        return $.grep(api.getStations(), function(station) {
            return station.number == id;
        });
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
                lat:         raw_station.position.lat,
                lng:         raw_station.position.lng
            },
            status:          raw_station.status
        };
    };

    /**
     * Initialize storage by loading stations from OpenData API
     */
    api.load = function(callback) {
        $.getJSON(window.Config['stations_url'], function(data, status, jqXHR) {
            api.stations = data.map(stationContract);
            callback();
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
    api.load = function(callback) {
        if (Date.now() - parseInt(localStorage.getItem('lastStationsUpdate'), 10) > Config.localStationStorageTimeout) {
            // Return now because local storage is considered as obsolated
            callback();
            return;
        }
        api.stations = JSON.parse(localStorage.getItem('stations'));
        api.starredStations = JSON.parse(localStorage.getItem('starredStations'));
        if (api.starredStations === null) {
            api.starredStations = [];
        }
        callback();
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
            available_bike_stands: 38,
            available_bikes: 11,
            bike_stands: 50,
            banking: true,
            bonus: true,
            contract_name: "Paris",
            last_update: 1425980217000,
            name: "31705 - CHAMPEAUX (BAGNOLET)",
            number: 31705,
            position: {
                lat: 48.8645278209514,
                lng: 2.416170724425901
            },
            status: "OPEN"
        }
    ];

    api.stations = null; // Disables mock storage

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
    api.load = function(callback) {
        var recLoadSubstorage = function(i) {
            if (!substorages[i]) {
                callback();
                return;
            }
            substorages[i].load(function() {
                if (substorages[i].isLoaded()) {
                    // If successfully loaded, return
                    currentSubstorage = substorages[i];
                    callback();
                } else {
                    // Else, try the next substorage
                    recLoadSubstorage(i + 1);
                }
            });
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

    api.getStations = function() {
        return currentSubstorage.getStations();
    }

    api.getStarredStations = function() {
        return currentSubstorage.getStarredStations();
    }

    return api;
};
