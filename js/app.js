"use strict";

/**********
 * Ready()
 **********/

$(function() {
	Views.init();
    Geolocation.init();
    Router.route();
});

$(window).on('hashchange', function() {
    Router.route();
});
