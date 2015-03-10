"use strict";

/****************
 * Configuration
 ****************/

var Config = (function() {
    var tiles_provider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
    var api_key = '5eec7c1a3babb6b2abeabb0143c635d2d9aff1c3';
    var stations_base_url = 'https://api.jcdecaux.com/vls/v1/stations?contract=paris&apiKey=';
    var realtime_url = 'https://api.jcdecaux.com/vls/v1/stations/{station_number}?contract=paris&apiKey=';

    return {
        tiles_provider: tiles_provider,
        stations_url: stations_base_url + api_key,
        realtime_url: realtime_url + api_key,
        max_starred_stations: 10,
        geolocation: {
            enableHighAccuracy: true,
            maximumAge: 10000
        },
        wait_position_timeout: 10000 /* in ms */
    };
})();
