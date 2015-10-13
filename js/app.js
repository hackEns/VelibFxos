"use strict";

/**********
 * Ready()
 **********/

// Wait for the localization to be done and loaded, and avoid having problems
// with unloaded localization variables.
document.addEventListener("localized", function() {
    $(function() {
        Views.init();
        Geolocation.init();
        Router.route();
    });
});


$(window).on('hashchange', function() {
    Router.route();
});
