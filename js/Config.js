"use strict";

/****************
 * Configuration
 ****************/

var Config = (function() {
    var tileProvider = 'http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg';
    //var tileProvider = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var apiKey = '5eec7c1a3babb6b2abeabb0143c635d2d9aff1c3';
    var stationsBaseUrl = 'https://api.jcdecaux.com/vls/v1/stations?contract=paris&apiKey=';
    var realtimeUrl = 'https://api.jcdecaux.com/vls/v1/stations/{station_number}?contract=paris&apiKey=';

    return {
        tileProvider: tileProvider,
        stationsUrl: stationsBaseUrl + apiKey,
        realtimeUrl: realtimeUrl + apiKey,
        max_starred_stations: 10,
        geolocation: {
            enableHighAccuracy: true,
            maximumAge: 10000
        },
        waitPositionTimeout: 1000,  // in ms
        waitStationsTimeout: 1000,  // in ms
        AuthorityStationProviderInterval: 120*1000,  // in ms
        localStationStorageTimeout: 30 * 24 * 3600 * 1000,  // in ms
        defaultPosition: [48.85666, 2.35083],  // default position if there is no geolocation
        defaultZoom: 16,  // Default zoom level if there is no geolocation
        maxDistanceFromCity: 10,  // in km, if further than this distance to defaultPosition, will not pan the map to current position
        leafletConfig: {  // Leafleat settings, `zoomControl` will be overwritten
            dragging: true,
            touchZoom: true,
            doubleClickZoom: true,
            scrollWheelZoom: true,
            boxZoom: true,
            keyboard: true,
            zoom: 16
        }
    };
})();
