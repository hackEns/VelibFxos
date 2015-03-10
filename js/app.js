"use strict";

/**********
 * Ready()
 **********/

$(function() {
		Views.init();
    Geolocation.init();
    Stations.init();
    Router.route();
});

$(window).on('hashchange', function() {
    Router.route();
});
