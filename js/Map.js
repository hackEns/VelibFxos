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
            scrollWheelZoom: true,
            boxZoom: true,
            keyboard: false,
            zoomControl: false,
            touchZoom: true,
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
        var myIcon = '';

        for(var i=0; i < stations.length; i++) {

            // Set icon for each markers
            myIcon = L.divIcon({
                className: 'mapIcon',
                html:  '<div class="avail_bikes">' + stations[i].available_bikes + '</div>'
                        + '<div class="avail_bike_stands">' + stations[i].available_bike_stands + '</div>'
            });

            // Set markers
            L.marker( stations[i].position, {
                icon: myIcon,
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
