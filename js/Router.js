"use strict";

/*********
 * Router
 *********/

/*
 * Router uses the page hash to load the appropriate view.
 */

var Router = (function() {
    var route = function() {
        Views.header.enableHeaderDisplay();
        Views.footer.enableFooterDisplay();
        var hash = window.location.hash.substr(1);

        if (hash.startsWith("/bikes")) {
            Views.bikes();
        } else if (hash.startsWith("/stands")) {
            Views.stands();
        } else if (hash.startsWith("/starred")) {
            Views.starred();
        } else if (hash.startsWith("/search")) {
            Views.search();
        } else if (hash.startsWith("/station")) {
            Views.station();
        } else {
            // Index view
            Views.index();
            Views.header.disableHeaderDisplay();
            Views.footer.disableFooterDisplay();
        }
    };

    return {
        route: route
    };
})();
