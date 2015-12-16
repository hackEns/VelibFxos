"use strict";

/*****************
 * Mock Stations
 *****************/

/**
 * MockStationProvider is a fake interface for unit tests
 */
var MockStationProvider = function() {
    var api = StationProvider();

    api.name = 'MockStationProvider';

    var stations = [
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

    //var starredStationsIds = stations.map(function(s) {return s.number});
    var starredStationsIds = [5013, 5004, 5015, 22403, 14020, 14115, 14021];

    api.start = function() {
        //api.emit('stations', stations);
        api.emit('starred-stations-ids', starredStationsIds);
    };


    return api;
};

