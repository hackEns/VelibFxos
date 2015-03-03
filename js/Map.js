"use strict";

/********
 * Map
 ********/

var Map = (function() {

    // Init the map
    var init = (function(pos) {
        console.log('Map', 'init', 'Map under construction');
        var selectedLayer = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        window.map = L.map('map', {
            dragging: true,
            touchZoom: false,
            doubleClickZoom: false,
            scrollWheelZoom: false,
            boxZoom: false,
            keyboard: false,
            zoomControl: false,
            zoom: 16
        }).setView([pos.latitude, pos.longitude], 16);

        // search plugin
        console.log('Map', 'init', 'Search plugin is available');
        var osmGeocoder = new L.Control.OSMGeocoder();
        map.addControl(osmGeocoder);

        window.map.panTo([pos.latitude, pos.longitude]);
        L.tileLayer(selectedLayer).addTo(window.map);

        console.log('Map', 'init', 'Map built');

        return init;
    });

    // Add all markers to the Map
    var addMarkers = (function(pos) {
        console.log('Map', 'Add markers');
        var stations = Stations.getFullList();
        for(var i=0; i < stations.length; i++) {
            L.marker( stations[i].position, {
                clickable: true,
                draggable: false,
                title: stations[i].address,
                alt: stations[i].name,
                address: stations[i].address,
                number: stations[i].number
            }).addTo(window.map).on('click', function (e) {
                // Click on marker for more details about the station
                window.location.hash = "/station/" + e.target.options.number;
            });
        }

        return addMarkers;
    });

    return {
        init: init,
        addMarkers: addMarkers
    };

})();
