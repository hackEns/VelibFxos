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
    
    //Init map for bikes and stands view
    var init_circle = (function(pos) {
        console.log('Map', 'init', 'Map under construction');
        var selectedLayer = 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

        window.map = L.map('map', {
            dragging: true,
            touchZoom: true,
            doubleClickZoom: false,
            scrollWheelZoom: false,
            boxZoom: true,
            keyboard: false,
            zoomControl: true,
            zoom: 16
        }).setView([pos.latitude, pos.longitude], 16);

        window.map.panTo([pos.latitude, pos.longitude]);
        L.tileLayer(selectedLayer).addTo(window.map);
        
        console.log('Map', 'init', 'Map built');

        return init_circle;
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
    
    /* add two markers on map
    * 1: current position
    * 2: one Closest station
    */
    var addMarker = (function(pos, activeStation) {
        //1st marker = current possition
        L.marker([pos.latitude, pos.longitude], {
                clickable: false,
                draggable: false,
                title: 'Vous êtes ici !'
            }).addTo(window.map);
        //console.log('Map', 'Add marker', 'on get position');
        
        //2nd marker : closest station 
        L.marker(activeStation[0].position, {
                clickable: true,
                draggable: false,
                title: activeStation[0].address,
                alt: activeStation[0].name,
                address: activeStation[0].address,
                number: activeStation[0].number
            }).addTo(window.map).on('click', function (e) {
                // Click on marker for more details about the station
                window.location.hash = "/station/" + e.target.options.number;
            });
        //console.log('Map', 'Add marker', 'Closest station');

        return addMarker;
    });

    return {
        init: init,
        init_circle: init_circle,
        addMarkers: addMarkers,
        addMarker: addMarker
    };

})();
