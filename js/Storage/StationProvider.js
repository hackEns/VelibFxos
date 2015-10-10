"use strict";

/*******************
 * Station Provider
 *******************/


/**
 * StationProvider is a basic station provider box.
 * Several boxes inherit from this one, depending on the type of provider
 * (online web API, local storage, mock data)
 *
 * Those boxes are not in charge of caching anything. They just fire events
 * as soon as they receive data (which cannot happend before their start()
 * method has been called)
 *
 * The StationStorage then take care of saving those data and merging new
 * information from different providers.
 *
 * Event emitted are:
 *
 *   * 'stations': providing an unordered list of stations
 *   * 'starred-stations-ids': providing an unordered list of station IDs.
 */
var StationProvider = function() {
    var api = window.evt(); // Implements Events interface from evt.js

    api.name = 'StationProvider';

    /**
     * Init providing processus, and so start eventually firing events
     * @return error (undefined if no error)
     */
    api.start = function() {};

    /**
     * Stop all providing processus, and stop firing events (may take some time
     * be effective, as some actions may be asynchronous).
     * @return error (undefined if no error)
     */
    api.stop = function() {};

    return api;
};

