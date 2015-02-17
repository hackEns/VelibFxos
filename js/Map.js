"use strict";

/********
 * Map
 ********/

var Map = (function() {

    var init = (function(pos) {
        console.log('Map', 'init', 'Map under construction');
        var selectedLayer = 'http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';

        window.map = L.map('map', {
            dragging: false,
            touchZoom: false,
            doubleClickZoom: false,
            scrollWheelZoom: false,
            boxZoom: false,
            keyboard: false,
            zoom: 15
        }).setView([pos.latitude, pos.longitude], 16);

        window.map.panTo([pos.latitude, pos.longitude]);
        //L.marker([pos.latitude, pos.longitude], {opacity: 1.0}).addTo(window.map);
        L.tileLayer(selectedLayer).addTo(window.map);

        console.log('Map', 'init', 'Map built');

        return init;
    });

    return {
        init: init
    };

})();
