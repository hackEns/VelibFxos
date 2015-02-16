"use strict";

/**********
 * Ready()
 **********/

$(function() {
    Geolocation.init();
    Stations.init();
    Router.route();
});

$(window).on('hashchange', function() {
    Router.route();
});
