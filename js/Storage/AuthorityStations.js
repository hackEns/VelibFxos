"use strict";

/*********************
 * Authority Stations
 *********************/

/**
 * AuthorityStationProvider is a station provider implementation that
 * get information from JCDecaux OpenData API.
 */
var AuthorityStationProvider = function() {
    var api = StationProvider();

    api.name = 'AuthorityStationProvider';

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
     * Job ran everytime the data times out.
     */
    var downloadAllStations = function() {
        // TODO: avoid performing multiple queries to the API at the same time
        $.getJSON(Config.stationsUrl, function(data, status, jqXHR) {
            // TODO: look at status
            var stations = data.map(stationContract);
            api.emit('stations', stations);
        });
    };

    var job;

    api.start = function() {
        if (job === undefined) {
            setTimeout(downloadAllStations(), 1000);
            //job = setInterval(downloadAllStations, Config.AuthorityStationProviderInterval);
        }
    };

    api.stop = function() {
        clearInterval(job);
        job = undefined;
    };

    return api;
};


